---
name: meta-ads-mcp-setup
description: Connect a user's Meta (Facebook + Instagram) ad account to Claude via the meta-ads-mcp server. Drives the Facebook Developer setup end-to-end using Playwright, extracts credentials, exchanges short-lived token for a 60-day long-lived token, writes the MCP config to ~/.claude.json, and verifies the connection works. Use when the user wants to connect Meta Ads to Claude, wire up Facebook Ads, or set up the meta-ads MCP.
---

# Meta Ads MCP Setup — Hands-Off Walkthrough

## Purpose

Take a user from "I have a Facebook Ads account" to "Claude can run my ads" in one session, with the user only doing logins and copy-confirmations. Claude Code does everything else — browser automation, token exchange, config write, connection test.

## When this skill runs

Trigger this skill when the user says anything like:
- "connect my Meta Ads to Claude"
- "set up the meta-ads MCP"
- "hook up my Facebook ads"
- "run the meta-ads-mcp-setup skill"

Do NOT run this skill if the user already has a working `meta-ads` entry in their MCP config. Check `~/.claude.json` first — if `mcpServers.meta-ads.env.META_ACCESS_TOKEN` exists and is not placeholder text, run `scripts/test-connection.mjs` first to see if it already works. Only proceed with full setup if the test fails or the user explicitly asks to reconfigure.

## Execution workflow — follow in order

### Phase 0 — Pre-flight (silent to user, takes 10 sec)

1. Run `node -v` — if exit code non-zero or version < 18, STOP and tell user: "You need Node.js 18+. Install from nodejs.org then run me again." Do not proceed.
2. Run `which meta-ads-mcp`. If present, skip step 3.
3. Run `npm install -g meta-ads-mcp` — takes ~20 sec. If it fails with EACCES, retry with `sudo npm install -g meta-ads-mcp` and tell user "I need your Mac password to install globally — paste it into the terminal prompt."
4. Check Playwright MCP is available in this Claude session. If not, tell user: "Install Playwright MCP first by running: `claude mcp add playwright npx @playwright/mcp@latest`, then restart Claude Code, then re-run this skill." Do not try to continue without Playwright.

### Phase 1 — Meta App Creation (user action, ~3 min)

Tell the user, in one short message: "Opening Facebook for Developers now. Log in when prompted. I'll tell you what to click after that."

Then using Playwright:
1. `browser_navigate` to `https://developers.facebook.com/apps/`
2. Wait ~2 sec, then `browser_snapshot` to check the page state.
3. If the snapshot shows a login form, wait — the user is logging in. Poll `browser_snapshot` every 5 sec for up to 2 min. If still logged out after 2 min, tell user "Let me know when you've logged in" and wait for their reply.
4. Once on the Apps list page (look for text "My Apps" or a "Create App" button):
   - Click the "Create App" button via `browser_click`.
