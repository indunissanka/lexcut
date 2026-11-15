---
name: girl
description: "Girl" cartoon animation. A detailed, looping HTML5 canvas cartoon of a little girl in a yellow sundress running through a sunny meadow, chasing a monarch butterfly. Use when the user asks for the Girl animation, a girl or child chasing a butterfly, or a variation of it (different dress, hair, colours, speed, time of day, extra characters), or wants it fixed, extended or exported.
---

# Girl: little girl chasing a butterfly

A single, self-contained HTML file (`assets/girl-butterfly.html`) that draws and animates everything in code. It has no images and no libraries, and it works offline in any browser.

## What's in the scene

- **The girl** (`drawGirl`): a braided ponytail with a pink hair tie, big green eyes with eyelashes, freckles, blush and an open, laughing mouth. She wears a yellow polka-dot sundress with folds, stitching on the bodice, a ruffled collar, puffy sleeves and lace at the hem, plus a pink sash with the **bow at the front**. White frilly socks and pink shoes with straps complete the outfit.
- **Her movement:** she runs with a gentle bounce, her arms pump with **elbows bending forwards**, and she reaches up with an open hand when the butterfly comes close.
- **Butterflies:** a detailed monarch (veins, white-spotted border, shadow) and a small blue one in the distance.
- **The background, back to front:** sky and sun with rays, puffy clouds, birds, three layers of mountains and hills, then leafy apple trees and a wooden fence.
- **The meadow:** swaying grass, six kinds of flowers (daisy, poppy, bluebell, buttercup, clover, dandelion), bees with flight trails, drifting dandelion seeds and pollen.

## How to use it

1. Copy `assets/girl-butterfly.html` to wherever the user wants it (outside this skill folder), and work on the copy.
2. Make the changes the user asks for (see the controls below).
3. **Always check your work visually** before handing it over (see "Checking"). Then send the file to the user.

## Main controls (in the file)

| What | Where |
|---|---|
| Ground speed, step rate, girl size, body lean, leg length, hip height | `const STEP_HZ, GROUND_V, GIRL_S, LEAN, LEG, HIP_H` |
| Where she stands on screen | `gxAt` (fixed x) and `GIRL_GY` (her strip of meadow) |
| Dress colours | the `lin(g,-38,-70,38,10,...)` gradient in the dress section of `drawGirl` |
| Hair colours | the back-hair, braid and front-hair gradients in `drawGirl` |
| Butterfly colours | the `MONARCH` / `BLUE` palettes |
| Butterfly flight path | `bfx` / `bfy` in `frame()` |
| Sky, mountains, trees, fence | `sky`, `ridge(...)` and `nearLayer` |

## Rules that keep her looking right

These problems were found and fixed. Don't bring them back:

- **Neck:** short and tapered, with a shadow under the chin. It's drawn in body space just before the head. Don't make it long or thin.
- **Arms:** they join **at the shoulder** (around `(2,-71)`), not the chest. They're short and fairly thick. **Elbows bend forwards** (positive elbow angle `a2`); knees bend backwards (negative).
- **Hair:** no stray hairs floating above the head, and the shine sits inside the hair (it must not look like a headband).
- **Bow:** on the **front** of the waist (`BX=17`), with tails hanging down.
- **Feet:** the shoe stays at a right angle to the shin, with the toe nudged forwards. It must never point backwards.
- **Ground pace:** the ground scrolls at a **constant** speed (`cam = GROUND_V*t/GIRL_PAR`). The legs are driven by joint math (`ankleTarget` + `legIK`), so the planted foot moves back at exactly the ground speed.
  - Never tie the ground to the foot movement: that makes the ground jerky.
  - Never let the feet slide.
  - If you change `GROUND_V`, `STEP_HZ`, `LEG`, `HIP_H` or `GIRL_S`, run the gait check below.

## Checking

The scripts need Playwright (`require('playwright')`). They take paths as arguments, so run them from this skill folder.

```bash
node scripts/check-gait.js <copy>.html
```

The result must show **0 px slip** and **0 over-stretched samples**. If the legs can't reach the ground, shorten the stride (raise `STEP_HZ` or lower `GROUND_V`), or raise `LEG` or `HIP_H`.

```bash
node scripts/inspect.js <copy>.html <outDir> 0,0.095,0.19,0.285,0.38,0.475
```

This saves close-ups of the girl across one full stride (time is frozen, so the frames are exact). Look at them for the problems listed in the rules above: neck, arms and elbows, hair, bow, feet, and legs hidden in the grass.

## Ideas the user may ask for next

- An ending where the butterfly lands on her finger.
- A puppy or a friend running with her.
- Music and sound effects.
- A sunset version.
- Recording to MP4: capture frames with Playwright and join them with ffmpeg if it's available.
