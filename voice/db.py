"""SQLite storage with versioned, additive migrations (existing data is never dropped)."""
import json
import sqlite3
import threading
import time
import uuid

from . import config

_lock = threading.RLock()
_conn = None

MIGRATIONS = [
    """
    CREATE TABLE voices(
      id TEXT PRIMARY KEY, name TEXT NOT NULL, project TEXT DEFAULT '', language TEXT DEFAULT 'en',
      gender TEXT DEFAULT '', style TEXT DEFAULT 'natural', provider TEXT NOT NULL, model TEXT DEFAULT '',
      status TEXT DEFAULT 'draft', settings TEXT DEFAULT '{}', lexicon TEXT DEFAULT '{}',
      version INTEGER DEFAULT 1, consent_by TEXT DEFAULT '', consent_at REAL, consent_text TEXT DEFAULT '',
      created_at REAL, updated_at REAL);
    CREATE TABLE samples(
      id TEXT PRIMARY KEY, voice_id TEXT NOT NULL, filename TEXT, path TEXT, duration REAL,
      quality TEXT DEFAULT '{}', created_at REAL);
    CREATE TABLE jobs(
      id TEXT PRIMARY KEY, voice_id TEXT, text_len INTEGER, params TEXT, cache_key TEXT,
      status TEXT, error TEXT DEFAULT '', out_path TEXT DEFAULT '', duration REAL DEFAULT 0,
      cached INTEGER DEFAULT 0, created_at REAL, started_at REAL, finished_at REAL, kind TEXT DEFAULT 'tts');
    CREATE INDEX jobs_status ON jobs(status);
    CREATE INDEX jobs_key ON jobs(cache_key);
    CREATE TABLE audit(id INTEGER PRIMARY KEY AUTOINCREMENT, ts REAL, action TEXT, voice_id TEXT, detail TEXT);
    """,
]


def conn() -> sqlite3.Connection:
    global _conn
    with _lock:
        if _conn is None:
            c = sqlite3.connect(config.data_dir() / "voices.db", check_same_thread=False, isolation_level=None)
            c.row_factory = sqlite3.Row
            c.execute("PRAGMA journal_mode=WAL")
            ver = c.execute("PRAGMA user_version").fetchone()[0]
            for i, sql in enumerate(MIGRATIONS[ver:], start=ver):
                c.execute("BEGIN")
                try:
                    for stmt in filter(str.strip, sql.split(";")):
                        c.execute(stmt)
                    c.execute(f"PRAGMA user_version={i + 1}")
                    c.execute("COMMIT")
                except Exception:
                    c.execute("ROLLBACK")
                    raise
            _conn = c
        return _conn


def q(sql, args=()):
    with _lock:
        return [dict(r) for r in conn().execute(sql, args).fetchall()]


def one(sql, args=()):
    r = q(sql, args)
    return r[0] if r else None


def run(sql, args=()):
    with _lock:
        return conn().execute(sql, args)


def new_id() -> str:
    return uuid.uuid4().hex[:16]


def audit(action: str, voice_id: str = "", **detail):
    run("INSERT INTO audit(ts,action,voice_id,detail) VALUES(?,?,?,?)", (time.time(), action, voice_id, json.dumps(detail)))
