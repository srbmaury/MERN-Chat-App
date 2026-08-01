import { defineConfig, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "legacy-jsx-files",
      enforce: "pre",
      async transform(code, id) {
        if (/\/src\/.*\.js$/.test(id)) {
          return transformWithOxc(code, id, { lang: "jsx", jsx: { runtime: "automatic" } });
        }
        return null;
      },
    },
    react(),
  ],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://127.0.0.1:5000",
      "/socket.io": { target: "http://127.0.0.1:5000", ws: true },
    },
  },
  optimizeDeps: {
    entries: ["index.html"],
    rolldownOptions: {
      moduleTypes: { ".js": "jsx" },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@chakra-ui") || id.includes("@emotion") || id.includes("framer-motion")) return "ui";
          if (id.includes("socket.io") || id.includes("engine.io")) return "realtime";
          if (id.includes("react")) return "react";
          return "vendor";
        },
      },
    },
  },
});
