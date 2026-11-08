"""Label who speaks each transcript segment (Person 1, Person 2, ...).

Runs inside ~/.opencut/venv-tts (needs numpy, librosa, scikit-learn).
Usage: python diarize_worker.py AUDIO.pcm SEGMENTS.json [NUM_SPEAKERS]
  AUDIO.pcm      16 kHz mono 16-bit little-endian PCM
  SEGMENTS.json  [{"start": sec, "end": sec}, ...]
  NUM_SPEAKERS   optional; 0 or missing = detect automatically (1 to 6)
Prints one JSON line: {"speakers": [1, 2, 1, ...], "count": 2}   (1-based, numbered by first appearance)

Method: each segment becomes a voice fingerprint (MFCC mean/std + delta + pitch statistics), then
agglomerative clustering picks the number of voices by silhouette score. Segments too short to
fingerprint reliably are given the voice of the nearest reliable one.
"""
import json
import os
import sys
import warnings

import numpy as np

warnings.filterwarnings("ignore")
import librosa
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score

SR = 16000
MIN_SEC = 1.0          # shorter segments are too noisy to fingerprint
MAX_SPEAKERS = 6
SPLIT_SCORE = 0.22     # silhouette needed before claiming more than one voice


WIN, HOP = 1.6, 0.8    # a long segment is fingerprinted in overlapping windows, then the windows vote


def frames(y):
    """Per-frame MFCC (c1..c19) and log-F0 (nan where unvoiced) for a whole recording."""
    mf = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=20, n_fft=512, hop_length=160, n_mels=40)[1:]
    rms = librosa.feature.rms(y=y, frame_length=400, hop_length=160)[0]
    n = min(mf.shape[1], rms.shape[0])
    mf, rms = mf[:, :n], rms[:n]
    try:
        f0 = librosa.yin(y, fmin=60, fmax=400, sr=SR, frame_length=1024, hop_length=160)[:n]
    except Exception:
        f0 = np.full(n, np.nan)
    f0 = np.where((f0 > 62) & (f0 < 395), np.log(np.clip(f0, 1, None)), np.nan)
    loud = rms > max(np.percentile(rms, 35), 1e-4)       # speech frames, not pauses/room noise
    f0 = np.where(loud, f0, np.nan)
    return mf, rms, f0, loud


def fingerprint(mf, f0, loud, a, b, mu, sd):
    """Voice fingerprint of frames a..b: channel-normalised MFCC mean + spread, plus pitch."""
    m = loud[a:b]
    if m.sum() < 15:
        return None
    z = (mf[:, a:b][:, m] - mu[:, None]) / sd[:, None]           # remove this recording's microphone/room colour
    p = f0[a:b]; p = p[np.isfinite(p)]
    pitch = [np.median(p), p.std()] if p.size >= 8 else [np.nan, np.nan]
    raw = mf[:, a:b][:, m].mean(1)
    return np.concatenate([z.mean(1), 0.5 * z.std(1)]), pitch, raw


def choose_labels(X, forced):
    return choose(X, forced)


def choose(X, forced):
    n = len(X)
    if n < 2:
        return np.zeros(n, int)
    if forced:
        k = min(forced, n)
        return AgglomerativeClustering(n_clusters=k, linkage="ward").fit_predict(X) if k > 1 else np.zeros(n, int)
    best, best_s = np.zeros(n, int), SPLIT_SCORE
    for k in range(2, min(MAX_SPEAKERS, n - 1) + 1):
        lab = AgglomerativeClustering(n_clusters=k, linkage="ward").fit_predict(X)
        if min(np.bincount(lab)) < max(2, int(0.08 * n)):   # a "voice" with almost no lines is usually noise
            continue
        s = silhouette_score(X, lab)
        if s > best_s + 0.02 * (k - 2):                        # slight bias toward fewer voices
            best, best_s = lab, s
    return best


