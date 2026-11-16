# Build the full soundtrack: voices + original synthesized music (mood per scene) + sound effects.
import json, numpy as np, soundfile as sf

SR = 48000
tl = json.load(open('timeline.json'))
WARP, TOTAL = tl['warp'], tl['end']
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(7)

def old2new(o):
    for (a0, o0), (a1, o1) in zip(WARP, WARP[1:]):
        if o <= o1:
            return a0 + (a1 - a0) * ((o - o0) / (o1 - o0) if o1 > o0 else 0)
    return WARP[-1][0]

def place(buf, sig, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    sig = sig[: len(buf) - i]
    buf[i:i + len(sig)] += sig * gain

# ---------------- voices ----------------
voice = np.zeros(N)
for s in tl['segs']:
    a, sr = sf.read('proc/' + s['file'])
    if a.ndim > 1: a = a.mean(1)
    a = a / (np.abs(a).max() + 1e-9) * 0.82
    place(voice, a, s['start'])

# ---------------- instruments ----------------
def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)
def marimba(f, dur=0.6, v=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2*np.pi*f*t) + 0.25*np.sin(2*np.pi*4*f*t)*np.exp(-t/0.05) + 0.1*np.sin(2*np.pi*10*f*t)*np.exp(-t/0.02)
    return s * env(n, 0.002, 0.28) * v
def pluck(f, dur=0.5, v=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*2*f*t)*np.exp(-t/0.08) + 0.2*np.sin(2*np.pi*3*f*t)*np.exp(-t/0.04)
    return s * env(n, 0.003, 0.18) * v
def bass(f, dur=0.5, v=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*2*f*t)) * env(n, 0.01, 0.35) * v
def pad(freqs, dur, v=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*f*1.003*t) + 0.25*np.sin(2*np.pi*2*f*t) for f in freqs) / len(freqs)
    e = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return s * np.clip(e, 0, 1) * v
def shaker(v=1.0, dur=0.08):
    n = int(dur * SR); x = rng.standard_normal(n); x = np.diff(np.concatenate([[0], x]))
    return x * env(n, 0.003, 0.025) * v * 0.5
def wood(v=1.0):
    n = int(0.08 * SR); t = np.arange(n) / SR
    return np.sin(2*np.pi*1100*t) * env(n, 0.001, 0.02) * v
def kick(v=1.0):
    n = int(0.3 * SR); t = np.arange(n) / SR
    f = 50 + 70*np.exp(-t/0.04)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.002, 0.12) * v
def hz(m): return 440 * 2 ** ((m - 69) / 12)

