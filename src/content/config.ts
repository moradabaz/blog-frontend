import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Morad Abaz'),
    image: z.string().optional(),
    tags: z.array(z.string()).default(['General']),
    category: z.string().default('Article'),
    canonicalUrl: z.string().optional()
  })
});

export const collections = {
  blog: blogCollection
};
