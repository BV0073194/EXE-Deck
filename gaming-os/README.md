# EXE Deck Linux gaming runtime (container prototype)

This folder defines a reproducible **Ubuntu 24.04 Linux container image** with Wine (32/64-bit), Winetricks, Vulkan loader, Mesa userspace, and troubleshooting utilities. It is **not** a bootable ISO, persistent VM image, or working browser-based gaming PC. The container does **not** include Steam or Proton; these require separate distribution/licensing and installation decisions. DXVK/VKD3D-Proton are not bundled. Do not advertise them as installed.

## Build

On a Linux machine with Docker installed:

```bash
docker build -t exe-deck-gaming:local gaming-os
docker run --rm exe-deck-gaming:local wine --version
```

The build needs internet and compatible Ubuntu repositories. Package availability and successful build are not verified here.

## Security and hardware

Docker containers are not an adequate hostile-EXE security boundary by themselves. **Never** expose an endpoint that runs arbitrary uploaded programs with host privileges. Use a properly isolated disposable VM and a dedicated unprivileged user, quotas, network policies, and disk limits. Native Vulkan acceleration needs compatible host GPU drivers and deliberately configured device access; neither is enabled here. A headless container cannot display games without a separately configured graphical server or streaming stack.

On iPhone, native execution must happen on a remote GPU host and stream to the browser. GitHub Pages cannot host the runtime or stream a remote session by itself.
