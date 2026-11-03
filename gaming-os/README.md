# EXE Deck graphical Linux runtime

Ubuntu 24.04 container with Wine (32/64-bit), Winetricks, Mesa/Vulkan userspace, Xvfb, x11vnc, and noVNC. This is **not a bootable VM image**, hardware GPU passthrough, or a security boundary.

## Start a local browser-accessible graphical Linux session

Install Docker Engine and Compose on a Linux host. From the repository root:

```bash
docker compose -f gaming-os/compose.yaml up --build
```

Open **http://127.0.0.1:6080/vnc.html** on the same host. The VNC endpoint has **no authentication** and is bound to the host loopback interface. Never publish this port publicly. The virtual display is normally software-rendered; GPU acceleration is not configured.

A persistent named volume stores the Wine prefix and home directory. Compose defaults to 8 GiB RAM, four CPUs, no added Linux capabilities, a read-only root filesystem, and an unprivileged container user. These measures do **not** make Docker safe for running untrusted binaries.

To launch a trusted Windows program after copying it into the container's home volume:

```bash
docker compose -f gaming-os/compose.yaml exec gaming exe-deck-run-game /home/gamer/games/trusted.exe
```

Steam and Proton are **not** installed. They require separate authorized installation, Steam sign-in, and Proton compatibility-tool management. DXVK and VKD3D-Proton are also not installed or configured. This container does not connect to the GitHub Pages UI or support iPhone remote access. Audio, gamepad, secure remote streaming, GPU passthrough, and independent per-tab VMs remain outstanding.
