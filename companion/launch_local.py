#!/usr/bin/env python3
"""Explicit local EXE/MSI launcher for an already installed Linux Wine runtime.

WARNING: Wine is not a sandbox. Launched applications have the privileges of
the current OS user. Use only trusted files, preferably inside a disposable VM.
No remote HTTP endpoint invokes this launcher.
"""
import argparse
import os
import shutil
import subprocess
import sys
import uuid
from pathlib import Path
from runners import classify

def launch(file_path, prefix_root, wait=False):
    target=Path(file_path).expanduser().resolve(strict=True)
    if not target.is_file() or target.stat().st_size>100*1024*1024*1024:
        raise ValueError("Target must be a regular file of reasonable size")
    with target.open("rb") as handle:
        header=handle.read(4096)
    runner, reason=classify(target.name,header)
    if runner is None:
        raise ValueError("Unsupported or invalid executable: "+reason)
    if sys.platform!="linux":
        raise RuntimeError("Native Wine launch requires a Linux host or WSL environment")
    wine=shutil.which("wine")
    if not wine:
        raise RuntimeError("Wine is not installed. Install Wine in your Linux environment first.")
    root=Path(prefix_root).expanduser().resolve()
    root.mkdir(mode=0o700,parents=True,exist_ok=True)
    os.chmod(root,0o700)
    prefix=root/str(uuid.uuid4())
    prefix.mkdir(mode=0o700)
    env=os.environ.copy()
    env["WINEPREFIX"]=str(prefix)
    env["WINEDEBUG"]="-all"
    if runner=="wine-msiexec":
        args=[wine,"msiexec","/i",str(target)]
    elif runner=="wine-cmd":
        args=[wine,"cmd","/c",str(target)]
    else:
        args=[wine,str(target)]
    print("Launching:",target.name,flush=True)
    print("Wine prefix:",prefix,flush=True)
    print("SECURITY WARNING: This process is not sandboxed and can access host user files.",flush=True)
    process=subprocess.Popen(args,env=env,cwd=str(target.parent),stdin=subprocess.DEVNULL)
    print("Process ID:",process.pid,flush=True)
    if wait:
        return process.wait()
    return 0

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file",help="Trusted EXE, MSI, BAT or CMD file")
    parser.add_argument("--prefix-root",default=str(Path.home()/".exe-deck"/"wine-prefixes"))
    parser.add_argument("--wait",action="store_true")
    parser.add_argument("--acknowledge-unsandboxed",action="store_true",
                        help="Explicitly accept that Wine programs run with host user permissions")
    args=parser.parse_args()
    if not args.acknowledge_unsandboxed:
        parser.error("Pass --acknowledge-unsandboxed after reviewing the security warning")
    try:
        return launch(args.file,args.prefix_root,args.wait)
    except (ValueError,RuntimeError,OSError) as exc:
        print("Launch failed:",exc,file=sys.stderr)
        return 1

if __name__=="__main__":
    sys.exit(main())
