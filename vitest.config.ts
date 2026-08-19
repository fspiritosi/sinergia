import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    env: loadEnv(mode, process.cwd(), ""),
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/generated/",
        "**/*.config.{ts,js}",
        "**/types.ts",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Los tests corren en jsdom y el paquete real de `server-only` aborta
      // fuera del runtime de servidor de Next. Sin este alias, todo módulo
      // marcado como server-only (auth.ts, mailer.ts, rbac/require.ts) sería
      // intesteable. El build de Next no usa este alias.
      "server-only": path.resolve(__dirname, "./src/test/server-only-stub.ts"),
    },
  },
}));
