import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: "src/index.ts",
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
      formats: ["es", "cjs"],
      name: "trpc-parser",
    },
    minify: false,
    outDir: "lib",
    rollupOptions: {
      external: [
        "zod",
        "valibot",
        "arktype",
        "yup",
        "@sodaru/yup-to-json-schema",
        "@valibot/to-json-schema",
        "zod-to-json-schema",
        "superstruct",
        "superjson",
        "node:fs",
        "node:url",
        "node:path",
      ],
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      exclude: ["node_modules", "test"],
      include: ["src/**/*.ts"],
      outDirs: "lib",
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
