# Flappy Jess (Vercel-ready static web game)

Static Flappy-style web game built for Vercel Hobby (no build step required).

## Features
- Full-screen home screen with vertical background video (`assets/home-video.mp4`)
- High score + mute + play controls on the home screen
- 4 sprite levels using your uploaded PNGs
- Level progression by score:
  - `0-5` -> Level 1
  - `6-10` -> Level 2
  - `11-15` -> Level 3
  - `16-20` -> Level 4
- Win condition at `20` points with winner banner, confetti, and gear overlays
- Failure overlay with your failure sprite + fail music
- Obstacle columns drawn from your uploaded obstacle asset only
- Local high score saved in browser (`localStorage`)
- Mobile + desktop input (`tap/click/space`)

## Run locally
Open `/Users/wanheda/flappyBird-V1.0.0-JessBhai/index.html` in a browser.

## Project structure
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/index.html` - markup only (screens, HUD, overlays)
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/styles/main.css` - all styles (home screen, glass UI, overlays, animations)
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/scripts/config.js` - gameplay tuning + level config (best place to mod difficulty and level sprites)
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/scripts/main.js` - game loop, audio, rendering, collisions, UI logic
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/assets/` - video, sprites, music, obstacle art

## Quick modding guide
- Change level difficulty (`speed`, `gap`, `pipeWidth`, `playerHeight`) in `/Users/wanheda/flappyBird-V1.0.0-JessBhai/scripts/config.js`
- Swap home video by replacing `/Users/wanheda/flappyBird-V1.0.0-JessBhai/assets/home-video.mp4`
- Swap obstacle art by replacing `/Users/wanheda/flappyBird-V1.0.0-JessBhai/assets/obstacle.png`
- Change UI look/glass opacity in `/Users/wanheda/flappyBird-V1.0.0-JessBhai/styles/main.css`
- Change gameplay behavior/audio logic in `/Users/wanheda/flappyBird-V1.0.0-JessBhai/scripts/main.js`

## Deploy to Vercel (Hobby)
1. Push this folder to a GitHub repo.
2. Import the repo in [Vercel](https://vercel.com/).
3. Keep default settings (static site, no build command needed).
4. Deploy.

Vercel will serve `index.html`, `styles/`, `scripts/`, and `assets/` as static files.

## Asset files used
- `assets/home-video.mp4` (home screen full-fill video)
- `assets/obstacle.png` (top/bottom obstacles)
- `assets/level-1.png`
- `assets/level-2.png`
- `assets/level-3.png`
- `assets/level-4.png`
- `assets/winner-display.png`
- `assets/fail-sprite.webp`
- `assets/fail-music.mp3`

## Note on autoplay audio
Browsers may block autoplay with sound until the first user interaction. The page falls back to muted autoplay if needed, and the mute button can re-enable sound after interaction.
