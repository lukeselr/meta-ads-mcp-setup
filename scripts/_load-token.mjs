/**
 * Shared token loader. Reads from the canonical new path first
 * (~/.claude/secrets/meta-oauth-token-longlived.json — written by oauth-catcher.py),
 * falls back to the legacy path (~/.meta-ads-mcp-token.json — written by
 * exchange-token.mjs) for backward compatibility.
 *
 * Exports: loadToken() — returns { token, source } or throws.
 */

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function loadToken() {
  const newPath = join(homedir(), ".claude/secrets/meta-oauth-token-longlived.json");
  const oldPath = join(homedir(), ".meta-ads-mcp-token.json");

  if (existsSync(newPath)) {
    const f = JSON.parse(readFileSync(newPath, "utf8"));
    if (f.access_token) return { token: f.access_token, source: newPath };
  }

  if (existsSync(oldPath)) {
    const f = JSON.parse(readFileSync(oldPath, "utf8"));
    if (f.long_lived_access_token) return { token: f.long_lived_access_token, source: oldPath };
    if (f.access_token) return { token: f.access_token, source: oldPath };
  }

  throw new Error(
    `No token file found. Looked in:\n  ${newPath}\n  ${oldPath}\n\n` +
    `Run scripts/oauth-catcher.py <APP_ID> <APP_SECRET> to capture one.`
  );
}
