import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  sourcemap: true,
  // bundle the workspace shared package (it ships TS source, no build output)
  noExternal: ["@groweasy/shared"],
});
