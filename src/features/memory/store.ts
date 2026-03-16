import { randomUUID } from "node:crypto";
import type { Memory, PrismaClient, Prisma } from "@prisma/client";
import type { OpenAIEmbedder } from "../ai/embedding";
import type { MemoryFilters, OwnedEntity } from "./schemas";

const EMBEDDING_DIM = 1536;

export interface ScoredMemory extends Omit<Memory, "embedding"> {
  score: number;
}

export class MemoryStore {
  constructor(
    private db: PrismaClient,
    private embedder: OpenAIEmbedder,
  ) {}

  async insert(params: {
    content: string;
    embedding?: number[] | null;
    userId: string;
    companionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const { content, embedding, userId, companionId, metadata } = params;
    const id = randomUUID();
    const vec = embedding ?? (await this.embedder.embed(content));
    assertEmbeddingDim(vec);

    await this.db.$executeRawUnsafe(
      `INSERT INTO memories (id, content, embedding, "userId", "companionId", metadata)
       VALUES ($1, $2, $3::vector, $4, $5, $6::jsonb)`,
      id,
      content,
      toVectorStr(vec),
      userId,
      companionId,
      JSON.stringify(metadata ?? {}),
    );

    return id;
  }

  async update(
    params: OwnedEntity & {
      content: string;
      embedding: number[];
    },
  ): Promise<void> {
    const { id, content, embedding, userId } = params;
    assertEmbeddingDim(embedding);

    const affected = await this.db.$executeRawUnsafe(
      `UPDATE memories
       SET content = $1, embedding = $2::vector
       WHERE id = $3 AND "userId" = $4`,
      content,
      toVectorStr(embedding),
      id,
      userId,
    );

    if (affected === 0) throw new Error(`Memory ${id} not found`);
  }

  async remove(params: OwnedEntity): Promise<void> {
    const { id, userId } = params;
    const { count } = await this.db.memory.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new Error(`Memory ${id} not found`);
  }

  async removeAll(params: MemoryFilters): Promise<void> {
    await this.db.memory.deleteMany({ where: toWhere(params) });
  }

  async findById(params: OwnedEntity): Promise<Memory | null> {
    const { id, userId } = params;
    return this.db.memory.findUnique({ where: { id, userId } });
  }

  async findAll(params: MemoryFilters & { limit: number }): Promise<Memory[]> {
    const { limit, ...filters } = params;
    return this.db.memory.findMany({
      where: toWhere(filters),
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async searchByVector(params: {
    embedding: number[];
    filters: MemoryFilters;
    threshold?: number;
    limit?: number;
  }): Promise<ScoredMemory[]> {
    const { embedding, filters, threshold, limit = 20 } = params;
    assertEmbeddingDim(embedding);

    const queryParams: unknown[] = [toVectorStr(embedding)];
    const conditions: string[] = [];

    queryParams.push(filters.userId);
    conditions.push(`"userId" = $${queryParams.length}`);

    if (filters.companionId) {
      queryParams.push(filters.companionId);
      conditions.push(`"companionId" = $${queryParams.length}`);
    }

    if (typeof threshold === "number") {
      queryParams.push(threshold);
      conditions.push(
        `1 - (embedding <=> $1::vector) >= $${queryParams.length}`,
      );
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    queryParams.push(limit);

    return this.db.$queryRawUnsafe<ScoredMemory[]>(
      `SELECT id, content, "userId", "companionId", metadata,
            "createdAt", "updatedAt",
            1 - (embedding <=> $1::vector) AS score
     FROM memories
     ${whereClause}
     ORDER BY embedding <=> $1::vector
     LIMIT $${queryParams.length}`,
      ...queryParams,
    );
  }
}

function toVectorStr(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

function assertEmbeddingDim(vec: number[]): void {
  if (vec.length !== EMBEDDING_DIM) {
    throw new Error(
      `Expected embedding of dimension ${EMBEDDING_DIM}, got ${vec.length}`,
    );
  }
}

function toWhere(filters: MemoryFilters): Prisma.MemoryWhereInput {
  const where: Prisma.MemoryWhereInput = {
    userId: filters.userId,
  };
  if (filters.companionId) where.companionId = filters.companionId;
  return where;
}
