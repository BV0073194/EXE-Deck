"""Local runner inventory and conservative Windows file routing.

Discovery is read-only: no installation, execution, or filesystem mounting.
"""
import os
import platform
import shutil
from pathlib import Path

RUNNERS = {
    "wine": ("wine",),
    "wine64": ("wine64",),
    "winetricks": ("winetricks",),
    "steam": ("steam",),
    "protontricks": ("protontricks",),
    "vulkaninfo": ("vulkaninfo",),
    "glxinfo": ("glxinfo",),
}
OLE_MAGIC = bytes.fromhex("d0cf11e0a1b11ae1")

def inventory():
    found = {name: shutil.which(commands[0]) for name, commands in RUNNERS.items()}
    return {
        "host": platform.system(),
        "architecture": platform.machine(),
        "tools": {k: {"installed": bool(v), "path": v} for k, v in found.items()},
        "wineAvailable": bool(found["wine"] or found["wine64"]),
        "protonAvailable": False,
        "gpuAccelerationVerified": False,
        "guestIsolationVerified": False,
    }

def classify(filename, header):
    suffix = Path(filename).suffix.lower()
    if suffix == ".msi":
        return ("wine-msiexec", "MSI installer") if header.startswith(OLE_MAGIC) else (None, "MSI signature mismatch")
    if suffix == ".exe":
        if len(header) < 64 or header[:2] != b"MZ":
            return None, "PE DOS header missing"
        offset = int.from_bytes(header[0x3c:0x40], "little")
        if offset > len(header)-4 or header[offset:offset+4] != b"PE\\0\\0":
            return None, "PE signature missing"
        return "wine", "Windows PE executable"
    if suffix in (".bat", ".cmd"):
        return "wine-cmd", "Windows command script"
    return None, "Unsupported file type"

def recommend(filename, header, available=None):
    runner, reason = classify(filename, header)
    available = available if available is not None else inventory()
    installed = available.get("wineAvailable", False)
    return {
        "file": Path(filename).name,
        "recommendedRunner": runner,
        "reason": reason,
        "runnerInstalled": bool(runner and installed),
        "executionEnabled": False,
        "note": "This endpoint only recommends a runner; it does not execute or install software.",
    }
