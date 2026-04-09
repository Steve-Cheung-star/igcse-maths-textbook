import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    schema: docsSchema({
      extend: z.object({
        // Optional: you can keep this or remove it, but keep the schema 'extendable'
        grade: z.string().optional(),
      }),
    }),
  }),
};