# Troubleshooting

The 6 things that usually break, and the fix for each.

---

## 1. `command not found: meta-ads-mcp` after install

The npm global bin folder isn't on your PATH.

**Mac (zsh):**
```bash
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Windows:** Add the path printed by `npm config get prefix` + `\` to your PATH env var in System Settings → Advanced → Environment Variables.

---

## 2. `{"error": {"code": 190, "message": "Invalid OAuth access token"}}`

Your token is expired, revoked, or mistyped.

- If it's been **over 60 days** since setup → token expired. Re-run steps 5-6-8 in [INSTALL.md](INSTALL.md).
- If it's been **less than 2 hours** → you probably wrote the short-lived token to config instead of exchanging it. Run `scripts/exchange-token.mjs` with fresh short-lived input, then `scripts/write-mcp-config.mjs` again.
- If you changed your Facebook password → all tokens revoke. Start over from step 5.

---

## 3. `{"error": {"code": 100, "message": "Unsupported get request"}}` on `/me/adaccounts`

Your token is missing the `ads_read` scope. Go back to step 5 in INSTALL.md, regenerate the token, and make sure `ads_read` AND `ads_management` are both ticked before you click **Generate**.

---

## 4. Claude says "I don't see a meta-ads tool" even after restart

Three checks:

1. Did you **completely quit** Claude Code? On Mac, Cmd+Q. On Windows, right-click the taskbar icon → Exit. Closing the window is not enough.
2. Open `~/.claude.json` in a text editor. Confirm there's a `meta-ads` entry under `mcpServers` with a real token in `META_ACCESS_TOKEN` (not the literal text `your_access_token_here`).
3. Run `meta-ads-mcp` from your terminal by hand. If it errors before Claude even launches it, that's the problem — fix it first.

---

## 5. "App is in Development Mode" — only my own ads are visible

Meta apps start in **Development Mode** which restricts them to app admins. That's fine for you connecting YOUR OWN ad account — no action needed.

You only need to switch to Live Mode if you're building an app that other people will use. For a personal Claude connection, stay in Development.

---

## 6. Playwright can't open Facebook (stuck on a blank page)

Facebook sometimes blocks automated browsers. Two fixes:

1. Use your real Chrome profile — tell Claude: "use my real Chrome, not the Playwright browser". This needs Playwright MCP to be configured with `--browser=chrome --user-data-dir=~/Library/Application Support/Google/Chrome`.
2. Fall back to manual mode — follow [INSTALL.md](INSTALL.md) and do the browser steps yourself. Claude can still do the token exchange and config write parts.

---

## Still stuck?

Reply to the SMS or email that sent you this kit. I'll jump in and help directly.
