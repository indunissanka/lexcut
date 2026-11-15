    sound(k) {
      k.bed('room', 0, DUR, { gain: 1.0 });
      k.music('pad', 0, DUR, { bpm: 76, chords: [['G3', 'B3', 'D4', 'F#4'], ['E3', 'G3', 'B3', 'D4'], ['C3', 'E3', 'G3', 'B3'], ['D3', 'F#3', 'A3', 'C4']], gain: 0.45 });
      const NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5', 'D5'];
      TURNS.forEach((t0, s) => {
        const hit = landed(s);
        if (t0 > 0) { k.play('paper', t0 + 0.02, { gain: 1.4, dur: 0.5, pan: 0.4 }); k.play('whoosh', t0 + 0.3, { gain: 0.55, dur: 0.8, top: 1500 }); k.play('paper', t0 + 0.5, { gain: 0.9, dur: 0.7 }); }
        k.withMinor(() => { for (let i = 0; i < 7; i++) if (hit - 0.62 + i * 0.085 > 0) k.play('tick', hit - 0.62 + i * 0.085, { gain: 0.45 + 0.06 * i, f: 1900 + i * 260, pan: -0.3 + i * 0.1 }); });   // card creaking upright
        if (hit > 0) { k.play('slap', hit, { gain: 0.6, pan: -0.3 }); k.play('thud', hit, { gain: 0.5, f: 105, pan: -0.3 }); k.play('paper', hit + 0.04, { gain: 0.45, dur: 0.22 }); }
        k.play('ding', Math.max(0.05, hit + 0.14), { gain: 0.26, f: NOTES[s % NOTES.length] });
        k.withMinor(() => { for (let i = 0; i < 4; i++) if (hit + 0.19 > 0) k.play('tick', hit + 0.19 + i * 0.3, { gain: 0.14 - 0.03 * i, f: 5200, pan: 0.2 }); });   // pieces trembling on their arms
      });
      // a village bull, low and calm (in the thought clouds)
      const moo = (t) => { k.tone(t, { f: [[0, 'A2'], [0.25, 'C3'], [0.95, 'G2']], type: 'sawtooth', dur: 1.05, gain: 0.07, a: 0.09, hold: 0.6, filter: 'lowpass', f2: 650, verb: 0.2 }); k.tone(t + 0.02, { f: [[0, 'A2'], [0.25, 'C3'], [0.95, 'G2']], type: 'triangle', dur: 1.0, gain: 0.08, a: 0.1, hold: 0.55, detune: 14 }); };
      REVEALS.forEach(({ at, kind }) => {
        const t = at - 0.3;                                                     // the piece breaks the page here
        if (kind === 'sink') { k.withMinor(() => k.play('paper', at - 0.3, { gain: 0.5, dur: 0.35, pan: -0.2 })); return; }
        k.withMinor(() => { k.play('tape', t, { gain: 0.6, dur: 0.32, pan: 0.15 }); k.play('tick', at + 0.15, { gain: 0.35, f: 3000 }); });
        if (kind === 'ribbon') k.withMinor(() => { k.play('paper', t, { gain: 0.5, dur: 0.3 }); k.play('tock', at + 0.15, { gain: 0.35, f: 640 }); });
        else if (kind === 'invite') { k.play('paper', t, { gain: 0.7, dur: 0.3 }); k.play('ding', at + 0.15, { gain: 0.3, f: 'E6' }); }
        else if (kind === 'jump') { k.play('jump', at - 0.05, { gain: 0.5 }); k.play('pop', at + 0.12, { gain: 0.5, f: 520 }); }
        else if (kind === 'no') k.play('stamp', at + 0.1, { gain: 0.8 });
        else if (kind === 'card') k.play('tock', at + 0.12, { gain: 0.6, f: 520 });
        else if (kind === 'bull') { k.play('pop', at + 0.1, { gain: 0.45, f: 560, minor: true }); moo(at + 0.15); }
        else if (kind === 'gate') k.play('sparkle', at + 0.05, { gain: 0.7, n: 6 });
        else if (kind === 'dust') { k.play('impact', at, { gain: 0.8 }); k.withMinor(() => { for (let i = 0; i < 5; i++) k.play('thud', at + 0.25 + i * 0.16, { gain: 0.35, f: 120 + 25 * (i % 3) }); }); }
        else if (kind === 'run') k.play('whoosh', at - 0.15, { gain: 0.6, dur: 0.6, pan: 0.5 });
        else if (kind === 'tumble') { k.play('swish', at - 0.05, { gain: 0.5 }); k.play('thud', at + 0.12, { gain: 0.6, f: 115 }); k.play('thud', at + 0.3, { gain: 0.45, f: 95 }); }
        else if (kind === 'speech') k.play('blip', at, { gain: 0.7, f: 'A5' });
        else if (kind === 'charge') { k.play('thud', at, { gain: 0.8, f: 90 }); k.play('swish', at - 0.12, { gain: 0.55 }); k.play('ding', at + 0.1, { gain: 0.12, f: 'C7' }); }
        else k.play('pop', at + 0.12, { gain: 0.55, f: kind === 'person' ? 480 : 640, minor: kind !== 'person' });
      });
      // wedding drums inside the hall, soft under the narration
      k.withMinor(() => { for (let t = landed(4) + 0.2, i = 0; t < TURNS[5] + 0.2; t += 0.27, i++) { const b = i % 8; if (b === 0 || b === 3 || b === 6) k.play('thud', t, { gain: b === 0 ? 0.32 : 0.22, f: b === 0 ? 120 : 160, pan: -0.4 }); if (b === 2 || b === 5 || b === 7) k.play('tock', t, { gain: 0.18, f: 420, pan: 0.3 }); } });
      // the hubbub in the yard, from the commotion until mother grabs him
      k.withMinor(() => { const r = K.rng(311); for (let t = W(12, 'huge'); t < TURNS[7] + 1.0; t += 0.05 + r() * 0.1) k.noise(t, { dur: 0.12 + r() * 0.15, color: 'pink', filter: 'bandpass', f: 450 + r() * 1100, q: 2.5, gain: 0.035 + r() * 0.03, a: 0.03, pan: r() * 1.4 - 0.7 }); });
      // Andare's charges and head-rocks on the yard
      LUNGES.forEach((l) => { k.play('swish', l - 0.12, { gain: 0.5 }); k.play('thud', l + 0.05, { gain: 0.65, f: 88 }); });
      k.withMinor(() => { for (let t = W(16, 'tilting'); t < W(16, 'people'); t += Math.PI / 7.5) k.play('tick', t, { gain: 0.3, f: 1600, pan: 0.2 }); });
      // the pull tab: everyone laughs
      k.play('tape', PULL[0], { gain: 1.2, dur: PULL[1] - PULL[0], pan: 0.4 }); k.play('paper', PULL[0], { gain: 0.7, dur: 0.7, pan: 0.4 });
      k.play('tock', PULL[1], { gain: 0.55, f: 500, pan: 0.4 }); k.play('sparkle', PULL[1] + 0.05, { gain: 0.8, n: 8 }); k.play('success', PULL[1] + 0.2, { gain: 0.6, f: 'C6' });
      k.play('ding', BEATS[BEATS.length - 1].t[1] + 0.35, { gain: 0.3, f: 'G5' });
    },
  });
}
