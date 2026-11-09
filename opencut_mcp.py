#!/usr/bin/env python3
"""LexCut connector for Claude (MCP over stdio, standard library only).

Lets Claude Code / Claude Desktop, signed in with your Claude Pro account (no API key), look at and edit the
project that is open in LexCut. LexCut must be running (server.py) with the editor open in a browser tab.

Register:  claude mcp add opencut -- python3 /path/to/lexcut/opencut_mcp.py
           (Windows: claude mcp add opencut -- python C:\\path\\to\\lexcut\\opencut_mcp.py)
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

PORT = os.environ.get("OPENCUT_PORT", "8765")
URL = f"http://127.0.0.1:{PORT}/api/bridge/call"
TOKEN_FILE = Path.home() / ".opencut" / "bridge_token"

TOOLS = [
    {"name": "opencut_get_state", "description": "Current LexCut project: canvas size, playhead, duration, assets, media folder, and every clip (id, track, start, dur, text...). Call this first.",
     "inputSchema": {"type": "object", "properties": {}}},
    {"name": "opencut_help", "description": "The list of edit actions (add_text, add_asset, set, split, delete, move, aspect, transcribe, ...) and their properties. Read before calling opencut_edit.",
     "inputSchema": {"type": "object", "properties": {}}},
    {"name": "opencut_edit", "description": "Run a list of edit actions in LexCut as one undoable step. Returns errors and the new project state.",
     "inputSchema": {"type": "object", "properties": {"actions": {"type": "array", "items": {"type": "object"}, "description": 'e.g. [{"type":"add_text","text":"Hello","start":0,"dur":3}]'}}, "required": ["actions"]}},
    {"name": "opencut_screenshot", "description": "A JPEG of the editor preview at a time in seconds (default: the playhead). Use it to check the result of an edit.",
     "inputSchema": {"type": "object", "properties": {"t": {"type": "number"}}}},
    {"name": "opencut_undo", "description": "Undo the last edit.", "inputSchema": {"type": "object", "properties": {}}},
    {"name": "opencut_redo", "description": "Redo.", "inputSchema": {"type": "object", "properties": {}}},
]
OPS = {"opencut_get_state": "get_state", "opencut_help": "help", "opencut_edit": "run_actions", "opencut_screenshot": "screenshot", "opencut_undo": "undo", "opencut_redo": "redo"}


def call(op, args):
    try:
        token = TOKEN_FILE.read_text().strip()
    except OSError:
        raise RuntimeError("No token yet: start LexCut (server.py) once, then try again.")
    req = urllib.request.Request(URL, json.dumps({"op": op, "args": args}).encode(), {"X-OpenCut-Token": token, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=150) as r:
            out = json.load(r)
    except urllib.error.HTTPError as e:
        out = json.loads(e.read() or b"{}")
        raise RuntimeError(out.get("error") or f"HTTP {e.code}")
    except OSError:
        raise RuntimeError(f"LexCut is not running on port {PORT}. Start it with the LexCut launcher (or: python server.py).")
    if not out.get("ok"):
        raise RuntimeError(out.get("error") or "failed")
    return out["result"]


def run_tool(name, args):
    res = call(OPS[name], args or {})
    if name == "opencut_screenshot":
        return [{"type": "image", "data": res["b64"], "mimeType": res["mime"]}, {"type": "text", "text": f"Preview at {res['t']} s"}]
    return [{"type": "text", "text": res if isinstance(res, str) else json.dumps(res, ensure_ascii=False)}]


def reply(i, result=None, error=None):
    m = {"jsonrpc": "2.0", "id": i}
    m.update({"error": error} if error else {"result": result})
    sys.stdout.write(json.dumps(m) + "\n")
    sys.stdout.flush()


def main():
    # MCP messages are UTF-8 JSON lines. Windows would otherwise use its code page and "\r\n" line ends.
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8", newline="\n")
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            m = json.loads(line)
        except ValueError:
            continue
        i, method, p = m.get("id"), m.get("method"), m.get("params") or {}
        if i is None:
            continue   # notifications (initialized, cancelled)
        if method == "initialize":
            reply(i, {"protocolVersion": p.get("protocolVersion", "2024-11-05"), "capabilities": {"tools": {}}, "serverInfo": {"name": "opencut", "version": "1.0"}})
        elif method == "tools/list":
            reply(i, {"tools": TOOLS})
        elif method == "tools/call":
            if p.get("name") not in OPS:
                reply(i, error={"code": -32602, "message": "unknown tool"})
                continue
            try:
                reply(i, {"content": run_tool(p["name"], p.get("arguments"))})
            except Exception as e:
                reply(i, {"content": [{"type": "text", "text": str(e)}], "isError": True})
        elif method == "ping":
            reply(i, {})
        else:
            reply(i, error={"code": -32601, "message": "method not found"})


if __name__ == "__main__":
    main()
