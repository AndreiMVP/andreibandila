#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const projectId = process.env.SUPABASE_PROJECT_ID || (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  try { return new URL(url).hostname.split(".")[0]; } catch { return ""; }
})();

if (!projectId) {
  console.error("Set SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

const output = execFileSync("bunx", ["supabase", "gen", "types", "typescript", "--project-id", projectId, "--schema", "public"], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
writeFileSync("packages/shared/src/database.types.ts", output);
console.log(`Generated Supabase types for ${projectId}`);
