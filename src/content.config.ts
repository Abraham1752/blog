import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: ['*.md', '!template-*.md'], base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(20).max(80),
    pubDate: z.coerce.date(),
    updatedDate: z.date().optional(),
    description: z.string().min(40).max(160),
    excerptEn: z.string().optional(),
    category: z.enum(['复盘', '教程', '测评', '周记', '片段']),
    tags: z.array(z.string()).min(3).max(8),
    projects: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    noindex: z.boolean().default(false).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: 'projects.yaml', base: './src/content' }),
});

export const collections = { posts, projects };
