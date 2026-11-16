# Write the stretched timeline (WARP/TOTAL) and exact speaking windows into the story HTML.
# usage: python apply_timeline.py <story.html> <timeline.json>
import json, re, sys
html, tlf = sys.argv[1], sys.argv[2]
s = open(html).read(); tl = json.load(open(tlf)); warp = tl['warp']
def new2old(t):
    for (a0, o0), (a1, o1) in zip(warp, warp[1:]):
        if t <= a1: return o0 + (o1 - o0) * ((t - a0) / (a1 - a0) if a1 > a0 else 0)
    return warp[-1][1]
win = lambda who: [[round(new2old(g['start']), 3), round(new2old(g['start'] + g['dur']), 3)] for g in tl['segs'] if g['who'] == who]
s = re.sub(r"const WARP=\[.*?\], TOTAL=[\d.]+;", "const WARP=" + json.dumps(warp) + ", TOTAL=" + str(tl['end']) + ";", s, flags=re.S)
s = re.sub(r"const MONKEY_TALK=\[.*?\];", "const MONKEY_TALK=" + json.dumps(win('M')) + ";", s, flags=re.S)
s = re.sub(r"const CROC_TALK=\[.*?\];", "const CROC_TALK=" + json.dumps(win('C')) + ";", s, flags=re.S)
open(html, 'w').write(s); print('timeline applied: %.1fs' % tl['end'])
