import "./src/env";
import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // onnxruntime-node ships a native .node binary that cannot be bundled. The
  // RAG query embedding runs in-process on the server, so the package has to be
  // left as a real runtime require rather than traced into the server chunk.
  serverExternalPackages: ["@huggingface/transformers"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
