# EXE Deck

EXE Deck is an experimental browser-based interface for virtual disks and future Windows application compatibility. It is **not yet a Windows emulator or Wine replacement**.

## Device-backed virtual disks

On desktop Chromium browsers, the **Device virtual disks** panel uses the File System Access API to:
- Create a **fixed VHD** on the device (MBR + FAT32, 64–2048 MiB).
- Select an existing fixed VHD or VHDX by file picker without importing it into browser storage.
- Read selected files in byte ranges. Fixed VHD supports a browser-staged write interface after explicit permission and a Flush action.
- Expose a block API at `window.EXEDeckMountedDisk`.

**Important:** The browser's `createWritable()` implementation can stage writes in a temporary copy before committing. This is **not native in-place block I/O**, may need extra space, and is unsuitable for high-performance guest disk workloads. VHDX is **read-only raw container access**, not a virtual sector mapping. Back up important images before using experimental writes.

The site does **not create or persist new VHD/VHDX images in OPFS**. Legacy OPFS disk images created by older versions are not automatically deleted; users may need to clear old site storage manually after backing them up.

iOS Safari and many other browsers cannot provide direct persistent writable file handles. The interface reports this limitation instead of silently importing disks.

## Missing runtime components

No Windows 10/11 guest, Windows installer execution, MSI service, Wine API compatibility, DirectX/Vulkan translation, GPU acceleration, game-ready bootstrapper, guest filesystem driver, or VHDX sector driver is included. A full gaming runtime requires substantial separate development and legally sourced OS/runtime components. A browser cannot guarantee compatibility with arbitrary Windows games, drivers or anti-cheat.

## Deployment

The workflow in `.github/workflows/pages.yml` deploys `site/` through GitHub Pages from `main`. The service worker caches app assets for offline use.
