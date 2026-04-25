import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GROQ_API_KEY: z.string().min(1),
    SANITY_PROJECT_ID: z.string().min(1),
    SANITY_DATASET: z.string().min(1),
    SANITY_API_READ_TOKEN: z.string().optional(),
    SANITY_STUDIO_PREVIEW_ORIGIN: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_SANITY_DATASET: z.string().optional(),
  },
  runtimeEnv: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
    SANITY_DATASET: process.env.SANITY_DATASET,
    SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
    SANITY_STUDIO_PREVIEW_ORIGIN: process.env.SANITY_STUDIO_PREVIEW_ORIGIN,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
});
