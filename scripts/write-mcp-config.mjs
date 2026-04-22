#!/usr/bin/env node
/**
 * Patch ~/.claude.json with a meta-ads MCP server entry using the stored
 * long-lived token and the ad account ID the user picked.
 *
 * Usage:
 *   node write-mcp-config.mjs <AD_ACCOUNT_ID>
 *
 *   AD_ACCOUNT_ID can be given with or without the "act_" prefix.
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const [, , rawAdAccountId] = process.argv;

if (!rawAdAccountId) {
  console.error("Usage: node write-mcp-config.mjs <AD_ACCOUNT_ID>");
  process.exit(1);
}

const adAccountId = rawAdAccountId.startsWith("act_") ? rawAdAccountId : `act_${rawAdAccountId}`;

const tokenPath = join(homedir(), ".meta-ads-mcp-token.json");
let tokenFile;
try {
  tokenFile = JSON.parse(readFileSync(tokenPath, "utf8"));
} catch (e) {
  console.error(`Could not read ${tokenPath}. Run exchange-token.mjs first.`);
  process.exit(1);
}

const token = tokenFile.long_lived_access_token;
if (!token) {
  console.error(`No long_lived_access_token in ${tokenPath}.`);
  process.exit(1);
}

const claudeConfigPath = join(homedir(), ".claude.json");
let config = {};
if (existsSync(claudeConfigPath)) {
  copyFileSync(claudeConfigPath, claudeConfigPath + ".bak");
  try {
    config = JSON.parse(readFileSync(claudeConfigPath, "utf8"));
  } catch (e) {
    console.error(`~/.claude.json exists but isn't valid JSON. Fix it first, or move it aside.`);
    process.exit(1);
  }
}

config.mcpServers = config.mcpServers ?? {};
config.mcpServers["meta-ads"] = {
  command: "meta-ads-mcp",
  args: [],
  env: {
    META_ACCESS_TOKEN: token,
    META_AD_ACCOUNT_ID: adAccountId,
  },
};

writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2));

console.log(JSON.stringify({
  ok: true,
  config_path: claudeConfigPath,
  backup: claudeConfigPath + ".bak",
  ad_account_id: adAccountId,
  servers_now_configured: Object.keys(config.mcpServers),
}, null, 2));

console.log("");
console.log("Restart Claude Code completely (Cmd+Q then reopen) so it picks up the new MCP.");
