#!/usr/bin/env node
/**
 * Verify a Meta App ID + Secret pair actually matches before proceeding.
 *
 * Catches the #1 silent failure in the setup flow: you grabbed the App Secret
 * from the WRONG app (easy when multiple apps share a name) and don't notice
 * until OAuth fails three steps later.
 *
 * Usage:
 *   node verify-app-secret.mjs <APP_ID> <APP_SECRET>
 *
 * Exits 0 if the pair is valid, 1 otherwise.
 */

const [, , appId, appSecret] = process.argv;

if (!appId || !appSecret) {
  console.error("Usage: node verify-app-secret.mjs <APP_ID> <APP_SECRET>");
  process.exit(1);
}

const url = `https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`;

const res = await fetch(url);
const body = await res.json();

if (body.error?.message === "Error validating client secret.") {
  console.error("");
  console.error("❌  WRONG SECRET.");
  console.error("");
  console.error(`The App Secret you pasted does NOT match App ID ${appId}.`);
  console.error("");
  console.error("This usually means you have MULTIPLE Meta apps with the same name and clicked Show on the wrong one's Secret.");
  console.error("");
  console.error("Fix:");
  console.error(`  1. Go DIRECTLY to https://developers.facebook.com/apps/${appId}/settings/basic/`);
  console.error("  2. Click Show on App Secret (FB asks your password)");
  console.error("  3. Re-run this script with the new secret.");
  console.error("");
  process.exit(1);
}

if (body.error) {
  console.error("Meta Graph API rejected the pair:");
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

if (body.access_token) {
  console.log("✅  OK. App ID + Secret match. App access token minted.");
  // Don't print the token to stdout for safety
  process.exit(0);
}

console.error("Unexpected response from Meta:");
console.error(JSON.stringify(body, null, 2));
process.exit(1);
