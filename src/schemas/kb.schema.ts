// schemas/kb.schema.ts
import { z } from 'zod';

/**
 * Striktna šema za AI-generated KB entry.
 * - STRICT: odbija dodatna polja
 * - LIMITI: štite DB + UI
 * - DETERMINISTIČNA: testovi se mogu osloniti na shape
 */
export const KbEntrySchema = z
  .object({
    title: z.string().min(1, 'title is required').max(120, 'title too long'),

    text: z.string().min(1, 'text is required').max(20_000, 'text too long'),

    tags: z
      .array(
        z
          .string()
          .min(1)
          .max(32)
          .regex(/^[a-z0-9-_]+$/, 'invalid tag format'),
      )
      .max(20, 'too many tags'),
  })
  .strict();

export type KbEntry = z.infer<typeof KbEntrySchema>;