MATCH_MAX = 0.4        # raw distance under which a voice counts as the saved one (same voice 0.1-0.25; a similar different voice 0.5+)
MATCH_RATIO = 0.6      # ...and it must clearly beat the runner-up


def enrolled_prints(path, sd):
    """Raw fingerprints of each saved Voice Studio voice from its sample files."""
    out = {}
    for name, files in json.load(open(path)).items():
        vecs, pit = [], []
        for f in files:
            try:
                y, _ = librosa.load(f, sr=SR, mono=True)
                mf, rms, f0, loud = frames(y)
                if loud.sum() < 30:
                    continue
                vecs.append(mf[:, loud].mean(1))
                p = f0[np.isfinite(f0)]
                if p.size > 20:
                    pit.append(np.median(p))
            except Exception:
                continue
        if vecs:
            out[name] = (np.mean(vecs, 0), np.mean(pit) if pit else np.nan)
    return out


def match_voices(units, lab, order, mf, loud, sd):
    """Which detected person is a saved voice? Returns {"1": "Nissanka", ...}; only confident matches."""
    enr = enrolled_prints(sys.argv[4], sd)
    if not enr:
        return {}
    cl = {}
    for (i, w, _, p, raw), l in zip(units, lab):
        cl.setdefault(int(l), []).append((w, raw, p[0]))
    cents = {}
    for l, v in cl.items():
        w = np.array([x[0] for x in v])
        raw = np.average([x[1] for x in v], axis=0, weights=w)
        pit = np.nanmedian([x[2] for x in v])
        cents[l] = (raw, pit)
    psd = 0.12
    def dist(a, b):
        d = np.linalg.norm((a[0] - b[0]) / sd) / np.sqrt(len(sd))
        if np.isfinite(a[1]) and np.isfinite(b[1]):
            d = np.hypot(d * 3.0, (a[1] - b[1]) / psd * 0.5) / 3.0
        return d
    pairs = sorted((dist(c, e), l, n) for l, c in cents.items() for n, e in enr.items())
    if os.environ.get("DIARIZE_DEBUG"):
        print(pairs, file=sys.stderr)
    out, usedl, usedn = {}, set(), set()
    for d, l, n in pairs:
        if l in usedl or n in usedn or d > MATCH_MAX:
            continue
        rivals = [dd for dd, ll, nn in pairs if (ll == l and nn != n) or (nn == n and ll != l)]
        if rivals and d > MATCH_RATIO * min(rivals):
            continue
        out[str(order[l])] = n
        usedl.add(l); usedn.add(n)
    return out


def main_mfcc():
    pcm = np.fromfile(sys.argv[1], dtype=np.int16).astype(np.float32) / 32768.0
    segs = json.load(open(sys.argv[2]))
    forced = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else 0
    mf, rms, f0, loud = frames(pcm)
    mu, sd = mf[:, loud].mean(1), mf[:, loud].std(1) + 1e-6
    fr = lambda t: int(t * 100)                                   # 100 frames per second
    units = []                                                    # (segment index, weight, mfcc fingerprint, pitch)
    for i, s in enumerate(segs):
        a, b = fr(s["start"]), min(fr(s["end"]), mf.shape[1])
        if (b - a) / 100 < MIN_SEC:
            continue
        starts = [a] if (b - a) / 100 <= WIN * 1.4 else list(range(a, b - int(WIN * 100) + 1, int(HOP * 100)))
        for w in starts:
            e = b if len(starts) == 1 else w + int(WIN * 100)
            r = fingerprint(mf, f0, loud, w, e, mu, sd)
            if r:
                units.append((i, (e - w) / 100, r[0], r[1], r[2]))
    if not units:
        print(json.dumps({"speakers": [1] * len(segs), "count": 1}))
        return
    X = np.array([u[2] for u in units])
    P = np.array([u[3] for u in units], dtype=float)
    # pitch is the strongest single cue between people; fill gaps with the median and give it real weight
    med = np.nanmedian(P, axis=0)
    P = np.where(np.isnan(P), med, P)
    P = (P - P.mean(0)) / (P.std(0) + 1e-6)
    X = (X - X.mean(0)) / (X.std(0) + 1e-6)
    X = np.hstack([X, P * 3.0])
    lab = choose(X, forced)
    # each segment takes the voice most of its windows (weighted by length) belong to
    votes = {}
    for (i, w, _, _, _), l in zip(units, lab):
        votes.setdefault(i, {}).setdefault(int(l), 0.0)
        votes[i][int(l)] += w
    out = [None] * len(segs)
    for i, v in votes.items():
        out[i] = max(v, key=v.get)
    known = sorted(votes)
    for i in range(len(segs)):
        if out[i] is None:                                         # too short/quiet: neighbour in time, the usual speaker of a quick reply
            out[i] = out[min(known, key=lambda k: abs(k - i))]
    order = {}
    for v in out:
        order.setdefault(v, len(order) + 1)
    # smooth lone flips: A B A where B is a very short segment is almost always A
    res = [order[v] for v in out]
    for i in range(1, len(res) - 1):
        d = segs[i]["end"] - segs[i]["start"]
        if res[i - 1] == res[i + 1] != res[i] and d < 1.2:
            res[i] = res[i - 1]
    matches = match_voices(units, lab, order, mf, loud, sd) if len(sys.argv) > 4 and sys.argv[4] else {}
    print(json.dumps({"speakers": res, "count": len(set(res)), "matches": matches}))


