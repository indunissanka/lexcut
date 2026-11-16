#!/usr/bin/env bash
# Render the story in 4 parallel parts (frozen time, exact frames), join, add the soundtrack, and make a small web copy.
# usage: bash make_video.sh <story.html> <timeline.json> <soundtrack.wav> <out-name>
set -e
HTML=$1; TL=$2; WAV=$3; OUT=$4; DIR=$(cd "$(dirname "$0")" && pwd)
N=$(python3 -c "import json;print(round(json.load(open('$TL'))['end']*30))"); Q=$(( (N+3)/4 ))
for i in 0 1 2 3; do a=$((i*Q)); b=$(( (i+1)*Q )); [ $b -gt $N ] && b=$N; node "$DIR/render-part.js" "$HTML" "part$i.mp4" $a $b 30 > "log$i.txt" 2>&1 & done; wait
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > parts.txt
ffmpeg -v error -y -f concat -safe 0 -i parts.txt -c copy video_only.mp4
ffmpeg -v error -y -i video_only.mp4 -i "$WAV" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT-1080p.mp4"
ffmpeg -v error -y -i "$OUT-1080p.mp4" -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 30 -maxrate 900k -bufsize 1800k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$OUT-web.mp4"
ls -la "$OUT"-*.mp4
