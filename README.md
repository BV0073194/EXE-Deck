# EXE Deck

Browser-local gaming and Windows-emulation research PWA for iPhone and desktop.

## Deployment

The GitHub Pages workflow in `.github/workflows/pages.yml` deploys the static app from `site/` on changes to `main`. Enable **Settings → Pages → Build and deployment → Source: GitHub Actions** if not already selected.

## Limitations

A browser cannot natively run Windows EXE files. The v86 emulator requires separately supplied compatible runtime files, BIOS, and a guest OS image. DirectX 9 gaming such as Nitronic Rush is not supported by this prototype. The touch controller UI is not yet wired to guest inputs. Offline PWA installation requires an initial HTTPS visit and cached assets.

## Project

`site/` contains the PWA shell and emulator launcher; `site/vendor/` is reserved for independently sourced emulator runtime assets.
