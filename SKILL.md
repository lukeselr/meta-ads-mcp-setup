---
name: meta-ads-mcp-setup
description: Connect a user's Meta (Facebook + Instagram) ad account to Claude. Two paths: claude.ai web Custom Connector (30 sec, no token) OR Claude Code CLI legacy MCP with OAuth-catcher (10 min, 60-day token). Walks user through Meta App creation, verifies App ID+Secret pair via Graph API before proceeding, runs the OAuth Authorize flow via local catcher (no manual token paste), writes MCP config, verifies. Use when user wants Meta Ads connected to Claude, says "set up Facebook ads", "wire up meta-ads MCP", or "connect my Meta account".
---

# Meta Ads MCP Setup — Hands-Off Walkthrough

## Purpose

Take a user from "I have a Facebook Ads account" to "Claude can run my ads" in one session, with the user only doing logins and one "Authorize" click. Claude Code does everything else — Meta App creation prompts, credential verification, OAuth catcher run, config write, connection test.

## When this skill runs

Trigger this skill when the user says anything like:

- "connect my Meta Ads to Claude"
- "set up the meta-ads MCP"
- "hook up my Facebook ads"
- "run the meta-ads-mcp-setup skill"

## Two paths — pick what the user needs

Before starting, ASK ONCE: "Do you use Claude in the browser (claude.ai web), the terminal/VS Code (Claude Code CLI), or both?"

- **Browser only** → walk them through Part 1 of INSTALL.md (30 seconds, no scripts to run).
- **CLI** (with or without browser) → run the full Phase 0–7 workflow below.

Most people want both — do Part 1 first (30 sec), then do the CLI flow.

## Pre-flight check before doing ANYTHING

If `~/.claude.json` already has `mcpServers.meta-ads.env.META_ACCESS_TOKEN` set to a real (non-placeholder) token, run `scripts/test-connection.mjs` first. If it passes, the user already has a working setup — only proceed with full re-setup if test fails OR user explicitly asks to reconfigure.

## Execution workflow (CLI path) — follow in order

### Phase 0 — Pre-flight (silent to user, ~10 sec)

1. Run `node -v` — if exit code non-zero OR version < 18, STOP and tell user: "You need Node.js 18+. Install from nodejs.org then re-run me."
2. Run `python3 -V` — should be 3.9+ (macOS has it built in).
3. Run `which meta-ads-mcp`. If missing: `npm install -g meta-ads-mcp` (use sudo if EACCES).
4. Check Playwright MCP availability — only needed if you plan to drive the Meta browser steps; if you're going to read out instructions instead, skip.

### Phase 1 — Meta App audit + create (user action, ~3 min)

1. Tell user: "First we audit your existing Meta apps to avoid the wrong-secret trap. Open https://developers.facebook.com/apps/ and tell me if you have any apps already called 'Claude Ads' or similar."
2. If duplicates exist, instruct user to delete them at `https://developers.facebook.com/apps/<APP_ID>/settings/advanced/` → bottom → Delete App, BEFORE creating a new one.
3. Walk user through new app creation:
   - **developers.facebook.com/apps** → Create App
   - Use cases → **Other**
   - App type → **Business**
   - Name: `<their_business_name> Claude Ads`
   - Business Portfolio → pick the one that owns their ad account
   - Click Create App (FB may re-ask password)
4. On the new app's dashboard, find **Marketing API** under "Add products" → **Set up**.
5. **CRITICAL**: tell user explicitly "Do NOT take the app Live. Stay in Development Mode. Ignore the Privacy Policy URL warning if it appears — you don't need to go Live for personal use."

### Phase 2 — Get + VERIFY App ID + Secret (user action + auto-verify, ~1 min)

1. Tell user: "Open this URL: `https://developers.facebook.com/apps/<APP_ID>/settings/basic/` (replace `<APP_ID>` with the App ID from your new app's dashboard header)."
2. User: copy **App ID** from the top of the page.
3. User: click **Show** next to **App Secret**, paste FB password if asked, copy the secret.
4. User pastes both into chat. You must NOT echo them back.
5. **IMMEDIATELY** run: `node scripts/verify-app-secret.mjs <APP_ID> <APP_SECRET>` — this hits Graph API and confirms the pair is valid.
6. If `❌ WRONG SECRET`: tell user they grabbed the secret from a different app. The verify script's output tells them the exact direct URL. Wait for new paste.
7. If `✅  OK`: proceed.

### Phase 3 — OAuth catcher run (user clicks once, ~1 min)

