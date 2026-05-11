#!/usr/bin/env node
/**
 * End-to-end sanity check: using the stored long-lived token + the configured
 * ad account, call Graph API directly and confirm we can read basic account
 * info. This bypasses the MCP layer (which needs a Claude Code restart to
 * load), so it works immediately after write-mcp-config.mjs.
 *
 * Usage:
 *   node test-connection.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadToken } from "./_load-token.mjs";

const claudeConfigPath = join(homedir(), ".claude.json");

let token;
try {
  ({ token } = loadToken());
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

if (!existsSync(claudeConfigPath)) {
  console.error(`No ~/.claude.json. Run write-mcp-config.mjs first.`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(claudeConfigPath, "utf8"));
const metaEntry = config.mcpServers?.["meta-ads"];

if (!metaEntry) {
  console.error("No meta-ads entry in ~/.claude.json. Run write-mcp-config.mjs first.");
  process.exit(1);
}

const adAccountId = metaEntry.env?.META_AD_ACCOUNT_ID;
if (!adAccountId) {
  console.error("META_AD_ACCOUNT_ID missing from meta-ads MCP config.");
  process.exit(1);
}

console.log(`Testing token against ${adAccountId}...`);

// 1. /me — confirms token is valid at all
const meRes = await fetch(
  `https://graph.facebook.com/v23.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`
);
const meBody = await meRes.json();
if (!meRes.ok || !meBody.id) {
  console.error("Token is invalid at the user level:");
  console.error(JSON.stringify(meBody, null, 2));
  process.exit(2);
}
console.log(`  /me OK — logged in as user id ${meBody.id}`);

// 2. /act_xxx — confirms token has access to the chosen ad account
const acctRes = await fetch(
  `https://graph.facebook.com/v23.0/${adAccountId}?fields=name,account_status,currency,amount_spent&access_token=${encodeURIComponent(token)}`
);
const acctBody = await acctRes.json();
if (!acctRes.ok || !acctBody.name) {
  console.error(`Token does NOT have access to ${adAccountId}:`);
  console.error(JSON.stringify(acctBody, null, 2));
  process.exit(3);
}
console.log(`  ${adAccountId} OK — "${acctBody.name}", currency ${acctBody.currency}, lifetime spend ${acctBody.amount_spent ?? "?"}`);

// 3. /act_xxx/campaigns — confirms ads_read scope is really working
const campRes = await fetch(
  `https://graph.facebook.com/v23.0/${adAccountId}/campaigns?fields=id,name,status&limit=3&access_token=${encodeURIComponent(token)}`
);
const campBody = await campRes.json();
if (!campRes.ok) {
  console.error("Could not list campaigns — ads_read scope may be missing:");
  console.error(JSON.stringify(campBody, null, 2));
  process.exit(4);
}
const campCount = campBody.data?.length ?? 0;
console.log(`  campaigns OK — account has ${campCount} campaigns visible (showed first ${Math.min(campCount, 3)})`);

console.log("");
console.log("All three checks passed. Restart Claude Code and ask: \"list my meta ads campaigns\".");