NEURAL_WIN, NEURAL_HOP = 3.0, 1.5
MATCH_SIM = 0.76        # cosine similarity of voice prints needed to name a person as a saved voice
MATCH_MARGIN = 0.05     # ...and it must beat the runner-up by this much
SPLIT_SIM = 0.80        # two clusters whose centres are this similar are the same person


def neural_encoder():
    import types
    sys.modules.setdefault("webrtcvad", types.ModuleType("webrtcvad"))   # only used by Resemblyzer's own silence trimming, which we do not use
    from resemblyzer import VoiceEncoder
    import io, contextlib
    with contextlib.redirect_stdout(io.StringIO()):
        return VoiceEncoder("cpu")


def embed(enc, y):
    rms = float(np.sqrt(np.mean(y ** 2))) + 1e-9
    y = np.clip(y * (10 ** (-30 / 20) / rms), -1, 1)                     # same loudness normalisation Resemblyzer uses
    e = enc.embed_utterance(y.astype(np.float32))
    return e / (np.linalg.norm(e) + 1e-9)


def choose_neural(E, forced):
    n = len(E)
    if n < 2:
        return np.zeros(n, int)
    def cl(k):
        return AgglomerativeClustering(n_clusters=k, metric="cosine", linkage="average").fit_predict(E)
    def sep(lab):                                                         # most similar pair of cluster centres
        c = np.array([E[lab == k].mean(0) for k in set(lab)]); c /= np.linalg.norm(c, axis=1, keepdims=True)
        sim = c @ c.T; np.fill_diagonal(sim, -1); return sim.max()
    if forced:
        return cl(min(forced, n)) if min(forced, n) > 1 else np.zeros(n, int)
    best, best_s = np.zeros(n, int), 0.12
    for k in range(2, min(MAX_SPEAKERS, n - 1) + 1):
        lab = cl(k)
        if min(np.bincount(lab)) < max(2, int(0.06 * n)) or sep(lab) > SPLIT_SIM:
            continue
        sc = silhouette_score(E, lab, metric="cosine")
        if sc > best_s + 0.02 * (k - 2):
            best, best_s = lab, sc
    return best


