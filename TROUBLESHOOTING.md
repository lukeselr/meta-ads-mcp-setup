# Troubleshooting

The 8 things that actually break in this setup, and the exact fix.

These are not theoretical — every one of them has been triggered by a real user (including the author) and the fix below works. If you hit a 9th, reply to the SMS/email that sent you this kit.

---

## 1. `❌ WRONG SECRET` from `verify-app-secret.mjs`

You grabbed the App Secret from the wrong app. This happens when you have multiple Meta apps with similar names — clicking "Show" on the wrong one's row is silent until you try to OAuth.

**Fix:**

```
https://developers.facebook.com/apps/<YOUR_APP_ID>/settings/basic/
```

Open that direct URL (with YOUR App ID — get it from your app's dashboard header). Click **Show** on App Secret on THAT page. Re-run `verify-app-secret.mjs`.

If you still get wrong-secret, check `https://developers.facebook.com/apps/` for duplicates. Delete any extras at `https://developers.facebook.com/apps/<DUPLICATE_ID>/settings/advanced/` → bottom → **Delete App**.

---

## 2. `"Error validating client secret"` from Meta Graph API

Same problem as #1 — secret doesn't match App ID. Fix is the same.

---

## 3. `command not found: meta-ads-mcp` after `npm install -g meta-ads-mcp`

npm's global bin folder isn't on your PATH.

**Mac (zsh):**
```bash
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Windows:** Add the path printed by `npm config get prefix` + `\` to your PATH env var in System Settings → Advanced → Environment Variables.

---

## 4. `{"error":{"code":190,"message":"Invalid OAuth access token"}}`

Your token is expired, revoked, or wrong.

- **Over 60 days since setup** → token expired. Re-run `python3 scripts/oauth-catcher.py <APP_ID> <APP_SECRET>` to get a fresh one.
- **You changed your Facebook password** → all tokens revoke. Re-run the catcher.
- **Just ran the catcher and still seeing this** → check `~/.claude/secrets/meta-oauth-token-longlived.json` exists and `META_ACCESS_TOKEN` in `~/.claude.json` matches its `access_token` value. Run `node scripts/write-mcp-config.mjs <act_...>` to re-sync.

---

## 5. `{"error":{"code":100,"message":"Unsupported get request"}}` on `/me/adaccounts`

Your token is missing the `ads_read` scope. The catcher requests scopes `ads_management, ads_read, business_management, catalog_management, pages_show_list` by default — if you customised this or rejected scopes in the Authorize dialog, you'll get this error.

**Fix:** re-run `python3 scripts/oauth-catcher.py <APP_ID> <APP_SECRET>` and accept ALL scopes when Facebook asks.

---

## 6. Claude says "I don't see a meta-ads tool" even after restart

Three checks:

1. Did you **fully quit** Claude? On Mac, **Cmd+Q** (not just close the window). On Windows, right-click the taskbar icon → Exit.
2. Open `~/.claude.json` in a text editor. Confirm there's a `meta-ads` entry under `mcpServers` with a real token in `META_ACCESS_TOKEN` (not the literal text `your_access_token_here` or empty).
3. Run `meta-ads-mcp` from your terminal by hand. If it errors before Claude even launches it, that's the problem — fix that first.

---

## 7. "App is in Development Mode. Take it Live?" / "Privacy Policy URL required"

**Don't take it Live. Stay in Development Mode.**

Development Mode restricts the app to its admins (you), which is exactly what you want — you're connecting YOUR ad account, not building an app for other users. Live Mode would force you through app review for the `ads_management` scope, which takes weeks.

Ignore the "Privacy Policy URL required" warning. It only applies if you try to go Live. Stay in Dev, stay happy.

---

## 8. `401 "This resource is restricted to certain users"` from `mcp.facebook.com/ads`

You're trying to use Meta's hosted MCP directly with your own OAuth token. Meta has a private allowlist of clients allowed to hit `mcp.facebook.com/ads` — Anthropic's claude.ai web client is on it, third-party apps aren't.

**This is expected, not a bug.** Two options:

1. **Use claude.ai web** (Part 1 of [INSTALL.md](INSTALL.md)) — works because Anthropic handles OAuth via their pre-registered client.
2. **Use the legacy `meta-ads-mcp` npm path** in Claude Code CLI (Part 2 of INSTALL.md) — uses YOUR token directly against Marketing API, bypasses the allowlist entirely.

You can do both. They don't conflict.

---

## Still stuck?

Reply to the SMS or email that sent you this kit. Include:

- The exact error message
- Which step number you were on
- Output of `node -v` and `python3 -V`

I'll jump in.
