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

## Experimental WebAssembly PC runner

The **WebAssembly PC runner** uses v86 loaded on demand from jsDelivr (v86 0.5.462). Select a bootable x86 ISO to start an emulated PC in the current tab; pause, resume and stop controls are available. The ISO is provided by the user and is not saved to browser storage. The runtime and BIOS are fetched over the network when first started, so offline boot is not guaranteed. This is an x86 VM boot integration, **not** a preinstalled Linux/Wine/Proton environment. The device VHD/VHDX is not yet connected to the VM. Emulator boot has not been verified on a physical device. The v86 engine is not suitable for modern Windows 10/11 DirectX gaming. See https://github.com/copy/v86 for emulator license and upstream documentation.

## Missing runtime components

No Windows 10/11 guest, Windows installer execution, MSI service, Wine API compatibility, DirectX/Vulkan translation, GPU acceleration, game-ready bootstrapper, guest filesystem driver, or VHDX sector driver is included. A full gaming runtime requires substantial separate development and legally sourced OS/runtime components. A browser cannot guarantee compatibility with arbitrary Windows games, drivers or anti-cheat.

## Deployment

The workflow in `.github/workflows/pages.yml` deploys `site/` through GitHub Pages from `main`. The service worker caches app assets for offline use.

## Session isolation and security boundaries

- Every tab constructs a separate v86 emulator and guest RAM; the default Linux ISO is attached as **read-only CD-ROM**, with no writable guest disk attached. The default boot image is fetched from upstream and cannot be modified by guest disk writes.
- No guest networking is intentionally configured. The browser still fetches runtime and boot assets from third-party origins.
- Device VHD files are **not** passed to the guest VM. The separate browser file-access panel can still write to a user-approved VHD, so do not treat the entire site as read-only.
- Web Locks coordinate selected disks between tabs **in the same browser origin**, using filenames. This is not a secure filesystem identity or a lock across browsers, apps, devices, or users.
- Per-tab generated usernames/passwords are **UI session identifiers**, not real Linux credentials or root permissions. They do not authenticate users.
- Browser same-origin JavaScript, extensions, compromised dependencies, and users with device access are **not** isolated by this scheme. There is no multi-user backend, authenticated tenant isolation, verified Linux image, cryptographic boot verification, or secure execution boundary for untrusted EXEs.
- Do not run untrusted executables or treat this experimental guest as a hardened sandbox. For actual multi-user isolation, use authenticated per-user storage, pinned and integrity-verified self-hosted images, CSP, and independently sandboxed VM workers with an audited storage broker.

## Implementation status (November 2026)

The current milestone repairs a JavaScript syntax defect that prevented the v86 runner from initializing, prevents overlapping boot attempts, and improves disk lock cleanup. This is **not** completion of the proposed Linux/Wine/Proton game platform. Missing: a bundled and verified Linux image, automatic offline boot, real guest user provisioning, Wine/Proton and MSI runtime, guest disk bridge with safe sector I/O, graphics acceleration, per-user authentication, and security testing. No successful guest boot or game installation has been verified.

## Native companion prototype

A minimal Python 3 standard-library companion is now in `companion/server.py`. Run it **locally**:

```bash
python companion/server.py
python -m unittest discover -s companion -p 'test_*.py'
```

It binds only to `127.0.0.1:47631`, prints a random bearer token at startup, and creates private `0700` session workspaces in `~/.exe-deck/sessions`. Its current authenticated API is `GET /v1/status`, `POST /v1/sessions` with `{}`, and `DELETE /v1/sessions/{uuid}`. Closing a session preserves its files.

**Security boundary:** this is only an authenticated local session/workspace broker. It does not launch Linux VMs, isolate OS processes, authenticate remote users, provide root passwords, or execute untrusted software. It deliberately sends no permissive CORS headers, so the GitHub Pages frontend **cannot yet call it directly**; adding a secure, explicit pairing and browser-to-localhost transport is separate work. Never publish the bearer token or expose the service to a public interface. File modes alone do not provide isolation from processes running as the same OS user.
