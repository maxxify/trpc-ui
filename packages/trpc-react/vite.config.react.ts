import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  build: {
    cssCodeSplit: false,
    emptyOutDir: true,
    minify: false,
    outDir: "lib",
    rollupOptions: {
      input: {
        main: "src/react-app/index.tsx",
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names[0].endsWith(".css")) {
            return "index.css";
          }
          return "[name].[extname]";
        },
        chunkFileNames: "[name]-[hash].js",
        entryFileNames: "bundle.js",
      },
    },
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
    }),
    viteStaticCopy({
      targets: [
        {
          dest: ".",
          rename: { stripBase: 2 },
          src: "src/react-app/index.html",
        },
      ],
    }),
    {
      closeBundle() {
        const outDir = "lib";
        const html = readFileSync(join(outDir, "index.html"), "utf-8");
        const js = readFileSync(join(outDir, "bundle.js"), "utf-8");
        const css = readFileSync(join(outDir, "index.css"), "utf-8");

        const output = `// This file is auto-generated - do not edit manually
export const getBundledFrontend = () => ({
  js: ${JSON.stringify(js)},
  css: ${JSON.stringify(css)},
  html: ${JSON.stringify(html)},
});

export const bundledJs = ${JSON.stringify(js)};
export const bundledCss = ${JSON.stringify(css)};
export const bundledHtml = ${JSON.stringify(html)};
`;

        writeFileSync(join(outDir, "react-app.bundle.js"), output);
        copyFileSync(
          join("src/types/trpc-react-react-app.d.ts"),
          join(outDir, "react-app.bundle.d.ts"),
        );
      },
      name: "generate-bundle-exports",
    },
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
