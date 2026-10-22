import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Component tests import through the same "@/" alias as the app (tsconfig paths).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
