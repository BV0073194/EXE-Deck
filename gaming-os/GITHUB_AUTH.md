# GitHub-authenticated EXE Deck remote desktop

This optional overlay uses GitHub OAuth via oauth2-proxy. It protects **remote access to the host's** graphical Wine container. It does **not** grant EXE Deck direct CPU/GPU passthrough from a visitor's device, and it does not turn the host into a secure per-user VM.

## Set up

1. Create a GitHub OAuth App in your GitHub account settings (Developer settings → OAuth Apps). Homepage: `https://games.example.com`. Authorization callback: `https://games.example.com/oauth2/callback`. Use the real hostname.
2. On the Linux host, create a private `gaming-os/.env` with the values below. Generate a strong cookie secret using `openssl rand -base64 32 | tr -d '\\n'`. Keep all secrets out of git.
3. Use the Compose commands below. HTTPS requires the public DNS name to resolve to the host, with ports 80 and 443 reachable.
4. Open `https://games.example.com/vnc.html` in a browser. GitHub sign-in will be required. Only usernames on the configured allowlist should be permitted.

```dotenv
EXE_DECK_DOMAIN=games.example.com
EXE_DECK_ACME_EMAIL=you@example.com
EXE_DECK_GITHUB_CLIENT_ID=github-oauth-client-id
EXE_DECK_GITHUB_CLIENT_SECRET=github-oauth-client-secret
EXE_DECK_COOKIE_SECRET=long-random-secret
EXE_DECK_GITHUB_ALLOWED_USERS=your-github-username
```

Run from repository root:

```bash
docker compose --env-file gaming-os/.env -f gaming-os/compose.yaml -f gaming-os/compose.remote.yaml -f gaming-os/compose.github.yaml -f gaming-os/compose.github.caddy.yaml up --build -d
```

The GitHub OAuth credentials must be configured on the **server**, not in the GitHub Pages app. Keep `.env` private (`chmod 600 gaming-os/.env`). Do not reuse or expose GitHub access tokens in the browser.

The allowlist restricts accounts but all authorized users share one Linux desktop. For strict user isolation, deploy a separate isolated VM and storage for each user, with server-side session ownership checks and resource quotas. This is not currently implemented.

### Security limitations

GitHub login controls **access**, not ownership of physical CPU/GPU resources. A remote host still computes on its own hardware. Local WebAssembly uses the user's own CPU automatically without OAuth. No GPU passthrough to local Linux VM exists in browsers. Avoid running untrusted executables in Wine containers. Do not expose the unprotected VNC port publicly.
