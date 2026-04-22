# Meta Ads MCP Setup

Connect your Meta (Facebook + Instagram) ad account to Claude in about 10 minutes. Claude then runs, pauses, scales, and reports on your ads in plain English — no Ads Manager clicking required.

**Works with:** Claude Code (Mac/Windows terminal) and Claude Desktop.
**Needs:** A Meta Business Manager, admin access to the ad account you want to connect, a browser you can log into Facebook from.
**Cost:** Free. All open-source.

---

## What you get at the end

- Claude can list your campaigns, ad sets and ads
- Claude can read performance (spend, CPA, CPC, ROAS, etc.) for any date range
- Claude can pause or resume campaigns
- Claude can estimate audience sizes before you launch
- Claude can compare creatives side-by-side and tell you which one to kill

You ask in English, Claude does it.

---

## Two ways to run this

### Option A — "Hands-off" (recommended if you're on Claude Code)

Paste this one line into Claude Code:

```text
Run the skill at https://github.com/lukeselr/meta-ads-mcp-setup — connect my Meta Ads to Claude end to end. Open pages for me, tell me exactly what to click, do the rest yourself.
```

Claude reads this repo, drives your browser via Playwright, walks you through the Facebook side, captures your token, writes your config, tests the connection, and tells you when it's done. You only press **Login**, **Continue**, and **Copy** buttons when it asks you to.

Total clicks from you: roughly 8.

### Option B — "Manual" (if you're on Claude Desktop or don't want the browser automation)

Follow [INSTALL.md](INSTALL.md) — same steps, you do the clicks yourself. Takes ~15 min.

---

## What Claude does vs what you do

| Step | Who does it |
|---|---|
| Check Node.js is installed | Claude |
| Install `meta-ads-mcp` | Claude |
| Open Meta for Developers in your browser | Claude (Playwright) |
| Log into Facebook | **You** |
| Create a new Meta App (Business type) | Claude clicks, you name it |
| Add the Marketing API product | Claude |
| Open the Access Token Tool | Claude |
| Tick `ads_read` + `ads_management` scopes | Claude |
| Click **Generate Access Token** | **You** (Meta requires it) |
| Copy the token into Claude | Claude reads it from the page |
| Paste your App ID + App Secret | **You** (one copy-paste from Meta's settings page) |
| Exchange short token → 60-day long-lived token | Claude |
| List your ad accounts | Claude |
| Pick an account (if you have multiple) | **You** (type a number) |
| Write the MCP config | Claude |
| Test the connection | Claude |
| Restart Claude Code | **You** |

You press roughly 8 buttons total. Claude does the other 30 steps.

---

## Requirements

- **Node.js 18+** — if `node -v` prints nothing, install from [nodejs.org](https://nodejs.org) first
- **Claude Code** — download at [claude.com/product/claude-code](https://claude.com/product/claude-code)
- **Playwright MCP** (for hands-off mode) — Claude will install it if missing
- **Meta Business Manager** with admin access — if you don't have one yet, create it at [business.facebook.com](https://business.facebook.com)
- **An ad account inside that Business Manager** — the thing that starts with `act_`

---

## What gets written where

Two files on your machine, nothing else:

1. `~/.claude.json` — your Claude Code config gets one new entry under `mcpServers.meta-ads`
2. `~/.meta-ads-mcp-token.json` — your long-lived token, readable only by you (chmod 600)

Nothing is uploaded anywhere. Your token never leaves your machine. This repo has zero API keys or credentials baked in.

---

## Troubleshooting

Open [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — covers the 6 things that usually go wrong and how to fix each one.

---

## License

MIT. Built in Australia by [Selr AI](https://selrai.com.au) — we build AI agents for Australian businesses. Shared with the crew from the Sydney workshop, April 2026.

Want the full-stack version (Meta Ads + Google Ads + Shopify + Klaviyo + GHL all talking to Claude at once)? See [selrai.com.au/workshops](https://selrai.com.au/workshops).