# chord = (root midi, quality) ; quality: maj/min
def triad(root, q): return [root, root + (4 if q == 'maj' else 3), root + 7]
MOODS = {
  'happy':   dict(bpm=104, prog=[(60,'maj'),(67,'maj'),(69,'min'),(65,'maj')], arp='up',   perc='shaker', vol=1.0),
  'curious': dict(bpm=84,  prog=[(65,'maj'),(67,'maj'),(64,'min'),(69,'min')], arp='sparse', perc=None,  vol=0.8),
  'playful': dict(bpm=112, prog=[(67,'maj'),(72,'maj'),(74,'maj'),(67,'maj')], arp='bounce', perc='wood', vol=1.0),
  'sneaky':  dict(bpm=96,  prog=[(57,'min'),(53,'maj'),(50,'min'),(52,'maj')], arp='pizz', perc='wood',   vol=0.9),
  'tense':   dict(bpm=126, prog=[(50,'min'),(50,'min'),(46,'maj'),(45,'maj')], arp='pulse', perc='kick',  vol=0.9),
  'chase':   dict(bpm=144, prog=[(57,'min'),(55,'maj'),(53,'maj'),(52,'maj')], arp='run',  perc='shaker',  vol=1.0),
  'triumph': dict(bpm=116, prog=[(60,'maj'),(65,'maj'),(67,'maj'),(60,'maj')], arp='up',   perc='both',    vol=1.05),
  'gentle':  dict(bpm=78,  prog=[(65,'maj'),(60,'maj'),(62,'min'),(58,'maj')], arp='sparse', perc=None,   vol=0.85),
}
def section(mood, dur):
    M = MOODS[mood]; beat = 60 / M['bpm']; out = np.zeros(int((dur + 3) * SR)); t = 0.0; bar = 0
    while t < dur:
        root, q = M['prog'][bar % 4]; ch = triad(root, q)
        place(out, pad([hz(n - 12) for n in ch], beat * 4 + 0.6, 0.12 if mood != 'tense' else 0.16), t)
        place(out, bass(hz(root - 24), beat * 1.6, 0.55), t); place(out, bass(hz(root - 24 + 7), beat * 1.2, 0.35), t + beat * 2)
        a = M['arp']
        for k in range(8):
            tt = t + k * beat / 2; n = ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + (12 if k in (2, 5) else 0)
            if a == 'up': place(out, marimba(hz(n + 12), 0.5, 0.32), tt)
            elif a == 'sparse' and k in (0, 3, 6): place(out, marimba(hz(n + 12), 0.9, 0.28), tt)
            elif a == 'bounce': place(out, marimba(hz(n + (12 if k % 2 else 0)), 0.4, 0.32), tt)
            elif a == 'pizz' and k % 2 == 0: place(out, pluck(hz(n), 0.3, 0.38), tt + (0.04 if k % 4 else 0))
            elif a == 'pulse': place(out, pluck(hz(root - 12 + (7 if k % 4 == 3 else 0)), 0.22, 0.42), tt)
            elif a == 'run': place(out, marimba(hz(n + 12), 0.25, 0.3), tt); place(out, marimba(hz(n + 7), 0.2, 0.18), tt + beat / 4)
            p = M['perc']
            if p in ('shaker', 'both'): place(out, shaker(0.5 if k % 2 else 0.3), tt)
            if p in ('wood', 'both') and k in (2, 6): place(out, wood(0.25), tt)
            if p in ('kick', 'both') and k in (0, 4): place(out, kick(0.55), tt)
        t += beat * 4; bar += 1
    return out[: int(dur * SR) + int(1.5 * SR)] * M['vol']

SECTIONS = [(0, 'happy'), (9.5, 'curious'), (25, 'playful'), (43.8, 'sneaky'), (53.5, 'tense'), (68, 'curious'),
            (75, 'sneaky'), (98.2, 'chase'), (106.4, 'triumph'), (132.5, 'gentle')]
music = np.zeros(N)
for i, (o, mood) in enumerate(SECTIONS):
    a = old2new(o); b = old2new(SECTIONS[i + 1][0]) if i + 1 < len(SECTIONS) else TOTAL
    sec = section(mood, b - a)
    fade = int(1.2 * SR); e = np.ones(len(sec)); e[:fade] = np.linspace(0, 1, fade)
    tail = len(sec) - int((b - a) * SR); e[-tail:] = np.linspace(1, 0, tail) if tail > 0 else 1
    place(music, sec * e, a)
# fade the music in/out at the very start and end
music[: int(1.0 * SR)] *= np.linspace(0, 1, int(1.0 * SR))
end = int(TOTAL * SR); music[end - int(2.5 * SR): end] *= np.linspace(1, 0, int(2.5 * SR)); music[end:] = 0

# ---------------- sound effects ----------------
sfx = np.zeros(N)
def noise_burst(dur, lo, hi, d):
    n = int(dur * SR); x = rng.standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n); y = y / (np.abs(y).max() + 1e-9)
    return y * env(n, 0.005, d)
def splash(v=1.0):
    s = noise_burst(1.4, 300, 6000, 0.35) * 0.9
    for i in range(10):  # droplets
        f = 900 + rng.random() * 1600; n = int(0.06 * SR); t = np.arange(n) / SR
        drop = np.sin(2*np.pi*(f + 1500*t)*t) * env(n, 0.002, 0.02) * 0.4
        j = int((0.15 + rng.random() * 0.8) * SR); s[j:j + n] += drop[: len(s) - j]
    return s * v
