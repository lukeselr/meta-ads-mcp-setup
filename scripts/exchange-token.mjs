#!/usr/bin/env node
/**
 * Exchange a short-lived Meta user token for a 60-day long-lived token.
 *
 * Usage:
 *   node exchange-token.mjs <APP_ID> <APP_SECRET> <SHORT_TOKEN>
 *
 * Writes: ~/.meta-ads-mcp-token.json  (chmod 600)
 */

import { writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const [, , appId, appSecret, shortToken] = process.argv;

if (!appId || !appSecret || !shortToken) {
  console.error("Usage: node exchange-token.mjs <APP_ID> <APP_SECRET> <SHORT_TOKEN>");
  process.exit(1);
}

const url = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
url.searchParams.set("grant_type", "fb_exchange_token");
url.searchParams.set("client_id", appId);
url.searchParams.set("client_secret", appSecret);
url.searchParams.set("fb_exchange_token", shortToken);

const res = await fetch(url);
const body = await res.json();

if (!res.ok || !body.access_token) {
  console.error("Meta rejected the exchange:");
  console.error(JSON.stringify(body, null, 2));
  process.exit(2);
}

const longToken = body.access_token;
const expiresIn = body.expires_in ?? null;
const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

const tokenPath = join(homedir(), ".meta-ads-mcp-token.json");
const payload = {
  long_lived_access_token: longToken,
  app_id: appId,
  expires_in_seconds: expiresIn,
  expires_at: expiresAt,
  obtained_at: new Date().toISOString(),
};

writeFileSync(tokenPath, JSON.stringify(payload, null, 2));
chmodSync(tokenPath, 0o600);

console.log(JSON.stringify({
  ok: true,
  token_file: tokenPath,
  expires_at: expiresAt,
  token_prefix: longToken.slice(0, 6),
  token_length: longToken.length,
}, null, 2));
