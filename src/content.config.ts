import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";

const blog = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/_blogposts" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    published: z.boolean().default(false),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    socials: z.array(z.object({
      site: z.string(),
      url: z.string()
    })).optional()
  }),
});

export const collections = { blog };
