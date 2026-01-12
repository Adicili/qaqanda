export type LlmKbOutput = {
  title: string;
  text: string;
  tags: string[];
};

export function validateLlmKbOutput(data: unknown): LlmKbOutput {
  if (typeof data !== 'object' || data === null) {
    throw new Error('LLM output is not an object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== 'string' || obj.title.trim() === '') {
    throw new Error('Invalid or missing title');
  }

  if (typeof obj.text !== 'string' || obj.text.trim() === '') {
    throw new Error('Invalid or missing text');
  }

  if (!Array.isArray(obj.tags) || obj.tags.some((t) => typeof t !== 'string')) {
    throw new Error('Invalid or missing tags');
  }

  return {
    title: obj.title,
    text: obj.text,
    tags: obj.tags,
  };
}