1. Run: `python3 scripts/oauth-catcher.py <APP_ID> <APP_SECRET>` in the foreground.
2. The catcher starts a local server on `localhost:33418` and opens the FB Authorize URL in the user's default browser.
3. Tell user: "Your browser just opened to Facebook. Sign in if needed, then click **Continue** / **Authorize** on the next page. Pick your ad accounts. Pick scope **read+write**."
4. Catcher receives the OAuth code, exchanges for long-lived 60-day token, saves to `~/.claude/secrets/meta-oauth-token-longlived.json` (chmod 600).
5. Wait for catcher to print `DONE`. If it errors or times out, route to TROUBLESHOOTING.md.

### Phase 4 — Pick ad account (user action, ~10 sec)

1. Run: `node scripts/list-ad-accounts.mjs`
2. Script prints all ad accounts visible to the token.
3. If only one, auto-pick. If multiple, ask user which `act_...` to set as default.

### Phase 5 — Write MCP config (Claude does this)

1. Run: `node scripts/write-mcp-config.mjs <act_...>`
2. Script reads the long-lived token from `~/.claude/secrets/meta-oauth-token-longlived.json`, updates `~/.claude.json` (and `~/.mcp.json` if it exists) — adds or replaces the `meta-ads` entry under `mcpServers`.

### Phase 6 — Restart Claude Code (user action, ~10 sec)

1. Tell user: "Fully quit Claude Code now — Cmd-Q on Mac, right-click taskbar → Exit on Windows. Closing the window is NOT enough. Then reopen."
2. Wait for user to confirm restart.

### Phase 7 — Test + handoff (Claude does this)

1. Run: `node scripts/test-connection.mjs` — hits Graph API directly with the token + ad account ID. Should print 3 OK lines.
2. If passes, tell user: "Connected. In Claude, type: 'list my Meta ads campaigns' to see it work."
3. If fails, read the error and route to TROUBLESHOOTING.md (8 known failure modes, all numbered).

## Anti-patterns — never do these

- **Never log the App Secret or the long-lived token in Claude's visible chat output.** Even once. Write them to files only. The verify-app-secret.mjs script never prints the secret either.
- **Never commit the user's token to any repo.** `~/.claude/secrets/` is outside any git repo and chmod 700.
- **Never skip Phase 2 verify.** Wrong-app-secret is the #1 silent failure — verify-app-secret.mjs catches it in 1 second instead of letting it bite 3 steps later.
- **Never skip the test phase.** If you don't run `test-connection.mjs`, you don't know if the setup actually works.
- **Never try to automate the Facebook login itself.** Meta detects Playwright and locks accounts. The user MUST do FB login click themselves. The oauth-catcher.py opens the user's default browser — they sign in if not already signed in.
- **Never pick a scope the user didn't agree to.** Default catcher scopes: `ads_management, ads_read, business_management, catalog_management, pages_show_list`. Don't expand beyond.
- **Never proceed if Phase 0 fails.** Node missing = full stop. Python missing = full stop.
- **Never tell the user the official `mcp.facebook.com/ads` works in Claude Code CLI.** It doesn't — Meta has a private allowlist. Direct them to claude.ai web Custom Connector for the official path.

## What's in this skill

- `SKILL.md` — this file (workflow).
- `README.md` — user-facing landing page with two-path intro.
- `START_HERE.md` — one-paste prompt for Claude Code.
- `INSTALL.md` — manual fallback (10 min, user does clicks themselves).
- `TROUBLESHOOTING.md` — 8 known failure modes with exact fixes.
- `scripts/verify-app-secret.mjs` — Phase 2 fail-fast check (NEW).
- `scripts/oauth-catcher.py` — Phase 3 fully-automatic Authorize flow (NEW — replaces manual Access Token Tool paste).
- `scripts/exchange-token.mjs` — legacy short→long token exchange (kept for users who prefer the Access Token Tool path).
- `scripts/list-ad-accounts.mjs` — fetch `/me/adaccounts` and print numbered list.
- `scripts/write-mcp-config.mjs` — patch `~/.claude.json`.
- `scripts/test-connection.mjs` — end-to-end verification.

## Handoff line (say this when done)

"Meta Ads MCP is live in Claude Code. Token expires in 60 days — re-run `python3 scripts/oauth-catcher.py <APP_ID> <APP_SECRET>` to refresh. For browser/web use, also add `https://mcp.facebook.com/ads` at claude.ai/settings/connectors → that's Meta's official MCP, 29 tools, no token to manage. Try: 'What did I spend on Meta ads yesterday?' Your turn."