5. App creation flow (Meta's UI evolves — inspect `browser_snapshot` before each click):
   - If asked "What do you want your app to do?" → pick **"Other"** (the bottom option for "I don't want to connect to a platform" or similar).
   - Next screen asks app type → pick **"Business"**.
   - Name the app. Use: `<user-business-name> Claude Ads` (ask user for business name if you don't know it). Email field — use the one Meta pre-fills.
   - Click "Create App". Meta may ask for Facebook password re-entry — if so, tell user "Facebook wants your password again, paste it in" and wait.
6. Once on the new app's dashboard, add the Marketing API product:
   - Find the "Marketing API" tile (usually under "Add products to your app") and click **Set up**.
   - Some app types auto-add it. If already added, skip.

### Phase 2 — Get App ID + App Secret (user action, ~1 min)

1. `browser_navigate` to `https://developers.facebook.com/apps/<app_id>/settings/basic/` — if you don't know the app_id yet, navigate to `https://developers.facebook.com/apps/` and click the app you just made, then `browser_snapshot` to find the app_id in the URL.
2. Read the App ID directly from the page snapshot — it's visible plaintext on the Basic Settings page.
3. App Secret is masked. Tell user: "Click 'Show' next to App Secret, then paste the secret into this chat. I won't log it anywhere except your local ~/.meta-ads-mcp-token.json file." Wait for user to paste. DO NOT echo the secret back in your response to the user.

### Phase 3 — Generate Access Token (user action, ~1 min)

1. `browser_navigate` to `https://developers.facebook.com/tools/accesstoken/` (this is the Access Token Tool).
2. `browser_snapshot`. Look for the user's app in the list and find the "User Token" row.
3. Click **Generate Token** on the User Token row for the user's new app. Meta will pop a scope dialog.
4. In the scope dialog, tick: `ads_read`, `ads_management`. If `business_management` is offered, tick it too (enables multi-account).
5. Click **Generate**. Meta will prompt for Facebook password re-auth — tell user "Facebook wants your password again" and wait.
6. Once token is generated, `browser_snapshot` and extract the token string from the User Token field. It starts with `EAA` and is ~200 chars long.

### Phase 4 — Exchange for 60-day Long-Lived Token (Claude does this)

1. Run: `node scripts/exchange-token.mjs <APP_ID> <APP_SECRET> <SHORT_TOKEN>`
2. Script prints the long-lived token to stdout and writes it to `~/.meta-ads-mcp-token.json` with mode 600.
3. If the exchange fails, the script prints the Meta error. Common failures: wrong App Secret (user mis-pasted) → ask them to re-paste. Missing permissions → go back to Phase 3 and re-tick scopes.

### Phase 5 — Pick Ad Account (user action, ~10 sec)

1. Run: `node scripts/list-ad-accounts.mjs`
2. Script reads the token from `~/.meta-ads-mcp-token.json`, calls Graph API `/me/adaccounts`, prints a numbered list: `1) Acme Pty Ltd (act_123456789)  2) Side Hustle (act_987654321)` etc.
3. If only one account, auto-pick it and tell user "Using your only account: <name>".
4. If multiple, ask user: "You have N ad accounts. Which one should Claude connect to? Reply with the number."
5. Save the chosen `act_xxx` — it's written into the MCP config in the next step.

### Phase 6 — Write MCP Config (Claude does this)

1. Run: `node scripts/write-mcp-config.mjs <AD_ACCOUNT_ID>`
2. Script reads the long-lived token from `~/.meta-ads-mcp-token.json`, then updates `~/.claude.json` — it adds (or replaces) the `meta-ads` entry under `mcpServers`.
3. Script prints: "Wrote meta-ads MCP config. Restart Claude Code to load it."

### Phase 7 — Test (Claude does this after user restarts)

1. Tell user: "Config written. Quit Claude Code completely (Cmd+Q on Mac, close the window on Windows) and reopen. Then type 'list my meta ads campaigns' and Claude will run your first real ad query."
2. When the user comes back, run: `node scripts/test-connection.mjs` — this hits Graph API directly (bypassing the MCP, which needs a restart to load) and confirms the token + account ID work together.
3. If test passes, tell user: "Connected. Try asking: 'What were my top 3 campaigns last month by ROAS?' or 'Pause any campaign with CPC over $5.'"
4. If test fails, read the error and route to the right step:
   - "Invalid OAuth access token" → token expired or malformed. Re-run Phase 3-4.
   - "Unsupported get request" on `/me/adaccounts` → missing `ads_read` scope. Re-run Phase 3.
   - "Application does not have the capability" → Marketing API product wasn't added. Re-run Phase 1 step 6.

## Anti-patterns — never do these

- **Never log the App Secret or the long-lived token in Claude's visible chat output.** Even once. Write them to files only.
- **Never commit the user's token to any repo.** `~/.meta-ads-mcp-token.json` is gitignored by default and lives in their home dir.
- **Never skip the test phase.** If you don't run `test-connection.mjs`, you don't know if the setup actually works, and the user finds out 2 days later when their first ad query fails.
- **Never try to automate the Facebook login itself.** Meta detects Playwright and locks accounts. The user MUST do the login click themselves.
- **Never pick a scope the user didn't agree to.** Stick to `ads_read`, `ads_management`, and (if offered) `business_management`. No `pages_manage_ads`, no `publish_to_groups`, nothing else.
- **Never proceed if Phase 0 fails.** Node missing = full stop. Playwright missing = full stop with clear install instructions.

## What's in this skill

- `SKILL.md` — this file (workflow).
- `README.md` — user-facing landing page.
- `INSTALL.md` — manual fallback (no Claude Code, no Playwright).
- `TROUBLESHOOTING.md` — 6 common failure modes.
- `scripts/exchange-token.mjs` — short → long-lived token exchange via Graph API.
- `scripts/list-ad-accounts.mjs` — fetch `/me/adaccounts` and print numbered list.
- `scripts/write-mcp-config.mjs` — patch `~/.claude.json`.
- `scripts/test-connection.mjs` — end-to-end verification.

## Handoff line (say this when done)

"Meta Ads MCP is live. Your long-lived token expires in 60 days — I'll remind you to refresh it. Try: 'What did I spend on Meta ads yesterday?' Your turn."
