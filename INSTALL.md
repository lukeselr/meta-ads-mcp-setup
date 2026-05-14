# Meta Ads MCP — Install Guide

Connect your Meta (Facebook + Instagram) ad account to Claude in ~10 minutes.

This guide covers TWO surfaces — pick the one you use. Most people want both.

---

## TL;DR

| Where you use Claude | Path | Time | Token to manage? |
|---|---|---|---|
| **claude.ai web** (browser chats) | Add Custom Connector → Meta's official MCP | 30 seconds | No — Anthropic handles OAuth |
| **Claude Code CLI** (terminal / VS Code) | Install legacy `meta-ads-mcp` npm + your own OAuth token | 10 minutes | Yes — 60-day token, refresh script provided |

You can do both. They don't conflict.

---

## Part 1 — claude.ai web (30 seconds)

If you only use Claude in your browser, this is all you need.

1. Open **https://claude.ai/settings/connectors**
2. Click **Add custom connector**
3. Paste: `https://mcp.facebook.com/ads`
4. Click **Connect**
5. Facebook OAuth popup → sign in if needed → **Authorize** → pick your ad account + scope **read+write**
6. Done. The connector shows as **Connected** with 29 tools in your web chats.

Use Claude.ai in your browser and ask "list my Meta ads campaigns" — it works.

**For Claude Code CLI users, continue to Part 2.**

---

## Part 2 — Claude Code CLI (10 minutes)

Meta's official MCP at `mcp.facebook.com/ads` only accepts OAuth tokens from clients on Meta's private allowlist. Anthropic's web client is on the allowlist; third-party CLI clients aren't. So in Claude Code CLI we run the **legacy MCP** with our own OAuth token.

### What you'll have at the end

- `meta-ads-mcp` running locally — 22 tools to control your campaigns
- 60-day OAuth-issued token saved in `~/.claude/secrets/`
- Your Meta App ID + Secret saved redundantly (file + keychain)
- A refresh script you run every 60 days (or never if Anthropic ships a built-in Meta client first)

### Pre-flight (1 min)

```bash
node -v       # need 18 or higher
python3 -V    # need 3.9 or higher (built into macOS, no install)
```

