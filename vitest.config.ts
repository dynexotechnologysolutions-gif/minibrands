import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Load environment variables for vitest execution
try {
  const envPath = path.resolve(__dirname, "./.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || "").trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env in vitest.config.ts:", e);
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
