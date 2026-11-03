# EXE Deck: single-owner secure hosting

This configuration lets **one approved GitHub account** access a self-hosted graphical Linux desktop. It is an access-controlled remote desktop, **not** safe multi-tenant hosting, a hardened VM, or direct browser CPU/GPU passthrough.

## Compatible host systems

- **Linux x86-64:** Docker Engine + Compose; optional /dev/dri Mesa GPU mapping on supported drivers and devices.
- **Windows/macOS:** Docker Desktop can run the Linux container through its Linux VM, but direct /dev/dri mapping generally does not work. GPU support requires a separately verified host-specific backend.
- **Android/iOS:** can connect through the browser to a deployed host. Mobile browsers cannot run the Docker backend or grant unrestricted local CPU/GPU passthrough.
- **CPU:** the container already uses host CPU subject to Docker's `cpus` and `mem_limit` quotas. There is no special CPU passthrough operation.

## Deploy

1. Set up a dedicated machine and hostname. Configure GitHub OAuth App callback `https://YOUR-HOST/oauth2/callback`.
2. Create a private `.env` in `gaming-os`, using the variables in `GITHUB_AUTH.md`. **Only one** GitHub username is permitted by the startup script. Use `openssl rand -base64 32 | tr -d '\\n'` for a cookie secret.
3. Run `chmod 600 .env` and `set -a; source ./.env; set +a; bash ./secure-start.sh` from `gaming-os`. Do not source untrusted environment files.
4. Visit `https://YOUR-HOST/vnc.html`, complete GitHub OAuth, and verify an unauthorized GitHub account is denied.
5. Optionally set `EXE_DECK_ENABLE_DRM_GPU=1` and host render/video group IDs on compatible Linux hosts. This does **not** make Xvfb GPU-accelerated or add audio.

The gateway reaches only oauth2-proxy on `auth_frontend`. The OAuth service reaches the desktop on `session_private`, which is Docker-internal. Neither gateway nor gaming shares a network. The desktop's direct host port is removed by the remote overlay.

## Threat model and remaining gaps

- GitHub OAuth restricts the remote endpoint to one approved username, using secure HTTP-only cookies. **Authentication is not resource ownership or workload isolation.**
- Wine executables may access the owner's mounted game data. The Docker container is not a hostile-code sandbox. Do not execute untrusted EXEs; use a separately hardened VM for that use case.
- A compromised Docker daemon or host administrator can bypass these protections. Use a dedicated patched host, least privilege, firewall, disk encryption, backups, and strong GitHub MFA.
- GitHub OAuth credentials are server-only; never put secrets in the public Pages site.
- A secure **multi-user** service needs separate VMs, per-user volumes and credentials, resource quotas, audit logging, and server-side authorization on every session operation. Do not add multiple usernames to this shared-desktop deployment.
- A real GPU gaming service still needs a GPU-backed display/encoder, streaming audio and controls, and compatibility testing.
