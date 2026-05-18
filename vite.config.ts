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
  plugins: [
    react(),
    tailwindcss(),
    ...(isProduction ? [viteSingleFile()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "es-toolkit/compat/get": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-get.js",
      ),
      "es-toolkit/compat/isPlainObject": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-isPlainObject.js",
      ),
      "es-toolkit/compat/uniqBy": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-uniqBy.js",
      ),
      "es-toolkit/compat/sortBy": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-sortBy.js",
      ),
      "es-toolkit/compat/range": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-range.js",
      ),
      "es-toolkit/compat/last": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-last.js",
      ),
      "es-toolkit/compat/maxBy": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-maxBy.js",
      ),
      "es-toolkit/compat/minBy": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-minBy.js",
      ),
      "es-toolkit/compat/throttle": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-throttle.js",
      ),
      "es-toolkit/compat/omit": path.resolve(
        __dirname,
        "src/shims/es-toolkit-compat-omit.js",
      ),
    },
  },
  build: {
    // Production optimizations
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        passes: 2,
      },
      format: {
        comments: false,
      },
    },
    // Limit chunk size for better tree-shaking
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: isProduction
        ? {
            // OPTIMIZATION: Aggressive chunk splitting in production
            manualChunks(id) {
              // Vendor chunk for core dependencies
              if (id.includes("node_modules/react")) {
                return "react-vendors";
              }
              if (id.includes("node_modules/react-dom")) {
                return "react-dom-vendors";
              }

              // Separate chunks for heavy features
              if (id.includes("ag-grid")) {
                return "ag-grid-vendors";
              }
              if (id.includes("recharts")) {
                return "charts-vendors";
              }
              if (id.includes("framer-motion")) {
                return "motion-vendors";
              }

              // i18n in separate chunk
              if (id.includes("i18next") || id.includes("react-i18next")) {
                return "i18n-vendors";
              }

              // Page-specific chunks
              if (id.includes("src/pages")) {
                const match = id.match(/pages\/([^/]+)/);
                if (match) {
                  return `page-${match[1].replace(".tsx", "")}`;
                }
              }

              // Component chunks
              if (id.includes("src/components")) {
                const match = id.match(/components\/([^/]+)/);
                if (match) {
                  return `component-${match[1].replace(".tsx", "")}`;
                }
              }
            },
          }
        : {
            manualChunks: {
              // Split large dependencies into chunks for dev server
              "react-vendor": ["react", "react-dom"],
              tauri: ["@tauri-apps/api"],
              ag_grid: ["ag-grid-react", "ag-grid-community"],
              i18n: ["react-i18next", "i18next"],
              charts: ["recharts"],
              motion: ["framer-motion"],
            },
          },
    },
  },
  optimizeDeps: {
    // OPTIMIZATION: Pre-bundle frequently used dependencies
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tauri-apps/api",
      "use-sync-external-store",
      "use-sync-external-store/with-selector",
      "use-sync-external-store/with-selector.js",
      "use-sync-external-store/shim/with-selector",
      "use-sync-external-store/shim/with-selector.js",
      "zustand",
      "lucide-react",
      "react-i18next",
      "i18next",
      "clsx",
      "tailwind-merge",
      "date-fns",
      "sonner",
    ],
    // Exclude large dependencies that are better lazy-loaded
    exclude: [
      "ag-grid-react",
      "ag-grid-community",
      "recharts",
      "framer-motion",
    ],
  },
  server: {
    // Vite dev server optimizations
    middlewareMode: false,
    preTransformRequests: true,
    // Warm up frequently used modules
    warmupEntry: ["src/main.tsx", "src/App.tsx"],
  },
});
