import OpenAI from "openai";
import type { EmbeddingModel } from "openai/resources/embeddings.mjs";

export class OpenAIEmbedder {
  private client: OpenAI;
  private model: EmbeddingModel;

  constructor(opts: { apiKey: string; model?: EmbeddingModel }) {
    this.client = new OpenAI({ apiKey: opts.apiKey });
    this.model = opts.model ?? "text-embedding-3-large";
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
      dimensions: 1536,
      encoding_format: "float",
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) throw new Error("No embedding returned from OpenAI");

    return embedding;
  }
}
