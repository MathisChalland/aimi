import type { Memory, PrismaClient } from "@prisma/client";
import { MemoryStore } from "./store";
import type { OpenAIEmbedder } from "../ai/embedding";
import type { OpenAILLM } from "../ai/llm";
import {
  type MemoryConfig,
  type MemoryItem,
  type SearchResult,
  type AddMemoryInput,
  type SearchMemoryInput,
  type ListMemoryInput,
  type DeleteAllMemoryInput,
  factExtractionSchema,
  memoryActionSchema,
  memoryConfigSchema,
  type OwnedEntity,
  type MemoryFilters,
} from "./schemas";
import { getFactRetrievalMessages, getUpdateMemoryMessages } from "./prompts";
import type { BaseMessage } from "../ai/schemas";

export class MemoryService {
  private config: MemoryConfig;
  private store: MemoryStore;

  constructor(
    private db: PrismaClient,
    private embedder: OpenAIEmbedder,
    private llm: OpenAILLM,
    config?: Partial<MemoryConfig>,
  ) {
    this.store = new MemoryStore(db, embedder);
    this.config = memoryConfigSchema.parse(config ?? {});
  }

  async add(input: AddMemoryInput): Promise<SearchResult> {
    const { messages, userId, companionId, metadata } = input;

    return this.addWithInference({
      messages,
      filters: { userId, companionId },
      metadata,
      userId,
    });
  }

  async search(input: SearchMemoryInput): Promise<SearchResult> {
    const filters = {
      userId: input.userId,
      companionId: input.companionId,
    };
    const embedding = await this.embedder.embed(input.query);
    const rows = await this.store.searchByVector({
      embedding,
      filters,
      threshold: input.threshold,
      limit: input.limit,
    });

    return {
      results: rows.map((r) => ({
        ...toMemoryItem(r),
        score: r.score,
      })),
    };
  }

  async get(params: OwnedEntity): Promise<MemoryItem | null> {
    const row = await this.store.findById(params);
    return row ? toMemoryItem(row) : null;
  }

  async getAll(input: ListMemoryInput): Promise<SearchResult> {
    const rows = await this.store.findAll(input);
    return { results: rows.map(toMemoryItem) };
  }

  async update(
    params: OwnedEntity & { data: string },
  ): Promise<{ message: string }> {
    const { id, userId, data } = params;
    const embedding = await this.embedder.embed(data);
    await this.store.update({ id, userId, content: data, embedding });
    return { message: "Memory updated successfully" };
  }

  async delete(params: OwnedEntity): Promise<{ message: string }> {
    await this.store.remove(params);
    return { message: "Memory deleted successfully" };
  }

  async deleteAll(input: DeleteAllMemoryInput): Promise<{ message: string }> {
    await this.store.removeAll(input);
    return { message: "Memories deleted successfully" };
  }

  private async addWithInference(params: {
    messages: BaseMessage[];
    filters: MemoryFilters;
    metadata: Record<string, unknown>;
    userId: string;
  }): Promise<SearchResult> {
    const { messages, filters, metadata, userId } = params;

    const conversation = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");
    const { facts } = await this.extractFacts(conversation);
    if (facts.length === 0) return { results: [] };

    const factVectors = await Promise.all(
      facts.map(async (fact) => ({
        fact,
        vec: await this.embedder.embed(fact),
      })),
    );

    const embeddings = Object.fromEntries(
      factVectors.map(({ fact, vec }) => [fact, vec]),
    );

    const searchResults = await Promise.all(
      factVectors.map(({ vec }) =>
        this.store.searchByVector({ embedding: vec, filters, limit: 5 }),
      ),
    );

    const seen = new Set<string>();
    const existing: Array<{ id: string; text: string }> = [];

    for (const rows of searchResults) {
      for (const row of rows) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          existing.push({ id: row.id, text: row.content });
        }
      }
    }

    // Map real IDs to sequential temp IDs (prevents LLM hallucination)
    const idMap = new Map<string, string>();
    existing.forEach((mem, idx) => {
      idMap.set(String(idx), mem.id);
      mem.id = String(idx);
    });

    const { memory: actions } = await this.reconcileMemories({
      existing,
      newFacts: facts,
    });

    const settled = await Promise.allSettled(
      actions.map((action) =>
        this.executeAction({
          action,
          embeddings,
          idMap,
          filters,
          metadata,
          userId,
        }),
      ),
    );

    const results = settled
      .filter(
        (r): r is PromiseFulfilledResult<MemoryItem | null> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value)
      .filter((item): item is MemoryItem => item !== null);

    for (const r of settled) {
      if (r.status === "rejected") {
        console.error("Failed to process memory action:", r.reason);
      }
    }

    return { results };
  }

  private async executeAction(params: {
    action: { event: string; id: string; text: string };
    embeddings: Record<string, number[]>;
    idMap: Map<string, string>;
    filters: MemoryFilters;
    metadata: Record<string, unknown>;
    userId: string;
  }): Promise<MemoryItem | null> {
    const { action, embeddings, idMap, filters, metadata, userId } = params;

    switch (action.event) {
      case "ADD": {
        const id = await this.store.insert({
          content: action.text,
          embedding: embeddings[action.text] ?? null,
          ...filters,
          metadata,
        });
        return this.get({ id, userId });
      }
      case "UPDATE": {
        const realId = idMap.get(action.id);
        if (!realId) return null;
        const vec =
          embeddings[action.text] ?? (await this.embedder.embed(action.text));
        await this.store.update({
          id: realId,
          userId,
          content: action.text,
          embedding: vec,
        });
        return this.get({ id: realId, userId });
      }
      case "DELETE": {
        const realId = idMap.get(action.id);
        if (!realId) return null;
        await this.store.remove({ id: realId, userId });
        return null;
      }
      default:
        return null;
    }
  }

  private async extractFacts(conversation: string) {
    const [system, user] = this.config.customPrompt
      ? [this.config.customPrompt, `Input:\n${conversation}`]
      : getFactRetrievalMessages(conversation);

    return this.llm.generate({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      schema: factExtractionSchema,
      schemaName: "fact_extraction",
    });
  }

  private async reconcileMemories(params: {
    existing: Array<{ id: string; text: string }>;
    newFacts: string[];
  }) {
    const { existing, newFacts } = params;
    return this.llm.generate({
      messages: [
        { role: "user", content: getUpdateMemoryMessages(existing, newFacts) },
      ],
      schema: memoryActionSchema,
      schemaName: "memory_reconciliation",
    });
  }
}

function toMemoryItem(row: Memory): MemoryItem {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    userId: row.userId,
    companionId: row.companionId,
    metadata: row.metadata as Record<string, unknown>,
  };
}
