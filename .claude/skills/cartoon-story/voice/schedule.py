# Build a new timeline: each cue gets enough time for its speech; gaps between cues keep their length.
import json, re
import sys
srt = open(sys.argv[1]).read()   # usage: python schedule.py <story.html>  (run in the work folder)
srt = srt[srt.index('const SRT=`')+11: srt.index('`;', srt.index('const SRT=`'))]
cues = []
for b in re.split(r'\n\s*\n', srt.strip()):
    L = b.split('\n'); m = re.findall(r'(\d+):(\d+):(\d+),(\d+)', L[1])
    ts = lambda h, mi, s, ms: int(h)*3600+int(mi)*60+int(s)+int(ms)/1000
    cues.append({'n': int(L[0]), 'a': ts(*m[0]), 'b': ts(*m[1]), 'text': L[2:]})
raw = json.load(open('raw.json'))
GAP, LEAD, TAIL = 0.22, 0.08, 0.28
warp = [[0.0, 0.0]]          # [new_time, old_time] breakpoints
tnew, told = 0.0, 0.0
segs = []
for c in cues:
    gap = c['a'] - told
    if told > 0: gap = min(gap, 0.8)                     # close up gaps left by removed lines
    tnew += gap; told = c['a']
    warp.append([round(tnew, 3), told])
    lines = [r for r in raw if r['cue'] == c['n']]
    need = LEAD + sum(r['dur'] for r in lines) + GAP*(len(lines)-1) + TAIL
    L = max(c['b'] - c['a'], need)
    t = tnew + LEAD
    for r in lines:
        segs.append({'file': r['file'], 'who': r['who'], 'start': round(t, 3), 'dur': r['dur']}); t += r['dur'] + GAP
    c['na'], c['nb'] = round(tnew, 3), round(tnew + L, 3)
    tnew += L; told = c['b']
    warp.append([round(tnew, 3), told])
END_OLD = 142.5
tnew += END_OLD - told; warp.append([round(tnew, 3), END_OLD])
json.dump({'warp': warp, 'segs': segs, 'end': round(tnew, 3), 'cues': [{'n': c['n'], 'a': c['na'], 'b': c['nb'], 'text': c['text']} for c in cues]}, open('timeline.json', 'w'), indent=1)
fmt = lambda s: f"{int(s//3600):02d}:{int(s%3600//60):02d}:{int(s%60):02d},{int(round((s-int(s))*1000))%1000:03d}"
with open('monkey-crocodile.srt', 'w') as f:
    for i, c in enumerate(cues): f.write(f"{i+1}\n{fmt(c['na'])} --> {fmt(c['nb'])}\n" + '\n'.join(c['text']) + '\n\n')
print('new length: %.1fs (was %.1fs); stretched cues: %d' % (tnew, END_OLD, sum(1 for c in cues if c['nb']-c['na'] > c['b']-c['a']+.01)))
