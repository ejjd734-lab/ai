/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, proxy API calls to the FastAPI backend so the SPA and API share an
// origin (mirroring the single-container production setup).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // Target modern browsers — smaller, faster output without legacy polyfills.
    target: "es2020",
    cssMinify: true,
    rollupOptions: {
      output: {
        // Split React into its own chunk so it can be cached independently.
        // App code changes won't bust the React bundle cache.
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/test/**", "src/**/*.d.ts", "src/**/*.test.*"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
