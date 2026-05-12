import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only use viteSingleFile for production builds
const isProduction = process.env.NODE_ENV === "production";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(isProduction ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Faster builds - disable minification and source maps in dev
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large dependencies into chunks
          tauri: ["@tauri-apps/api"],
          ag_grid: ["ag-grid-react", "ag-grid-community"],
          i18n: ["react-i18next", "i18next"],
        },
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster startup
    include: [
      "react",
      "react-dom",
      "@tauri-apps/api",
      "zustand",
      "lucide-react",
      "react-i18next",
    ],
  },
  server: {
    // Vite dev server optimizations
    middlewareMode: false,
    preTransformRequests: true,
  },
});
