# ★ START HERE — Paste this into Claude Code first

**What this does:** One paste and Claude takes over. It installs `meta-ads-mcp`, drives the OAuth catcher to capture a 60-day token, writes your MCP config, tests the connection, and hands you back a working Claude → Meta Ads pipeline. You click "Authorize" once in Facebook; everything else is automatic.

**Paste into:** Claude Code (terminal or VS Code). Not Claude.ai web — the web app uses a different path entirely (see below).

**Time:** ~10 minutes, one click from you.

---

## Two paths, two prompts

### If you use Claude Code CLI

Paste everything in the fenced block below into Claude Code:

```text
You are running the meta-ads-mcp-setup skill from https://github.com/lukeselr/meta-ads-mcp-setup.

Read SKILL.md and INSTALL.md in that repo. Then drive the Claude Code CLI path (Part 2 of INSTALL.md) for me end-to-end.

You are responsible for:
1. Pre-flight (Node 18+, Python 3.9+, install meta-ads-mcp via npm)
2. Walking me through Meta App creation in my browser (you tell me exact button names, I click)
3. Verifying my App ID + Secret pair via scripts/verify-app-secret.mjs BEFORE proceeding (catches the wrong-secret trap before it bites)
4. Running scripts/oauth-catcher.py with my App ID + Secret to do a full OAuth Authorize flow with localhost callback
5. Running scripts/list-ad-accounts.mjs, scripts/write-mcp-config.mjs, scripts/test-connection.mjs in sequence
6. Telling me to fully Cmd-Q quit Claude Code at the end, then verifying meta-ads tools work in a fresh session

Hard rules:
- Never echo my App Secret or token back to me in chat
- One short status line per step, nothing more
- If any verification fails, STOP and tell me the exact gotcha (TROUBLESHOOTING.md has all 8)
- Don't make me read 5 paragraphs to figure out where I am

Begin at INSTALL.md Pre-flight.
```

### If you only use claude.ai web

You don't need this repo. Just:

1. Go to **https://claude.ai/settings/connectors**
2. Click **Add custom connector**
3. Paste: `https://mcp.facebook.com/ads`
4. Click **Connect** → authorize in the Facebook popup → done

30 seconds. Use Claude.ai in your browser and ask "list my Meta ads campaigns".

---

## After it's done (Claude Code CLI path)

You'll have:

- `meta-ads-mcp` running locally with 22 tools
- 60-day token in `~/.claude/secrets/meta-oauth-token-longlived.json` (chmod 600)
- `meta-ads` entry in `~/.claude.json` under `mcpServers`

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

## If something goes wrong

[TROUBLESHOOTING.md](TROUBLESHOOTING.md) covers the 8 known failure modes. The most common is "wrong App Secret" — happens when you have multiple Meta apps with similar names. The verify script catches this in step 3.

---

Built in Australia 🇦🇺 by [Selr AI](https://selrai.com.au).
Originally shipped to the Sydney Day 1 crew 22 April 2026, refreshed 11 May 2026 with all the production gotchas baked in.

Want the full stack — Meta Ads + Google Ads + Shopify + Klaviyo + GHL all talking to Claude at once? [selrai.com.au/workshops](https://selrai.com.au/workshops).
