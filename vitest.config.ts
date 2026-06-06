import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// No @vitejs/plugin-react: that plugin targets Fast Refresh for dev and pulls a
// vite-version peer skew (plugin-react@6 wants vite@8). Tests don't need Fast
// Refresh — vitest's built-in esbuild handles JSX/TSX. esbuild's automatic JSX
// runtime means no React import is required in components.
export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
