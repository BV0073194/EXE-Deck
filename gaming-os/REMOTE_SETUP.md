# Self-hosted HTTPS gaming session for browsers

This is a **single-user remote desktop prototype**, not a cloud gaming platform or a secure multi-tenant VM service. It uses Caddy for TLS and HTTP Basic authentication in front of noVNC. All clients, including iPhone and Android, can access the URL in a browser once the host is configured. **Do not run untrusted Windows executables**; Docker/Wine are not sufficient isolation.

## Prerequisites

- Dedicated Linux machine or VM with Docker Compose v2.24+ (required for Compose `!reset`).
- Public domain name pointing to the machine and TCP 80/443 reachable for Let's Encrypt certificates.
- Host GPU support is **not** configured by this stack. The Xvfb display is normally software rendered.
- A trusted Windows game installed in the container's persistent storage, and a user authorized to run it.

## Setup

Create a private `gaming-os/.env` file (never commit it):

```dotenv
EXE_DECK_DOMAIN=games.example.com
EXE_DECK_ACME_EMAIL=you@example.com
EXE_DECK_USER=player
EXE_DECK_PASSWORD_HASH=PASTE_CADDY_BCRYPT_HASH
```

Generate a hash locally:

```bash
docker run --rm caddy:2 caddy hash-password --plaintext 'choose-a-long-random-password'
```

Protect the .env file (`chmod 600 gaming-os/.env`). Do not commit it or expose the password. Start from the repository root:

```bash
docker compose --env-file gaming-os/.env -f gaming-os/compose.yaml -f gaming-os/compose.remote.yaml up --build -d
```

Open `https://games.example.com/vnc.html` from Safari, Chrome, or another browser and authenticate with the configured username/password. In EXE Deck, enter the same HTTPS URL in **Play from any device**.

The gateway provides HTTPS, Basic authentication, and WebSocket reverse proxying, but **no separate per-user sessions**. Anyone with the same credentials shares the same graphical desktop. Use unique strong credentials and restrict who receives them. The backend noVNC port is no longer published on the host in this Compose overlay. Keep Docker and the server patched.

## Remaining limitations

No GPU passthrough, game audio, automatic game launching from the EXE Deck website, Steam/Proton provisioning, or gamepad-to-Wine bridge is implemented. The Xvfb/VNC approach is for functionality testing, not high-performance gaming. Modern games require a dedicated GPU-enabled compositor/streaming stack and robust VM isolation.
