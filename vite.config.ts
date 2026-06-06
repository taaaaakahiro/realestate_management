import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// GitHub Pages（プロジェクトサイト）用のサブパス。開発時はルート。
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/realestate_management/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
}));
