#!/usr/bin/env python3
"""
One-shot OAuth flow for Meta Ads MCP setup.

Replaces the old "generate token in Meta's Access Token Tool, copy-paste back"
flow with a fully automatic Authorize → Code → Exchange → Save loop.

What it does:
1. Binds a local HTTP server on localhost:33418 to catch the OAuth callback
2. Opens the Facebook Authorize URL in your default browser
3. You click "Continue" / "Authorize" once in the FB tab that opens
4. Server captures the ?code= param, exchanges it for a long-lived 60-day token
5. Saves token to ~/.claude/secrets/meta-oauth-token-longlived.json (chmod 600)

Usage:
  python3 oauth-catcher.py <APP_ID> <APP_SECRET>

Requirements: Python 3.9+ (built into macOS, no install). No pip packages needed.
"""
import http.server, socketserver, urllib.parse, urllib.request, json, sys, os, threading, time

if len(sys.argv) != 3:
    print("Usage: python3 oauth-catcher.py <APP_ID> <APP_SECRET>", file=sys.stderr)
    sys.exit(1)

APP_ID = sys.argv[1]
APP_SECRET = sys.argv[2]
REDIRECT_URI = "http://localhost:33418/callback"
PORT = 33418
SCOPES = "ads_management,ads_read,business_management,catalog_management,pages_show_list"

result = {"code": None, "error": None}

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if not self.path.startswith("/callback"):
            self.send_response(404); self.end_headers(); return
        q = urllib.parse.urlparse(self.path).query
        params = dict(urllib.parse.parse_qsl(q))
        if "code" in params:
            result["code"] = params["code"]
            self.send_response(200); self.send_header("Content-Type", "text/html"); self.end_headers()
            self.wfile.write(b"<h1 style='font-family:sans-serif'>Got it. Close this tab and go back to your terminal.</h1>")
        elif "error" in params:
            result["error"] = params
            self.send_response(400); self.send_header("Content-Type", "text/html"); self.end_headers()
            self.wfile.write(f"<h1>OAuth error: {params}</h1>".encode())
        else:
            self.send_response(400); self.end_headers()
    def log_message(self, *a): pass

httpd = socketserver.TCPServer(("127.0.0.1", PORT), H)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
print(f"Listening on {REDIRECT_URI} ...")

authorize_url = (
    f"https://www.facebook.com/v23.0/dialog/oauth"
    f"?client_id={APP_ID}"
    f"&redirect_uri={urllib.parse.quote(REDIRECT_URI, safe='')}"
    f"&response_type=code"
    f"&scope={SCOPES}"
    f"&state=meta-mcp-{int(time.time())}"
)
print("\nIf your browser doesn't open automatically, paste this URL into it:")
print(authorize_url)
print()

os.system(f'open "{authorize_url}"' if sys.platform == "darwin"
          else f'xdg-open "{authorize_url}"' if sys.platform == "linux"
          else f'start "" "{authorize_url}"')

print("Waiting for you to click Authorize in the Facebook tab (up to 5 min)...")
for _ in range(300):
    if result["code"] or result["error"]:
        break
    time.sleep(1)

if result["error"]:
    print(f"\nERROR: {json.dumps(result['error'])}", file=sys.stderr)
    sys.exit(2)

if not result["code"]:
    print("\nTimed out waiting for code. Re-run the script.", file=sys.stderr)
    sys.exit(3)

print("Got authorization code, exchanging for access token...")

short_exch = (
    f"https://graph.facebook.com/v23.0/oauth/access_token"
    f"?client_id={APP_ID}"
    f"&redirect_uri={urllib.parse.quote(REDIRECT_URI, safe='')}"
    f"&client_secret={APP_SECRET}"
    f"&code={result['code']}"
)
with urllib.request.urlopen(short_exch, timeout=15) as r:
    short_tok = json.loads(r.read())

if "access_token" not in short_tok:
    print(f"Token exchange failed: {json.dumps(short_tok)}", file=sys.stderr)
    sys.exit(4)

short_token = short_tok["access_token"]
print(f"  short-lived token obtained ({len(short_token)} chars)")

# Exchange for 60-day long-lived
ll_exch = (
    f"https://graph.facebook.com/v23.0/oauth/access_token"
    f"?grant_type=fb_exchange_token"
    f"&client_id={APP_ID}"
    f"&client_secret={APP_SECRET}"
    f"&fb_exchange_token={short_token}"
)
with urllib.request.urlopen(ll_exch, timeout=15) as r:
    ll_tok = json.loads(r.read())

if "access_token" not in ll_tok:
    print(f"Long-lived exchange failed, falling back to short-lived: {json.dumps(ll_tok)}", file=sys.stderr)
    ll_tok = short_tok

# Save
secrets_dir = os.path.expanduser("~/.claude/secrets")
os.makedirs(secrets_dir, mode=0o700, exist_ok=True)
out_path = os.path.join(secrets_dir, "meta-oauth-token-longlived.json")
payload = {
    "access_token": ll_tok["access_token"],
    "token_type": ll_tok.get("token_type", "bearer"),
    "expires_in": ll_tok.get("expires_in"),
    "obtained": time.strftime("%Y-%m-%d %H:%M:%S"),
    "app_id": APP_ID,
}
with open(out_path, "w") as f:
    json.dump(payload, f, indent=2)
os.chmod(out_path, 0o600)

print(f"\nDONE. Long-lived token saved to {out_path}")
print(f"  Token length: {len(ll_tok['access_token'])}")
print(f"  Expires in:   {ll_tok.get('expires_in', '?')} seconds (~60 days)")
print(f"\nNext: run scripts/write-mcp-config.mjs to wire this token into Claude Code's ~/.claude.json")
