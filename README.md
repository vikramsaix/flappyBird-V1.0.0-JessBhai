# Flappy Jess (Vercel-ready static web game)

Static Flappy-style web game built for Vercel Hobby (no build step required).

## Features
- Full-screen home screen with vertical background video (`assets/home-video.mp4`)
- DL Developers intro screen + founder card
- High score + mode toggle + mute + play controls on the home screen
- 6-sprite primary gameplay pool (cycled every 10 points; Endless uses full rotation)
- Classic mode cap at `40` points with winner banner, confetti, and gear overlays
- Endless mode unlock after first Classic clear (becomes main mode)
- Failure overlay with your failure sprite + fail music
- Obstacle columns drawn from your uploaded obstacle asset only
- Gear collectibles inside pipe gaps (`+1` point bonus when collected and pipe is cleared)
- Achievements, coins/cosmetics, revive, combo streak, and best-marker progress tracking (local)
- Local high score saved in browser (`localStorage`)
- Mobile + desktop input (`tap/click/space`)

## Fork + Start (No Setup Needed)
This project is fully static. There is no backend, no build step, and no install command.

### Option 1: Easiest (just open the file)
1. Fork the repo on GitHub.
2. Clone your fork:
   - `git clone <your-fork-url>`
3. Open the project folder.
4. Open `index.html` in any browser.

### Option 2: Run with a local static server (optional)
This is only for convenience/testing. It is not required.

1. Fork + clone the repo.
2. Start any static server in the project root (examples):
   - VS Code Live Server
   - `python3 -m http.server 8000`
3. Open `http://localhost:8000`

## Local development notes
- `npm install` is not needed.
- `node` is not required to run the game.
- All assets are loaded directly from `/assets`.

## Project structure
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/index.html` - markup only (screens, HUD, overlays)
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/styles/main.css` - all styles (home screen, glass UI, overlays, animations)
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/scripts/config.js` - gameplay tuning + sprite pool config
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/scripts/main.js` - game loop, audio, rendering, collisions, UI logic
- `/Users/wanheda/flappyBird-V1.0.0-JessBhai/assets/` - video, sprites, music, obstacle art

## Quick modding guide
- Change level difficulty (`speed`, `gap`, `pipeWidth`, `playerHeight`) in `/Users/wanheda/flappyBird-V1.0.0-JessBhai/scripts/config.js`
- Change primary player sprite rotation in `/Users/wanheda/flappyBird-V1.0.0-JessBhai/scripts/config.js` (`sprites` array)
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
- `assets/sprite-1.webp` ... `assets/sprite-6.webp` (primary gameplay sprite pool)
- `assets/level10-upgrade.png` (level-up animation sprite)
- `assets/winner-display.png`
- `assets/fail-sprite.webp`
- `assets/fail-music.mp3`
- `assets/upgrade-level.mp3`
- `assets/dl-logo.png`
- `assets/team-lion.png`
- `assets/founder.png`

## Note on autoplay audio
Browsers may block autoplay with sound until the first user interaction. The page falls back to muted autoplay if needed, and the mute button can re-enable sound after interaction.
