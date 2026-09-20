import { defineConfig } from "vite";
import { pulseApiPlugin } from "./vite-plugin-pulse-api.js";

export default defineConfig({
  plugins: [pulseApiPlugin()],
  server: {
    port: 3847,
  },
  build: {
    outDir: "dist",
  },
});
