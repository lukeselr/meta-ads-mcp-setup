#!/usr/bin/env node
/**
 * Fetch the user's ad accounts from /me/adaccounts and print a numbered list.
 *
 * Usage:
 *   node list-ad-accounts.mjs
 *
 * Reads: ~/.meta-ads-mcp-token.json (written by exchange-token.mjs)
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

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

const url = new URL("https://graph.facebook.com/v23.0/me/adaccounts");
url.searchParams.set("access_token", token);
url.searchParams.set("fields", "account_id,name,account_status,currency,business_name");
url.searchParams.set("limit", "50");

const res = await fetch(url);
const body = await res.json();

if (!res.ok || !Array.isArray(body.data)) {
  console.error("Meta rejected the request:");
  console.error(JSON.stringify(body, null, 2));
  process.exit(2);
}

if (body.data.length === 0) {
  console.error("No ad accounts found for this user. Make sure you're admin on a Business Manager with at least one ad account.");
  process.exit(3);
}

const STATUS = {
  1: "ACTIVE",
  2: "DISABLED",
  3: "UNSETTLED",
  7: "PENDING_RISK_REVIEW",
  8: "PENDING_SETTLEMENT",
  9: "IN_GRACE_PERIOD",
  100: "PENDING_CLOSURE",
  101: "CLOSED",
  102: "PENDING_REVIEW",
};

const accounts = body.data.map((a, i) => ({
  index: i + 1,
  account_id: a.account_id,
  act: `act_${a.account_id}`,
  name: a.name,
  status: STATUS[a.account_status] ?? String(a.account_status),
  currency: a.currency,
  business: a.business_name ?? "",
}));

console.log(JSON.stringify({ ok: true, count: accounts.length, accounts }, null, 2));
