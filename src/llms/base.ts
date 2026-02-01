export interface RerankInput {
  query: string;
  chunks: {
    id: string;
    content: string;
    metadata: Record<string, any>;
  }[];
  topK: number;
}

export interface AnswerInput {
  query: string;
  context: string;
}

export interface LLMPlugin {
  name: string;

  rerank?(input: RerankInput): Promise<string[]>;

  answer(input: AnswerInput): Promise<string>;
}
