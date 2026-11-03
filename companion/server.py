#!/usr/bin/env python3
"""EXE Deck local companion (experimental): loopback-only authenticated session broker.
Does not execute guests, EXE/MSI, Wine, or mount virtual disks.
"""
import argparse
import hmac
import json
import os
import secrets
import stat
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from runners import inventory, recommend
from urllib.parse import urlsplit

MAX_BODY = 4096
class Broker(ThreadingHTTPServer):
    daemon_threads = True
    def __init__(self, address, root, token):
        super().__init__(address, Handler)
        self.root = root
        self.token = token
        self.sessions = {}
        self.lock = threading.Lock()

class Handler(BaseHTTPRequestHandler):
    server_version = "EXEDeckCompanion/0.1"
    def log_message(self, fmt, *args):
        # Never log Authorization tokens.
        print("%s - %s" % (self.address_string(), fmt % args))
    def respond(self, status, data):
        payload = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
    def authorized(self):
        token = self.headers.get("Authorization", "")
        return hmac.compare_digest(token, "Bearer " + self.server.token)
    def request_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 0 or length > MAX_BODY:
                raise ValueError("Invalid body size")
            return json.loads(self.rfile.read(length)) if length else {}
        except (ValueError, UnicodeDecodeError):
            raise ValueError("Invalid JSON")
    def route(self, method):
        if not self.authorized():
            return self.respond(401, {"error": "Unauthorized"})
        path = urlsplit(self.path).path
        if method == "GET" and path == "/v1/runners":
            return self.respond(200, inventory())
        if method == "POST" and path == "/v1/recommend":
            try:
                body = self.request_json()
                if not isinstance(body, dict) or not isinstance(body.get("filename"), str) or len(body["filename"]) > 255 or not isinstance(body.get("headerHex"), str) or len(body["headerHex"]) > 8192:
                    return self.respond(400, {"error": "Expected filename and headerHex (max 4096 bytes)"})
                header = bytes.fromhex(body["headerHex"])
            except (ValueError, TypeError) as e:
                return self.respond(400, {"error": "Invalid hex header"})
            return self.respond(200, recommend(body["filename"], header))
        if method == "GET" and path == "/v1/status":
            return self.respond(200, {"service": "exe-deck-companion", "version": 1,
                "executionReady": False, "wineReady": False, "guestProvisioningReady": False,
                "diskBridgeReady": False, "sessions": len(self.server.sessions)})
        if method == "POST" and path == "/v1/sessions":
            try:
                body = self.request_json()
                if body not in ({}, {"kind": "isolated"}):
                    return self.respond(400, {"error": "Unsupported session configuration"})
            except ValueError as e:
                return self.respond(400, {"error": str(e)})
            with self.server.lock:
                if len(self.server.sessions) >= 16:
                    return self.respond(429, {"error": "Session limit reached"})
                sid = str(uuid.uuid4())
                folder = self.server.root / sid
                folder.mkdir(mode=0o700)
                os.chmod(folder, 0o700)
                self.server.sessions[sid] = folder
            return self.respond(201, {"id": sid, "state": "workspace-only", "guestRunning": False})
        if method == "DELETE" and path.startswith("/v1/sessions/"):
            sid = path.removeprefix("/v1/sessions/")
            try:
                sid = str(uuid.UUID(sid))
            except ValueError:
                return self.respond(400, {"error": "Invalid session ID"})
            with self.server.lock:
                if sid not in self.server.sessions:
                    return self.respond(404, {"error": "Unknown session"})
                self.server.sessions.pop(sid)
            # Preserve data for explicit later cleanup; never delete files implicitly.
            return self.respond(200, {"id": sid, "state": "closed", "dataPreserved": True})
        return self.respond(404, {"error": "Not found"})
    def do_GET(self):
        self.route("GET")
    def do_POST(self):
        self.route("POST")
    def do_DELETE(self):
        self.route("DELETE")
    def do_OPTIONS(self):
        self.respond(405, {"error": "Cross-origin browser access is not enabled"})

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, default=47631)
    p.add_argument("--root", type=Path, default=Path.home() / ".exe-deck" / "sessions")
    args = p.parse_args()
    if not 1024 <= args.port <= 65535:
        p.error("port must be 1024–65535")
    args.root.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(args.root, stat.S_IRWXU)
    token = secrets.token_urlsafe(32)
    print("EXE Deck companion: http://127.0.0.1:%d" % args.port)
    print("Bearer token (keep private):", token, flush=True)
    with Broker(("127.0.0.1", args.port), args.root, token) as server:
        server.serve_forever()

if __name__ == "__main__":
    main()