If either is missing, install Node from [nodejs.org](https://nodejs.org/) (Python is built into macOS). Then come back.

### Step 1 — Install the MCP server (30 sec)

```bash
npm install -g meta-ads-mcp
```

If you see `EACCES`, prepend `sudo`. Verify it installed:

```bash
which meta-ads-mcp
```

You should see a path.

### Step 2 — Create your Meta App (3 min)

> ⚠️ **BEFORE clicking Create**, go to [developers.facebook.com/apps/](https://developers.facebook.com/apps/) and check if you already have an app named "Claude Ads" or similar. **DELETE any duplicates** before continuing — multiple apps with the same name is the #1 cause of "wrong secret" failures later.

1. Go to **[developers.facebook.com/apps](https://developers.facebook.com/apps/)** and click **Create App**
2. "Use cases" → pick **Other**
3. App type → **Business**
4. App name: `<Your Business> Claude Ads`
5. Email: whatever's pre-filled
6. Business Portfolio: pick the one that owns your ad account
7. Click **Create App** (FB may re-ask your password)
8. On the dashboard, find **Marketing API** under "Add products to your app" → click **Set up**

> 🚫 **DO NOT take the app Live.** Stay in Development Mode. Dev Mode is fine for your own ad account — it only restricts who else can use the app, which you don't care about.
>
> If Meta nags you about "Privacy Policy URL required to take your app Live", ignore it. You're not taking it Live.

### Step 3 — Grab the App ID + App Secret (1 min, the trap step)

This is where most failures happen. **Use this direct URL** to land on the right app's settings:

```
https://developers.facebook.com/apps/<YOUR_APP_ID>/settings/basic/
```

Replace `<YOUR_APP_ID>` with the App ID at the top of your new app's dashboard.

1. **App ID** — copy the long number at the top of the Basic settings page
2. **App Secret** — click **Show** (FB asks your password), copy the 32-char hex string

**Immediately verify them** to catch the wrong-app trap before it bites three steps later:

```bash
node scripts/verify-app-secret.mjs <APP_ID> <APP_SECRET>
```

Expected output: `✅  OK. App ID + Secret match. App access token minted.`

If you see `❌ WRONG SECRET` — you grabbed the secret from a different app. Re-open the direct URL above (with the right App ID), click Show again, copy carefully.

### Step 4 — Run the OAuth catcher (2 min)

The catcher is a tiny local web server that handles the entire OAuth dance automatically. You click "Authorize" once in Facebook; everything else is automated.

```bash
python3 scripts/oauth-catcher.py <APP_ID> <APP_SECRET>
```

What happens:

1. Catcher starts listening on `localhost:33418`
2. Your default browser opens to Facebook's Authorize page
3. **You click Continue / Authorize**, pick your ad accounts, pick scope **read+write**
4. Facebook redirects to localhost — page shows "Got it. Close this tab"
5. Catcher exchanges the code for a 60-day long-lived token
6. Saves to `~/.claude/secrets/meta-oauth-token-longlived.json` (chmod 600)

The catcher prints `DONE` when finished.

### Step 5 — Pick your ad account (30 sec)

```bash
node scripts/list-ad-accounts.mjs
```

You'll see something like:

```json
{
  "accounts": [
    { "index": 1, "act": "act_123456789012345", "name": "Your Business", "status": "ACTIVE" },
    { "index": 2, "act": "act_987654321098765", "name": "Side Project", "status": "ACTIVE" }
  ]
}
```

Note the `act_...` ID you want Claude to control by default.

### Step 6 — Write the MCP config (10 sec)

```bash
node scripts/write-mcp-config.mjs act_123456789012345
```

(replace with YOUR `act_...` from Step 5)

This adds a `meta-ads` entry under `mcpServers` in `~/.claude.json` (and `~/.mcp.json` if it exists).

**Claude Desktop** users: open `~/Library/Application Support/Claude/claude_desktop_config.json` instead and paste:

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "meta-ads-mcp",
      "args": [],
      "env": {
        "META_ACCESS_TOKEN": "<paste access_token from ~/.claude/secrets/meta-oauth-token-longlived.json>",
        "META_AD_ACCOUNT_ID": "act_123456789012345"
      }
    }
  }
}
```

### Step 7 — Fully restart Claude (10 sec)

**Cmd-Q** on Mac (closing the window is NOT enough). On Windows: right-click the taskbar icon → Exit.

Then reopen Claude. The MCP loads on startup.

### Step 8 — Test (10 sec)

```bash
node scripts/test-connection.mjs
```

Should print three `OK` lines ending with a campaign count.

Then in Claude, type:

```
list my meta ads campaigns
```

If Claude lists them — you're done.

---

## When your token expires (every 60 days)

You'll get an "invalid OAuth access token" error. Re-run **just the catcher**:

```bash
python3 scripts/oauth-catcher.py <APP_ID> <APP_SECRET>
```

It writes a fresh token to the same file. Then run:

```bash
node scripts/write-mcp-config.mjs <act_...>
```

Restart Claude. ~2 min total.

---

## Where everything lives

- **Long-lived token**: `~/.claude/secrets/meta-oauth-token-longlived.json` (chmod 600)
- **App Secret backup** (recommended): macOS Keychain — `security add-generic-password -a meta-mcp-app-secret -s meta-mcp-app-secret -w "<your_secret>"`
- **MCP config**: `~/.claude.json` → `mcpServers.meta-ads`

Nothing leaves your machine. No cloud, no telemetry. Open source — read every script before you run it.

---

## Troubleshooting

→ [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

The 8 gotchas we've actually hit + the exact fix for each. Read this before asking for help.

---

## What about Meta's official MCP at mcp.facebook.com/ads?

**Use it from claude.ai web (Part 1 above)** — works perfectly, no token to manage, Anthropic's pre-registered Meta client handles the OAuth.

**It doesn't work from Claude Code CLI yet.** Meta has a private allowlist of clients allowed to hit `mcp.facebook.com/ads`. Anthropic's web client is on the list. Third-party OAuth apps (any app YOU create at developers.facebook.com) get rejected with `401 "restricted to certain users"` even when their tokens are perfectly scoped and valid against Marketing API. This is Meta's beta restriction, not a bug on your side.

The legacy `meta-ads-mcp` npm path (Part 2 above) is your alternative until either:
- Meta opens the allowlist for third-party clients, OR
- Anthropic ships a built-in Meta client for Claude Code CLI

When either happens, this guide will be updated and your existing setup migrates cleanly.

---

Built in Australia 🇦🇺 by [Selr AI](https://selrai.com.au). MIT licensed.
