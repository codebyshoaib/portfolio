import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

// Server-side client with write permissions
// Requires SANITY_API_WRITE_TOKEN environment variable
export const serverClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Never use CDN for write operations
  token: process.env.SANITY_API_WRITE_TOKEN, // Token with write permissions
});
