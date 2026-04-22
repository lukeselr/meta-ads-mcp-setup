# ★ START HERE — Paste this into Claude Code first

**What this does:** One paste and Claude takes over. It installs the Meta Ads MCP server, opens Facebook for Developers in a Playwright-driven browser, walks you through the minimum Meta clicks (login, permission ticks, password re-auth), extracts your token, converts it to a 60-day long-lived token, writes your MCP config, tests the connection, and hands you back a working Claude → Meta Ads pipeline.

**Paste into:** Claude Code (terminal). Not Claude.ai web — the web app can't drive your browser or write config files. If you only have Claude.ai web, use [INSTALL.md](INSTALL.md) instead.

**Time:** 10 minutes, about 8 clicks from you.

---

## Copy everything in the fenced block below into Claude Code

```text
You are running the meta-ads-mcp-setup skill from https://github.com/lukeselr/meta-ads-mcp-setup.

Read SKILL.md in that repo and follow its Phase 0 → Phase 7 workflow exactly. You are responsible for:
- Pre-flight (Node + Playwright MCP check, install meta-ads-mcp)
- Driving the browser via Playwright MCP for every Meta page navigation + click that doesn't require the user's Facebook credentials
- Extracting the App ID from the page DOM, asking for the App Secret + short-lived token as the only paste-ins
- Running scripts/exchange-token.mjs, scripts/list-ad-accounts.mjs, scripts/write-mcp-config.mjs, scripts/test-connection.mjs in sequence
- Never echoing the App Secret or the long-lived token back to me in chat
- Verifying the connection works before you mark this complete

Rules:
- One short status line per phase, nothing more
- If any pre-flight check fails, stop and tell me what to install, do not try to proceed
- If Meta asks me to re-enter my password or confirm a permission dialog, tell me exactly which button to click in one sentence
- At the end, run scripts/test-connection.mjs and show me the three OK lines

Begin with Phase 0.
```

---

## If that felt like too much

You don't have to use Claude Code. Open [INSTALL.md](INSTALL.md) and do the 10 steps yourself in ~15 min. Same outcome, just more clicks from you.

---

## After it's done

You'll have:

- A working `meta-ads` MCP server in `~/.claude.json`
- A 60-day long-lived token in `~/.meta-ads-mcp-token.json` (permissions 600, readable only by you)
- A one-shot confirmation that Claude can see your campaigns

Try these as your first real queries:

```text
What did I spend on Meta ads yesterday?
```

```text
Compare my top 3 campaigns over the last 14 days — CPA, CTR, ROAS. Which one should I kill?
```

```text
Pause any ad set where CPC is over $5.
```

```text
Estimate the audience size for Australian men aged 25-55 interested in business software.
```

---

Built in Australia 🇦🇺 by [Selr AI](https://selrai.com.au).
Sent to the Sydney Day 1 crew, 22 April 2026.

Want the full stack — Meta Ads + Shopify + Google Ads + Klaviyo + GHL all talking to Claude at once? [selrai.com.au/workshops](https://selrai.com.au/workshops).