def bubble(v=1.0):
    n = int(0.12 * SR); t = np.arange(n) / SR; f = 300 + 1200 * t / 0.12
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.003, 0.05) * v
def pop(v=1.0):
    n = int(0.09 * SR); t = np.arange(n) / SR; f = 900 - 500 * t / 0.09
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.001, 0.03) * v
def ding(v=1.0):
    n = int(1.6 * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*1568*t) + .5*np.sin(2*np.pi*2350*t) + .3*np.sin(2*np.pi*3136*t)) * env(n, 0.002, 0.5) * v
def chime(v=1.0):
    out = np.zeros(int(2.5 * SR))
    for k, m in enumerate([72, 76, 79, 84]): place(out, marimba(hz(m), 1.5, 0.6), k * 0.12)
    return out * v
def chirp(v=1.0):
    n = int(0.18 * SR); t = np.arange(n) / SR; f = 2600 + 1400*np.sin(2*np.pi*14*t)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * env(n, 0.005, 0.07) * v
def growl(v=1.0):
    n = int(1.3 * SR); t = np.arange(n) / SR; f = 70 + 25*np.sin(2*np.pi*3*t)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * (0.5 + 0.5*np.sin(2*np.pi*7*t)) * np.minimum(1, t/0.1) * np.minimum(1, (1.3-t)/0.2) * v
def whoosh(v=1.0, dur=0.6):
    n = int(dur * SR); t = np.arange(n) / SR; x = noise_burst(dur, 200, 2500, 10)
    return x * np.sin(np.pi * t / dur) ** 2 * v
def tap(v=1.0):
    return noise_burst(0.05, 800, 4000, 0.012) * v

place(sfx, chime(0.5), old2new(0.9))
for i in range(14): place(sfx, chirp(0.12), old2new(0.5 + rng.random() * 13))
for k in range(4): place(sfx, whoosh(0.12, 0.7), old2new(1.2 + k * 1.65))     # vine swings
place(sfx, splash(0.55), old2new(25.0)); place(sfx, splash(0.3), old2new(41.1)); place(sfx, splash(0.5), old2new(53.8))
place(sfx, splash(0.35), old2new(70.5)); place(sfx, splash(0.55), old2new(101.6))
for k in range(26): place(sfx, bubble(0.18), old2new(54.2 + rng.random() * 15.5))
for o in (46.0, 59.5, 75.6, 87.6): place(sfx, pop(0.35), old2new(o))
place(sfx, ding(0.28), old2new(68.0))
place(sfx, whoosh(0.3, 0.8), old2new(98.2))
for k in range(10): place(sfx, tap(0.35), old2new(104.2 + k * 0.16))
place(sfx, growl(0.4), old2new(123.4))
place(sfx, chime(0.45), old2new(136.6))
# river ambience (soft, continuous after the monkey reaches the water)
amb = noise_burst(TOTAL + 1, 150, 1200, 1e9)
amb = amb / np.abs(amb).max() * 0.035
a0 = int(old2new(9.5) * SR); ramp = int(2 * SR)
amb[:a0] = 0; amb[a0:a0 + ramp] *= np.linspace(0, 1, ramp)
sfx[: len(amb)] += amb[: N]

# ---------------- mix with ducking ----------------
venv = np.convolve(np.abs(voice), np.ones(int(0.15 * SR)) / int(0.15 * SR), mode='same')
duck = 1 - 0.55 * np.clip(venv / 0.08, 0, 1)
duck = np.convolve(duck, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode='same')
music = music / (np.abs(music).max() + 1e-9) * 0.30
mix = voice * 1.0 + music * duck + sfx * 0.9
mix = mix[: int(TOTAL * SR)]
print("peaks: voice %.2f music %.2f sfx %.2f" % (np.abs(voice).max(), np.abs(music*duck).max(), np.abs(sfx*0.9).max()))
k=np.argmax(np.abs(sfx)); print("sfx peak at %.1fs" % (k/SR))
peak = np.abs(mix).max(); mix = np.tanh(mix*1.1)/np.tanh(1.1)*0.9 if peak > 0.95 else mix
st = np.stack([mix, mix], 1)
sf.write('soundtrack.wav', st, SR)
sf.write('music_only.wav', (music * duck)[: int(TOTAL * SR)], SR)
print('soundtrack: %.1fs, peak before limit %.2f' % (len(mix) / SR, peak))
