# Meta Ads MCP Setup

Connect your Meta (Facebook + Instagram) ad account to Claude. Claude then runs, pauses, scales, and reports on your ads in plain English — no Ads Manager clicking required.

**Two paths, pick what you use.** Most people want both.

| Where you use Claude | Path | Time | Token to manage? |
|---|---|---|---|
| **claude.ai web** | Custom Connector → Meta's official MCP | 30 sec | No (Anthropic handles OAuth) |
| **Claude Code CLI** | Legacy `meta-ads-mcp` npm + your own OAuth token | 10 min | Yes (60-day refresh, scripts provided) |

**Why two paths?** Meta has a private allowlist for the official MCP at `mcp.facebook.com/ads`. Anthropic's web client is on it; third-party CLI clients aren't yet. Use the official path where it works (claude.ai web), use the legacy path where it doesn't (Claude Code CLI). When Meta opens the allowlist OR Anthropic ships a built-in Meta client for the CLI, you migrate cleanly.

---

## What you get at the end

- Claude can list your campaigns, ad sets, and ads
- Claude can read performance (spend, CPA, CPC, ROAS, etc.) for any date range
- Claude can pause or resume campaigns
- Claude can estimate audience sizes before you launch
- Claude can compare creatives side-by-side and tell you which one to kill

You ask in English, Claude does it.

---

## Pick your path

### Option A — "Hands-off" via Claude Code

Paste this one line into Claude Code:

```text
Run the skill at https://github.com/lukeselr/meta-ads-mcp-setup — connect my Meta Ads to Claude end to end. Open pages for me, tell me exactly what to click, do the rest yourself.
```

Claude reads this repo, walks you through, drives the OAuth catcher, writes your config, tests the connection. You click "Authorize" once in Facebook; that's it.

### Option B — "Manual" (follow INSTALL.md yourself)

Open [INSTALL.md](INSTALL.md) — same steps, you do the clicks. ~10 min. Recommended if you're on Claude Desktop (which can't run Playwright) or want to understand exactly what's happening.

### Option C — claude.ai web only (30 seconds)

If you never use Claude Code CLI, just do Part 1 of INSTALL.md — paste `https://mcp.facebook.com/ads` into claude.ai's Settings → Connectors → Add custom connector. Done.

---

## Requirements

- **Node.js 18+** — if `node -v` prints nothing, install from [nodejs.org](https://nodejs.org/)
- **Python 3.9+** — built into macOS, no install needed
- **Meta Business Manager** with admin access — if you don't have one, create at [business.facebook.com](https://business.facebook.com)
- **An ad account** inside that Business Manager (the thing starting with `act_`)

---

## What gets written where

- `~/.claude.json` — Claude Code config gets a `meta-ads` entry under `mcpServers`
- `~/.claude/secrets/meta-oauth-token-longlived.json` — your 60-day token (chmod 600)
- `~/.claude/secrets/meta-mcp-app.json` (optional) — App ID + Secret for refresh script
- macOS Keychain (optional) — App Secret backup

Nothing is uploaded. Your token never leaves your machine. This repo has zero API keys or credentials baked in.

---

## Troubleshooting

[TROUBLESHOOTING.md](TROUBLESHOOTING.md) covers the 8 things that actually break + the exact fix for each. Read this before asking for help.

---

## When your token expires

Every 60 days. Re-run `python3 scripts/oauth-catcher.py <APP_ID> <APP_SECRET>` → 30 seconds, one click. Done.

---

## License

MIT. Built in Australia by [Selr AI](https://selrai.com.au) — we build AI agents for Australian businesses. Shared with the workshop crew, refreshed May 2026 with all the gotchas the founder hit personally.

Want the full stack — Meta Ads + Google Ads + Shopify + Klaviyo + GHL all talking to Claude at once? See [selrai.com.au/workshops](https://selrai.com.au/workshops).
