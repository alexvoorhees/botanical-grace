import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

function langPrefixId({ entry }: { entry: string }) {
  const parts = entry.replace(/\.md$/, '').split('/');
  return parts.join('-');
}

const courses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/courses', generateId: langPrefixId }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    certification: z.string(),
    price: z.number(),
    textbookPrice: z.number().optional(),
    sessions: z.number(),
    totalHours: z.number(),
    image: z.string().optional(),
    order: z.number(),
    lang: z.enum(['ja', 'en']),
    slug: z.string(),
    description: z.string(),
  }),
});

const herbs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/herbs', generateId: langPrefixId }),
  schema: z.object({
    title: z.string(),
    nameJa: z.string(),
    nameEn: z.string(),
    scientificName: z.string(),
    image: z.string().optional(),
    actions: z.array(z.string()),
    lang: z.enum(['ja', 'en']),
    slug: z.string(),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles', generateId: langPrefixId }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    image: z.string().optional(),
    excerpt: z.string(),
    lang: z.enum(['ja', 'en']),
    slug: z.string(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials', generateId: langPrefixId }),
  schema: z.object({
    name: z.string(),
    age: z.string().optional(),
    occupation: z.string().optional(),
    course: z.string(),
    lang: z.enum(['ja', 'en']),
  }),
});

const teacher = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/teacher', generateId: langPrefixId }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    image: z.string().optional(),
    credentials: z.array(z.string()),
    lang: z.enum(['ja', 'en']),
  }),
});

export const collections = { courses, herbs, articles, testimonials, teacher };
