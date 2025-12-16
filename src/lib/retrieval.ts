export interface KBEntry {
  id: string;
  title: string;
  text: string;
}

export interface RankedDocument {
  id: string;
  title: string;
  text: string;
  score: number; // 0..1
}

type TokenizeOptions = {
  stopwords?: string[];
};

export const DEFAULT_STOPWORDS: string[] = [
  'the',
  'a',
  'an',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'for',
  'with',
  'is',
  'are',
  'was',
  'were',
  'be',
  'by',
  'at',
  'as',
  'it',
  'this',
  'that',
];

export function tokenize(text: string, options?: TokenizeOptions): string[] {
  const stopwords = options?.stopwords ?? [];

  const cleaned = text
    .toLowerCase()
    // sve što nije slovo/broj pretvaramo u razmak
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim();

  if (!cleaned) return [];

  const tokens = cleaned.split(/\s+/);

  if (stopwords.length === 0) {
    return tokens;
  }

  const stop = new Set(stopwords);
  return tokens.filter((t) => !stop.has(t));
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  const total = tokens.length || 1;
  for (const [term, count] of tf.entries()) {
    tf.set(term, count / total); // normalizovana frekvencija
  }
  return tf;
}

function inverseDocumentFrequency(docsTokens: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  const docCount = docsTokens.length || 1;

  for (const tokens of docsTokens) {
    const uniq = new Set(tokens);
    for (const term of uniq) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, docFreq] of df.entries()) {
    // klasičan IDF sa smoothingom
    const value = Math.log((docCount + 1) / (docFreq + 1)) + 1;
    idf.set(term, value);
  }
  return idf;
}

function buildTfIdfVector(tf: Map<string, number>, idf: Map<string, number>): Map<string, number> {
  const vector = new Map<string, number>();
  for (const [term, tfValue] of tf.entries()) {
    const idfValue = idf.get(term) ?? 0;
    const tfidf = tfValue * idfValue;
    if (tfidf !== 0) {
      vector.set(term, tfidf);
    }
  }
  return vector;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, valA] of a.entries()) {
    normA += valA * valA;
    const valB = b.get(term);
    if (valB !== undefined) {
      dot += valA * valB;
    }
  }

  for (const valB of b.values()) {
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Rankira KB dokumente po TF-IDF kosinusnoj sličnosti u odnosu na query.
 *
 * - tokenizacija je case-insensitive i čisti interpunkciju
 * - stopwords filtriranje uključeno podrazumevano (DEFAULT_STOPWORDS)
 * - skorovi su deterministični i uvek 0..1
 */
export function rankDocuments(query: string, docs: KBEntry[], topK: number): RankedDocument[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || topK <= 0 || docs.length === 0) {
    return [];
  }

  const docsTokens = docs.map((doc) =>
    tokenize(`${doc.title} ${doc.text}`, { stopwords: DEFAULT_STOPWORDS }),
  );
  const queryTokens = tokenize(trimmedQuery, { stopwords: DEFAULT_STOPWORDS });

  if (queryTokens.length === 0) {
    // query se sveo na stopwords → nema smisla rangiranje
    return [];
  }

  const idf = inverseDocumentFrequency(docsTokens);
  const queryTf = termFrequency(queryTokens);
  const queryVec = buildTfIdfVector(queryTf, idf);

  const scored: RankedDocument[] = docs.map((doc, idx) => {
    const tf = termFrequency(docsTokens[idx]);
    const vec = buildTfIdfVector(tf, idf);
    const rawScore = cosineSimilarity(queryVec, vec);
    const normalizedScore = Math.max(0, Math.min(1, rawScore || 0));

    return {
      id: doc.id,
      title: doc.title,
      text: doc.text,
      score: normalizedScore,
    };
  });

  // determinističan sort:
  // 1) score DESC
  // 2) title ASC
  // 3) id ASC
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const titleCmp = a.title.localeCompare(b.title);
    if (titleCmp !== 0) return titleCmp;
    return a.id.localeCompare(b.id);
  });

  return scored.slice(0, topK);
}
