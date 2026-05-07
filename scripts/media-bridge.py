#!/usr/bin/env python3
"""
media-bridge.py

WebSocket server on ws://localhost:7071
- Pushes currently playing track to the startpage every 1.5s
- Accepts POST /cmd { "cmd": "play-pause" | "next" | "previous" }

Requirements:
  Linux: pip install websockets; playerctl
  macOS: pip install websockets; Spotify or Music app for media data
"""

import asyncio
import json
import platform
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
import websockets

WS_PORT   = 7071
HTTP_PORT = 7072  # control commands come in here
POLL_INTERVAL = 1.5
IS_MACOS = platform.system() == "Darwin"


def run(cmd):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=2)
        return r.stdout.strip()
    except Exception:
        return ""


def run_args(args):
    try:
        r = subprocess.run(args, capture_output=True, text=True, timeout=3)
        return r.stdout.strip()
    except Exception:
        return ""


def osa(script):
    return run_args(["/usr/bin/osascript", "-e", script])


def normalize_status(status):
    value = (status or "").strip().lower()
    if value == "playing":
        return "Playing"
    if value == "paused":
        return "Paused"
    return "Stopped"


def empty_state():
    return {"status": "stopped", "title": "", "artist": "", "art": ""}


def get_linux_state():
    status = run("playerctl status 2>/dev/null")
    if not status or "No players" in status:
        return empty_state()
    return {
        "status": normalize_status(status),
        "title":  run("playerctl metadata title  2>/dev/null"),
        "artist": run("playerctl metadata artist 2>/dev/null"),
        "art":    run("playerctl metadata mpris:artUrl 2>/dev/null"),
    }


def app_running(app_name):
    return osa(f'return application "{app_name}" is running').strip().lower() == "true"


def spotify_state():
    if not app_running("Spotify"):
        return None

    script = '''
tell application "Spotify"
  set playerState to player state as string
  if playerState is "stopped" then
    return playerState & linefeed & "" & linefeed & "" & linefeed & ""
  end if
  set trackName to name of current track
  set trackArtist to artist of current track
  set trackArt to artwork url of current track
  return playerState & linefeed & trackName & linefeed & trackArtist & linefeed & trackArt
end tell
'''
    return parse_macos_state("Spotify", osa(script))


def music_state():
    if not app_running("Music"):
        return None

    script = '''
tell application "Music"
  set playerState to player state as string
  if playerState is "stopped" then
    return playerState & linefeed & "" & linefeed & "" & linefeed & ""
  end if
  set trackName to name of current track
  set trackArtist to artist of current track
  return playerState & linefeed & trackName & linefeed & trackArtist & linefeed & ""
end tell
'''
    return parse_macos_state("Music", osa(script))


def parse_macos_state(source, raw):
    if not raw:
        return None

    parts = raw.splitlines()
    while len(parts) < 4:
        parts.append("")

    status, title, artist, art = parts[:4]
    state = {
        "status": normalize_status(status),
        "title": title,
        "artist": artist,
        "art": art,
        "source": source,
    }
    return state


def get_macos_state():
    states = [state for state in (spotify_state(), music_state()) if state]
    if not states:
        return empty_state()

    playing = next((state for state in states if state["status"] == "Playing"), None)
    selected = playing or states[0]
    return {
        "status": selected["status"],
        "title": selected["title"],
        "artist": selected["artist"],
        "art": selected["art"],
    }


def get_state():
    if IS_MACOS:
        return get_macos_state()
    return get_linux_state()


def control_linux(cmd):
    if cmd in ("play-pause", "next", "previous", "stop"):
        run(f"playerctl {cmd}")


def active_macos_app():
    states = [state for state in (spotify_state(), music_state()) if state]
    playing = next((state for state in states if state["status"] == "Playing"), None)
    selected = playing or (states[0] if states else None)
    if selected:
        return selected["source"]
    if app_running("Spotify"):
        return "Spotify"
    if app_running("Music"):
        return "Music"
    return ""


def control_macos(cmd):
    app_name = active_macos_app()
    if not app_name:
        return

    command_map = {
        "play-pause": "playpause",
        "next": "next track",
        "previous": "previous track",
        "stop": "pause",
    }
    action = command_map.get(cmd)
    if not action:
        return

    osa(f'tell application "{app_name}" to {action}')


def control(cmd):
    if IS_MACOS:
        control_macos(cmd)
    else:
        control_linux(cmd)


# ── Control HTTP server (for play/pause/next/prev from the page) ──────────────
class ControlHandler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body   = self.rfile.read(length)
        try:
            data = json.loads(body)
            cmd  = data.get("cmd", "")
            control(cmd)
        except Exception:
            pass
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()


def start_control_server():
    HTTPServer(("localhost", HTTP_PORT), ControlHandler).serve_forever()


# ── WebSocket broadcast ───────────────────────────────────────────────────────
CLIENTS = set()


async def handler(websocket):
    CLIENTS.add(websocket)
    print(f"[media] Client connected ({len(CLIENTS)} total)")
    try:
        await websocket.send(json.dumps(get_state()))
        await websocket.wait_closed()
    finally:
        CLIENTS.discard(websocket)


async def broadcast_loop():
    last = {}
    while True:
        state = get_state()
        if state != last:
            last = state
            if CLIENTS:
                msg = json.dumps(state)
                await asyncio.gather(
                    *[c.send(msg) for c in list(CLIENTS)],
                    return_exceptions=True,
                )
        await asyncio.sleep(POLL_INTERVAL)


async def main():
    # Start control HTTP server in a background thread
    t = threading.Thread(target=start_control_server, daemon=True)
    t.start()
    print(f"[media] WebSocket on ws://localhost:{WS_PORT}")
    print(f"[media] Controls on http://localhost:{HTTP_PORT}/cmd")
    async with websockets.serve(handler, "localhost", WS_PORT):
        await broadcast_loop()


if __name__ == "__main__":
    asyncio.run(main())