def main():
    try:
        enc = neural_encoder()
    except Exception as e:
        print("neural speaker model unavailable, using basic features: %s" % e, file=sys.stderr)
        return main_mfcc()
    pcm = np.fromfile(sys.argv[1], dtype=np.int16).astype(np.float32) / 32768.0
    segs = json.load(open(sys.argv[2]))
    forced = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else 0
    units = []                                                            # (segment, weight, embedding)
    for i, s in enumerate(segs):
        a, b = int(s["start"] * SR), min(int(s["end"] * SR), len(pcm))
        if (b - a) / SR < MIN_SEC:
            continue
        w, h = int(NEURAL_WIN * SR), int(NEURAL_HOP * SR)
        starts = [a] if b - a <= w * 1.4 else list(range(a, b - w + 1, h))
        for st in starts:
            en = b if len(starts) == 1 else st + w
            y = pcm[st:en]
            if np.abs(y).max() < 0.005:
                continue
            units.append((i, (en - st) / SR, embed(enc, y)))
    if not units:
        print(json.dumps({"speakers": [1] * len(segs), "count": 1, "matches": {}, "engine": "neural"}))
        return
    E = np.array([u[2] for u in units])
    lab = choose_neural(E, forced)
    votes = {}
    for (i, w, _), l in zip(units, lab):
        votes.setdefault(i, {}).setdefault(int(l), 0.0)
        votes[i][int(l)] += w
    out = [None] * len(segs)
    for i, v in votes.items():
        out[i] = max(v, key=v.get)
    known = sorted(votes)
    for i in range(len(segs)):
        if out[i] is None:
            out[i] = out[min(known, key=lambda k: abs(k - i))]
    order = {}
    for v in out:
        order.setdefault(v, len(order) + 1)
    res = [order[v] for v in out]
    for i in range(1, len(res) - 1):
        if res[i - 1] == res[i + 1] != res[i] and segs[i]["end"] - segs[i]["start"] < 1.2:
            res[i] = res[i - 1]
    matches = {}
    prints = {}
    for l in set(int(x) for x in lab):
        c = E[lab == l].mean(0)
        prints[str(order[l])] = [round(float(x), 4) for x in c / np.linalg.norm(c)]
    if len(sys.argv) > 4 and sys.argv[4]:
        cents = {}
        for l in set(int(x) for x in lab):
            c = E[lab == l].mean(0); cents[l] = c / np.linalg.norm(c)
        enr = {}
        cfg = json.load(open(sys.argv[4]))
        remembered = cfg.get("prints", {})
        for name, files in cfg.get("voices", cfg if "prints" not in cfg else {}).items():
            vs = []
            for f in files:
                try:
                    y, _ = librosa.load(f, sr=SR, mono=True)
                    for k in range(0, max(1, len(y) - SR), int(10 * SR)):     # 10 s pieces, so long samples count fully
                        piece = y[k:k + int(10 * SR)]
                        if len(piece) >= 2 * SR and np.abs(piece).max() > 0.005:
                            vs.append(embed(enc, piece))
                except Exception:
                    continue
            if vs:
                c = np.mean(vs, 0); enr.setdefault(name, []).append(c / np.linalg.norm(c))
        for name, plist in remembered.items():          # voices the user confirmed in earlier videos: same microphone and room as the video
            for pr in plist:
                v = np.array(pr, dtype=np.float32)
                if v.shape == (256,):
                    enr.setdefault(name, []).append(v / (np.linalg.norm(v) + 1e-9))
        pairs = sorted(((max(float(c @ r) for r in refs), l, n) for l, c in cents.items() for n, refs in enr.items()), reverse=True)
        if os.environ.get("DIARIZE_DEBUG"):
            print([(round(a, 3), l, n) for a, l, n in pairs], file=sys.stderr)
        usedl, usedn = set(), set()
        for sim, l, n in pairs:
            if l in usedl or n in usedn or sim < MATCH_SIM:
                continue
            rivals = [x for x, ll, nn in pairs if (ll == l and nn != n) or (nn == n and ll != l)]
            if rivals and sim - max(rivals) < MATCH_MARGIN:
                continue
            matches[str(order[l])] = n
            usedl.add(l); usedn.add(n)
    print(json.dumps({"speakers": res, "count": len(set(res)), "matches": matches, "prints": prints, "engine": "neural"}))


main()
