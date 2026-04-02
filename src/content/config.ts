import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		schema: docsSchema({
			extend: z.object({
				// This allows you to add a formula string to any MDX file
				formula: z.string().optional(),
			}),
		}),
	}),
};