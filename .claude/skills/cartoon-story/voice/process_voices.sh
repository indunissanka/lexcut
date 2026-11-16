#!/usr/bin/env bash
# Give each character its own sound. N = narrator, M = monkey (higher), C = crocodile (deeper, slight echo).
# usage: bash process_voices.sh   (run in the work folder after synth.py)
set -e; mkdir -p proc
for f in raw_*_N.wav; do ffmpeg -v error -y -i "$f" -af "aresample=48000,highpass=f=70,acompressor=threshold=-18dB:ratio=2.5:attack=5:release=80" "proc/$f"; done
for f in raw_*_M.wav; do ffmpeg -v error -y -i "$f" -af "asetrate=24000*1.16,atempo=1/1.16,aresample=48000,highpass=f=120,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=-18dB:ratio=2.5:attack=5:release=80" "proc/$f"; done
for f in raw_*_C.wav; do ffmpeg -v error -y -i "$f" -af "asetrate=24000*0.86,atempo=1/0.86,aresample=48000,bass=g=4:f=140,acompressor=threshold=-18dB:ratio=2.5:attack=5:release=80,aecho=0.8:0.5:40:0.18" "proc/$f"; done
echo "processed $(ls proc | wc -l) clips"
