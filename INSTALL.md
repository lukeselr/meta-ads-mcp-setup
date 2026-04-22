# Manual Install — No Playwright, No Automation

Use this if you're on Claude Desktop, or if you want to do the clicks yourself.

Takes ~15 min the first time. You do this once per ad account.

---

## 1. Install Node.js (if you don't have it)

Open Terminal (Mac) or PowerShell (Windows).

```bash
node -v
```

If it prints a version ≥ 18, skip to step 2. Otherwise download from [nodejs.org](https://nodejs.org/) (pick LTS) and install.

---

## 2. Install the Meta Ads MCP server

```bash
npm install -g meta-ads-mcp
```

If you see an EACCES permission error, run it with `sudo`:

```bash
sudo npm install -g meta-ads-mcp
```

Verify:

```bash
which meta-ads-mcp
```

Should print a path.

---

## 3. Create a Meta App

1. Go to **[developers.facebook.com/apps](https://developers.facebook.com/apps/)**
2. Log in with the Facebook account that has admin access to your ad account
3. Click **Create App**
4. "What do you want your app to do?" → pick **Other**
5. App type → **Business**
6. App name: `<Your Business> Claude Ads`. Email: auto-filled.
7. Click **Create App**. Meta may ask for your password again.
8. On the app dashboard, find **Marketing API** under "Add products to your app" and click **Set up**.

---

## 4. Grab the App ID + App Secret

1. In the left sidebar click **App settings → Basic**
2. Copy the **App ID** (it's a long number)
3. Click **Show** next to **App Secret**, paste your Facebook password if asked, copy the secret

Keep them in a note — you'll need both in step 6.

---

## 5. Generate an Access Token

1. Go to **[developers.facebook.com/tools/accesstoken](https://developers.facebook.com/tools/accesstoken/)**
2. Find your new app in the list
3. On the **User Token** row for your app, click **Generate Token**
4. A popup appears. Tick:
   - ✅ `ads_read`
   - ✅ `ads_management`
   - ✅ `business_management` (if shown — enables multi-account)
5. Click **Generate**. Meta asks for your password again.
6. Copy the token (starts with `EAA`, ~200 chars long)

This is a short-lived token. It expires in 1-2 hours. You'll upgrade it to a 60-day token in the next step.

---

## 6. Exchange for a 60-day Long-Lived Token

Clone this repo or download the `scripts/` folder. Then run:

```bash
cd scripts
node exchange-token.mjs <APP_ID> <APP_SECRET> <SHORT_TOKEN>
```

If it works, you'll see:

```json
{ "ok": true, "token_file": "~/.meta-ads-mcp-token.json", "expires_at": "2026-06-21T..." }
```

Your long-lived token is now saved in `~/.meta-ads-mcp-token.json` (permissions 600 — readable only by you).

---

## 7. Pick Your Ad Account

```bash
node list-ad-accounts.mjs
```

Output looks like:

```json
{
  "accounts": [
    { "index": 1, "act": "act_491282504733048", "name": "Selr AI", "status": "ACTIVE" },
    { "index": 2, "act": "act_887766554433221", "name": "Side Hustle", "status": "ACTIVE" }
  ]
}
```

Pick the `act_...` number you want Claude to control.

---

## 8. Write the MCP Config

```bash
node write-mcp-config.mjs act_491282504733048
```

(Replace with your own `act_...` from step 7.)

This patches your `~/.claude.json` and adds a `meta-ads` entry under `mcpServers`.

If you're on **Claude Desktop** (not Claude Code), the config file lives at:

- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Open it and paste this block under `mcpServers` (replace the token and act_ with yours):

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "meta-ads-mcp",
      "args": [],
      "env": {
        "META_ACCESS_TOKEN": "EAA...yourlongtokenhere...",
        "META_AD_ACCOUNT_ID": "act_491282504733048"
      }
    }
  }
}
```

---

## 9. Restart Claude

**Completely quit** — Cmd+Q on Mac, close all windows on Windows — then reopen.

---

## 10. Test

```bash
node test-connection.mjs
```

Should print three `OK` lines ending with a campaign count.

Then in Claude, type:

```
list my meta ads campaigns
```

If Claude says it can see your campaigns, you're done. 🎯

---

## When your token expires (60 days)

You'll get an "invalid OAuth token" error. Re-run steps 5 → 6 → 8:

1. Generate a new short-lived token (step 5)
2. Exchange for long-lived (step 6)
3. Re-write config (step 8 — same account ID as before)

Total time to refresh: 2 minutes.

If this gets annoying, reply to the email that sent you this skill and I'll ship a v2 that uses **System User tokens** (never expire) — they require a bit more Business Manager setup.
