  (() => {
    const CONFIG = window.FLAPPY_JESS_CONFIG;
    if (!CONFIG) {
      throw new Error('Missing scripts/config.js (window.FLAPPY_JESS_CONFIG)');
    }

    const W = CONFIG.canvasWidth;
    const H = CONFIG.canvasHeight;
    const GROUND_Y = H - CONFIG.groundOffset;
    const SCORE_CAP = CONFIG.scoreCap;
    const STORAGE_KEY = CONFIG.storageKey;
    const LEVELS = CONFIG.levels;
    const MILESTONE_EVERY = CONFIG.milestoneEvery || 10;
    const LAUNCH_SEQUENCE = CONFIG.launchSequence || {};
    const UPGRADE_SEQUENCE = CONFIG.upgradeSequence || {};

    const el = {
      splashScreen: document.getElementById('splashScreen'),
      splashTitle: document.getElementById('splashTitle'),
      splashSubtitle: document.getElementById('splashSubtitle'),
      splashLogo: document.getElementById('splashLogo'),
      splashLion: document.getElementById('splashLion'),
      splashFounderName: document.getElementById('splashFounderName'),
      splashFounderPhoto: document.getElementById('splashFounderPhoto'),
      skipSplashBtn: document.getElementById('skipSplashBtn'),
      homeScreen: document.getElementById('homeScreen'),
      gameScreen: document.getElementById('gameScreen'),
      homeVideo: document.getElementById('homeVideo'),
      playBtn: document.getElementById('playBtn'),
      homeMuteBtn: document.getElementById('homeMuteBtn'),
      gameMuteBtn: document.getElementById('gameMuteBtn'),
      gameHomeBtn: document.getElementById('gameHomeBtn'),
      homeHighScore: document.getElementById('homeHighScore'),
      homeFounderName: document.getElementById('homeFounderName'),
      homeFounderPhoto: document.getElementById('homeFounderPhoto'),
      goalValue: document.getElementById('goalValue'),
      brandSub: document.getElementById('brandSub'),
      hudScore: document.getElementById('hudScore'),
      hudLevel: document.getElementById('hudLevel'),
      hudBest: document.getElementById('hudBest'),
      progressFill: document.getElementById('progressFill'),
      tapPrompt: document.getElementById('tapPrompt'),
      canvas: document.getElementById('gameCanvas'),
      assetStatus: document.getElementById('assetStatus'),
      failMusic: document.getElementById('failMusic'),
      upgradeMusic: document.getElementById('upgradeMusic'),
      upgradeOverlay: document.getElementById('upgradeOverlay'),
      upgradeTitle: document.getElementById('upgradeTitle'),
      upgradeSub: document.getElementById('upgradeSub'),
      upgradeSpriteImg: document.getElementById('upgradeSpriteImg'),
      gameOverOverlay: document.getElementById('gameOverOverlay'),
      winOverlay: document.getElementById('winOverlay'),
      retryBtn: document.getElementById('retryBtn'),
      failHomeBtn: document.getElementById('failHomeBtn'),
      winRetryBtn: document.getElementById('winRetryBtn'),
      winHomeBtn: document.getElementById('winHomeBtn'),
      failScore: document.getElementById('failScore'),
      failLevel: document.getElementById('failLevel'),
      failBest: document.getElementById('failBest'),
      winScore: document.getElementById('winScore'),
      winLevel: document.getElementById('winLevel'),
      winBest: document.getElementById('winBest'),
      winSummary: document.getElementById('winSummary'),
      confettiLayer: document.getElementById('confettiLayer')
    };

    const ctx = el.canvas.getContext('2d');

    const app = {
      bootStage: 'splash', // splash | home | game
      screen: 'home',
      muted: false,
      homeVideoForcedMuted: false,
      audioCtx: null,
      assetsReady: false,
      images: {},
      raf: 0,
      triedAutoplay: false,
      splashTimer: null,
      upgradeTimer: null
    };

    const game = {
      phase: 'ready', // ready | playing | upgrading | gameover | win
      score: 0,
      best: Number(localStorage.getItem(STORAGE_KEY) || 0),
      worldTime: 0,
      lastTs: 0,
      spawnTimer: 0.9,
      scrollX: 0,
      currentSpeed: LEVELS[0].speed,
      pipes: [],
      stars: [],
      skyWaves: [],
      hitFlash: 0,
      shake: 0,
      floorPulse: 0,
      pendingLevelUpgrade: null,
      upgradeMilestonesPlayed: [],
      inlineUpgradeSpriteActive: false,
      inlineUpgradeAwaitingTapSwap: false,
      collisionBlastQueued: false,
      blastCenter: { x: 0, y: 0 },
      player: {
        x: 116,
        y: H * 0.48,
        vy: 0,
        angle: 0,
        flapPulse: 0,
        tapOsc: 0,
        idlePhase: 0,
        radius: 30
      }
    };

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function getLevelForScore(score) {
      for (const level of LEVELS) {
        if (score <= level.maxScore) return level;
      }
      return LEVELS[LEVELS.length - 1];
    }

    function getLevelIndex(score) {
      return LEVELS.indexOf(getLevelForScore(score));
    }

    function setScreen(name) {
      app.screen = name;
      if (el.splashScreen) el.splashScreen.classList.toggle('active', name === 'splash');
      el.homeScreen.classList.toggle('active', name === 'home');
      el.gameScreen.classList.toggle('active', name === 'game');
    }

    function hideAllOverlays() {
      if (el.upgradeOverlay) {
        el.upgradeOverlay.classList.remove('show', 'flashOverlay');
        el.upgradeOverlay.setAttribute('aria-hidden', 'true');
      }
      el.gameOverOverlay.classList.remove('show');
      el.winOverlay.classList.remove('show');
      el.gameOverOverlay.setAttribute('aria-hidden', 'true');
      el.winOverlay.setAttribute('aria-hidden', 'true');
    }

    function setTapPrompt(show) {
      el.tapPrompt.classList.toggle('show', !!show);
    }

    function updateBestUI() {
      el.homeHighScore.textContent = String(game.best);
      el.hudBest.textContent = String(game.best);
    }

    function updateHud() {
      const lvl = getLevelForScore(game.score);
      el.hudScore.textContent = String(game.score);
      el.hudLevel.textContent = lvl.label;
      el.hudBest.textContent = String(game.best);
      el.progressFill.style.width = `${(Math.min(game.score, SCORE_CAP) / SCORE_CAP) * 100}%`;
    }

    function applyStaticUiFromConfig() {
      if (el.goalValue) el.goalValue.textContent = String(SCORE_CAP);
      if (el.brandSub) {
        el.brandSub.textContent = `${SCORE_CAP} points to win • sprite swap every ${MILESTONE_EVERY} • DL developers edition`;
      }
      if (el.splashFounderName && LAUNCH_SEQUENCE.founderName) {
        el.splashFounderName.textContent = LAUNCH_SEQUENCE.founderName;
      }
      if (el.homeFounderName && LAUNCH_SEQUENCE.founderName) {
        el.homeFounderName.textContent = LAUNCH_SEQUENCE.founderName;
      }
      if (LAUNCH_SEQUENCE.founderPhoto) {
        if (el.splashFounderPhoto) el.splashFounderPhoto.src = LAUNCH_SEQUENCE.founderPhoto;
        if (el.homeFounderPhoto) el.homeFounderPhoto.src = LAUNCH_SEQUENCE.founderPhoto;
      }
    }

    function syncAudioButtons() {
      const homeVideoMuted = app.muted || app.homeVideoForcedMuted;
      el.homeMuteBtn.textContent = app.muted ? 'Sound: Off' : (app.homeVideoForcedMuted ? 'Sound: Tap' : 'Sound: On');
      el.gameMuteBtn.textContent = app.muted ? 'Sound Off' : 'Sound On';
      el.homeVideo.muted = homeVideoMuted;
      el.homeVideo.volume = 1;
      el.failMusic.muted = app.muted;
      el.failMusic.volume = 1;
      if (el.upgradeMusic) {
        el.upgradeMusic.muted = app.muted;
        el.upgradeMusic.volume = 1;
      }
      if (app.muted) {
        el.failMusic.pause();
        el.failMusic.currentTime = 0;
        if (el.upgradeMusic) {
          el.upgradeMusic.pause();
          el.upgradeMusic.currentTime = 0;
        }
      }
    }

    function toggleMute() {
      app.muted = !app.muted;
      if (!app.muted) {
        app.homeVideoForcedMuted = false;
      }
      syncAudioButtons();
      if (app.screen === 'home') {
        playHomeVideo(true);
      }
    }

    function ensureAudioContext() {
      if (app.audioCtx) return app.audioCtx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      app.audioCtx = new AC();
      return app.audioCtx;
    }

    function resumeAudioContext() {
      const ac = ensureAudioContext();
      if (!ac) return;
      if (ac.state === 'suspended') {
        ac.resume().catch(() => {});
      }
    }

    function tryLockPortrait() {
      const so = screen.orientation;
      if (!so || typeof so.lock !== 'function') return;
      so.lock('portrait').catch(() => {});
    }

    // "Classic" flap pop inspired by old arcade jump sounds (procedural, no external file needed).
    function playTapSfx() {
      if (app.muted) return;
      const ac = ensureAudioContext();
      if (!ac) return;
      if (ac.state === 'suspended') return;
      const now = ac.currentTime;

      const osc1 = ac.createOscillator();
      const osc2 = ac.createOscillator();
      const gain = ac.createGain();
      const hp = ac.createBiquadFilter();

      hp.type = 'highpass';
      hp.frequency.value = 120;
      osc1.type = 'square';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(420, now);
      osc1.frequency.exponentialRampToValueAtTime(690, now + 0.045);
      osc2.frequency.setValueAtTime(210, now);
      osc2.frequency.exponentialRampToValueAtTime(310, now + 0.06);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

      osc1.connect(hp);
      osc2.connect(hp);
      hp.connect(gain);
      gain.connect(ac.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.12);
      osc2.stop(now + 0.12);
    }

    function playScoreTick() {
      if (app.muted) return;
      const ac = ensureAudioContext();
      if (!ac || ac.state === 'suspended') return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    }

    function playLaunchSparkle() {
      if (app.muted) return;
      const ac = ensureAudioContext();
      if (!ac || ac.state === 'suspended') return;
      const now = ac.currentTime;
      [1046, 1318, 1567].forEach((f, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = i % 2 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        gain.gain.setValueAtTime(0.0001, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.06, now + i * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.14);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.16);
      });
    }

    function playUpgradeSound() {
      if (app.muted || !el.upgradeMusic) return;
      el.upgradeMusic.pause();
      el.upgradeMusic.currentTime = 0;
      const p = el.upgradeMusic.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }

    function playHomeVideo(userGesture = false) {
      if (app.screen !== 'home') return;
      if (userGesture && !app.muted) {
        app.homeVideoForcedMuted = false;
      }
      el.homeVideo.muted = app.muted || app.homeVideoForcedMuted;
      const p = el.homeVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Autoplay with sound may be blocked. Mute only the home video fallback.
          if (!app.muted) app.homeVideoForcedMuted = true;
          syncAudioButtons();
          el.homeVideo.play().catch(() => {});
        });
      }
    }

    function pauseHomeVideo() {
      el.homeVideo.pause();
    }

    function preloadImages() {
      const sources = [
        'assets/obstacle.png',
        'assets/level-1.png',
        'assets/level-2.png',
        'assets/level-3.png',
        'assets/level-4.png',
        LAUNCH_SEQUENCE.logo || 'assets/dl-logo.png',
        LAUNCH_SEQUENCE.lion || 'assets/team-lion.png',
        LAUNCH_SEQUENCE.founderPhoto || 'assets/founder.png',
        UPGRADE_SEQUENCE.image || 'assets/level10-upgrade.png'
      ];

      const jobs = [...new Set(sources.filter(Boolean))].map((src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ src, img });
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
      }));

      return Promise.all(jobs).then((items) => {
        for (const item of items) {
          app.images[item.src] = item.img;
        }
      });
    }

    function makeStars() {
      const stars = [];
      for (let i = 0; i < 28; i++) {
        stars.push({
          x: rand(0, W),
          y: rand(0, GROUND_Y - 40),
          r: rand(1.2, 2.8),
          speed: rand(8, 22),
          alpha: rand(0.12, 0.34),
          phase: rand(0, Math.PI * 2)
        });
      }
      return stars;
    }

    function makeSkyWaves() {
      return [
        { amp: 16, freq: 0.015, speed: 0.28, y: GROUND_Y - 136, alpha: 0.18 },
        { amp: 10, freq: 0.024, speed: 0.46, y: GROUND_Y - 102, alpha: 0.12 }
      ];
    }

    function resetRun() {
      game.phase = 'playing';
      game.score = 0;
      game.worldTime = 0;
      game.spawnTimer = 0.7;
      game.scrollX = 0;
      game.currentSpeed = LEVELS[0].speed;
      game.pipes = [];
      game.hitFlash = 0;
      game.shake = 0;
      game.floorPulse = 0;
      game.pendingLevelUpgrade = null;
      game.upgradeMilestonesPlayed = [];
      game.inlineUpgradeSpriteActive = false;
      game.inlineUpgradeAwaitingTapSwap = false;
      game.collisionBlastQueued = false;
      game.player.x = 116;
      game.player.y = H * 0.48;
      game.player.vy = -200;
      game.player.angle = -0.28;
      game.player.flapPulse = 1;
      game.player.tapOsc = 1;
      game.player.idlePhase = 0;
      game.player.radius = 30;
      game.stars = makeStars();
      game.skyWaves = makeSkyWaves();
      setTapPrompt(false);
      hideAllOverlays();
      stopFailMusic();
      if (el.upgradeMusic) {
        el.upgradeMusic.pause();
        el.upgradeMusic.currentTime = 0;
      }
      updateHud();
    }

    function goHome() {
      app.bootStage = 'home';
      if (app.splashTimer) {
        clearTimeout(app.splashTimer);
        app.splashTimer = null;
      }
      stopFailMusic();
      if (el.upgradeMusic) {
        el.upgradeMusic.pause();
        el.upgradeMusic.currentTime = 0;
      }
      hideAllOverlays();
      setTapPrompt(true);
      setScreen('home');
      updateBestUI();
      playHomeVideo();
    }

    function startGameFromHome() {
      if (!app.assetsReady) return;
      app.bootStage = 'game';
      tryLockPortrait();
      resumeAudioContext();
      setScreen('game');
      pauseHomeVideo();
      resetRun();
      updateHud();
    }

    function restartGame() {
      app.bootStage = 'game';
      tryLockPortrait();
      resumeAudioContext();
      setScreen('game');
      pauseHomeVideo();
      resetRun();
    }

    function currentLevelConfig() {
      return getLevelForScore(game.score);
    }

    function levelIndexForScore(score) {
      return LEVELS.indexOf(getLevelForScore(score));
    }

    function getMilestoneForScore(score) {
      if (score <= 0) return null;
      if (score % MILESTONE_EVERY !== 0) return null;
      if (score >= SCORE_CAP) return null;
      return score;
    }

    function spawnPipe() {
      const level = currentLevelConfig();
      const gap = level.gap;
      const topMargin = 74;
      const bottomMargin = 126;
      const minGapCenter = topMargin + gap / 2;
      const maxGapCenter = GROUND_Y - bottomMargin - gap / 2;
      const gapY = rand(minGapCenter, maxGapCenter);
      game.pipes.push({
        x: W + 36,
        w: level.pipeWidth,
        gap,
        gapY,
        scored: false
      });
    }

    function flap() {
      if (game.phase !== 'playing') return;
      if (game.inlineUpgradeAwaitingTapSwap) {
        game.inlineUpgradeAwaitingTapSwap = false;
        game.inlineUpgradeSpriteActive = false;
        game.pendingLevelUpgrade = null;
      }
      game.player.vy = -305;
      game.player.flapPulse = 1;
      game.player.tapOsc = 1;
      game.player.angle = -0.42;
      game.shake = Math.min(6, game.shake + 1.6);
      game.floorPulse = 1;
      playTapSfx();
    }

    function hitBoundary() {
      return game.player.y - game.player.radius < 0 || game.player.y + game.player.radius > GROUND_Y;
    }

    function circleRect(cx, cy, r, rect) {
      const nx = clamp(cx, rect.x, rect.x + rect.w);
      const ny = clamp(cy, rect.y, rect.y + rect.h);
      const dx = cx - nx;
      const dy = cy - ny;
      return dx * dx + dy * dy <= r * r;
    }

    function collisionWithPipes() {
      const r = game.player.radius;
      const cx = game.player.x;
      const cy = game.player.y;
      for (const p of game.pipes) {
        const topRect = { x: p.x + 10, y: -2, w: p.w - 20, h: p.gapY - p.gap / 2 + 2 };
        const bottomY = p.gapY + p.gap / 2;
        const bottomRect = { x: p.x + 10, y: bottomY, w: p.w - 20, h: GROUND_Y - bottomY + 2 };
        if (circleRect(cx, cy, r, topRect) || circleRect(cx, cy, r, bottomRect)) {
          return true;
        }
      }
      return false;
    }

    function saveBestIfNeeded() {
      if (game.score > game.best) {
        game.best = game.score;
        localStorage.setItem(STORAGE_KEY, String(game.best));
      }
      updateBestUI();
      updateHud();
    }

    function stopFailMusic() {
      el.failMusic.pause();
      el.failMusic.currentTime = 0;
    }

    function playFailMusic() {
      stopFailMusic();
      if (app.muted) return;
      const p = el.failMusic.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }

    function createPopcornBlast(x, y) {
      const host = el.gameScreen || document.body;
      if (!host) return;
      const frameRect = el.canvas.getBoundingClientRect();
      const px = frameRect.left + (x / W) * frameRect.width;
      const py = frameRect.top + (y / H) * frameRect.height;
      const colors = ['#fff6c2', '#ffd166', '#ff8f5c', '#ff5f7a', '#ffe8a3'];

      for (let i = 0; i < 34; i++) {
        const piece = document.createElement('span');
        piece.className = 'blastPiece';
        piece.style.left = `${px}px`;
        piece.style.top = `${py}px`;
        const angle = rand(0, Math.PI * 2);
        const dist = rand(26, 120);
        piece.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        piece.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        piece.style.setProperty('--dur', `${Math.round(rand(450, 900))}ms`);
        piece.style.background = `radial-gradient(circle, rgba(255,255,255,.95), ${colors[i % colors.length]} 42%, rgba(255,89,89,.18))`;
        host.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove(), { once: true });
      }
    }

    function showUpgradeOverlay(milestone) {
      if (!el.upgradeOverlay) return;
      const nextLevel = getLevelForScore(Math.min(milestone + 1, SCORE_CAP));
      el.upgradeTitle.textContent = `Level ${milestone} Upgrade`;
      el.upgradeSub.textContent = `Power-up animation playing. Next sprite: ${nextLevel.name}.`;
      if (el.upgradeSpriteImg && UPGRADE_SEQUENCE.image) {
        el.upgradeSpriteImg.src = UPGRADE_SEQUENCE.image;
      }
      el.upgradeOverlay.classList.add('show', 'flashOverlay');
      el.upgradeOverlay.setAttribute('aria-hidden', 'false');
    }

    function hideUpgradeOverlay() {
      if (!el.upgradeOverlay) return;
      el.upgradeOverlay.classList.remove('show', 'flashOverlay');
      el.upgradeOverlay.setAttribute('aria-hidden', 'true');
    }

    function triggerLevelUpgrade(milestone) {
      if (game.phase !== 'playing') return;
      if (game.upgradeMilestonesPlayed.includes(milestone)) return;
      game.pendingLevelUpgrade = milestone;
      game.upgradeMilestonesPlayed.push(milestone);
      game.inlineUpgradeSpriteActive = true;
      game.inlineUpgradeAwaitingTapSwap = true;
      game.hitFlash = Math.max(game.hitFlash, 0.35);
      game.floorPulse = 1;
      game.shake = Math.max(game.shake, 4);
      playUpgradeSound();
    }

    function showGameOver() {
      game.phase = 'gameover';
      game.inlineUpgradeSpriteActive = false;
      game.inlineUpgradeAwaitingTapSwap = false;
      game.hitFlash = 0.95;
      game.shake = 7;
      saveBestIfNeeded();
      const lvl = getLevelForScore(game.score);
      el.failScore.textContent = String(game.score);
      el.failLevel.textContent = lvl.label;
      el.failBest.textContent = String(game.best);
      el.gameOverOverlay.classList.add('show');
      el.gameOverOverlay.setAttribute('aria-hidden', 'false');
      playFailMusic();
    }

    function spawnConfetti() {
      el.confettiLayer.innerHTML = '';
      const colors = ['#7fffd2', '#ffc75f', '#6fb9ff', '#ff6f91', '#ffffff'];
      for (let i = 0; i < 90; i++) {
        const piece = document.createElement('span');
        piece.className = 'confettiPiece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.setProperty('--dx', `${rand(-110, 110).toFixed(1)}px`);
        piece.style.setProperty('--rot', `${rand(160, 980).toFixed(1)}deg`);
        piece.style.animationDuration = `${rand(2.0, 4.2).toFixed(2)}s`;
        piece.style.animationDelay = `${rand(0, 0.8).toFixed(2)}s`;
        piece.style.opacity = '0';
        el.confettiLayer.appendChild(piece);
      }
    }

    function showWin() {
      game.phase = 'win';
      game.inlineUpgradeSpriteActive = false;
      game.inlineUpgradeAwaitingTapSwap = false;
      game.hitFlash = 0.25;
      saveBestIfNeeded();
      stopFailMusic();
      if (el.upgradeMusic) {
        el.upgradeMusic.pause();
        el.upgradeMusic.currentTime = 0;
      }
      spawnConfetti();
      const lvl = getLevelForScore(Math.min(game.score, SCORE_CAP));
      el.winScore.textContent = String(Math.min(game.score, SCORE_CAP));
      el.winLevel.textContent = lvl.label;
      el.winBest.textContent = String(game.best);
      el.winSummary.textContent = `You cleared all ${SCORE_CAP} points. Winner banner, confetti, and mechanical gear overlays are active.`;
      el.winOverlay.classList.add('show');
      el.winOverlay.setAttribute('aria-hidden', 'false');
    }

    function onCrash(cause = 'obstacle') {
      if (game.phase !== 'playing') return;
      if (cause === 'obstacle') {
        game.phase = 'upgrading';
        game.hitFlash = 1;
        game.shake = 10;
        game.collisionBlastQueued = true;
        game.blastCenter = { x: game.player.x, y: game.player.y };
        createPopcornBlast(game.player.x, game.player.y);
        // Popcorn blast first, then show the regular fail/loser screen + fail music.
        setTimeout(() => {
          game.collisionBlastQueued = false;
          showGameOver();
        }, 520);
        return;
      }
      showGameOver();
    }

    function onPointScored() {
      if (game.phase !== 'playing') return;
      game.score += 1;
      playScoreTick();
      updateHud();
      const milestone = getMilestoneForScore(game.score);
      if (milestone) {
        triggerLevelUpgrade(milestone);
      }
      if (game.score >= SCORE_CAP) {
        game.score = SCORE_CAP;
        updateHud();
        showWin();
      }
    }

    function update(dt) {
      const level = currentLevelConfig();
      game.worldTime += dt;
      game.scrollX += game.currentSpeed * dt;
      game.currentSpeed = lerp(game.currentSpeed, level.speed, clamp(dt * 2.2, 0, 1));
      game.hitFlash = Math.max(0, game.hitFlash - dt * 2.4);
      game.shake = Math.max(0, game.shake - dt * 12);
      game.floorPulse = Math.max(0, game.floorPulse - dt * 5.5);

      for (const s of game.stars) {
        s.x -= s.speed * dt;
        if (s.x < -8) {
          s.x = W + rand(0, 30);
          s.y = rand(10, GROUND_Y - 24);
        }
      }

      if (game.phase !== 'playing') {
        if (game.phase === 'gameover') {
          game.player.vy += 980 * dt * 0.45;
          game.player.y = Math.min(GROUND_Y - game.player.radius, game.player.y + game.player.vy * dt);
          game.player.angle = lerp(game.player.angle, 1.05, dt * 6);
        } else if (game.phase === 'win') {
          game.player.idlePhase += dt * 4.3;
          game.player.angle = Math.sin(game.worldTime * 3.4) * 0.05;
        } else if (game.phase === 'upgrading') {
          game.player.idlePhase += dt * 5.0;
          game.player.angle = Math.sin(game.worldTime * 8.0) * 0.14;
        }
        game.player.flapPulse = Math.max(0, game.player.flapPulse - dt * 3.8);
        game.player.tapOsc = Math.max(0, game.player.tapOsc - dt * 4.2);
        return;
      }

      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        spawnPipe();
        game.spawnTimer = clamp(1.18 - getLevelIndex(game.score) * 0.07, 0.88, 1.26);
      }

      game.player.vy += 980 * dt;
      game.player.y += game.player.vy * dt;
      game.player.idlePhase += dt * 6.2;
      game.player.flapPulse = Math.max(0, game.player.flapPulse - dt * 3.4);
      game.player.tapOsc = Math.max(0, game.player.tapOsc - dt * 3.8);
      game.player.angle = lerp(game.player.angle, clamp(game.player.vy / 420, -0.6, 1.05), dt * 8.4);

      for (const pipe of game.pipes) {
        pipe.x -= game.currentSpeed * dt;

        if (!pipe.scored && pipe.x + pipe.w < game.player.x - game.player.radius) {
          pipe.scored = true;
          onPointScored();
          if (game.phase !== 'playing') break;
        }
      }

      game.pipes = game.pipes.filter((pipe) => pipe.x + pipe.w > -40);

      if (hitBoundary()) {
        if (game.player.y < game.player.radius) {
          game.player.y = game.player.radius;
          game.player.vy = Math.max(40, game.player.vy * 0.2);
        } else {
          game.player.y = GROUND_Y - game.player.radius;
          onCrash('ground');
          return;
        }
      }

      if (collisionWithPipes()) {
        onCrash('obstacle');
      }
    }

    function drawSky(level) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, level.bgTop);
      grad.addColorStop(1, level.bgBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, GROUND_Y);

      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(W - 66, 82, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      for (const wave of game.skyWaves) {
        ctx.save();
        ctx.globalAlpha = wave.alpha;
        ctx.fillStyle = '#102137';
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        for (let x = -20; x <= W + 20; x += 20) {
          const y = wave.y + Math.sin((x + game.scrollX * wave.speed) * wave.freq + wave.speed * 9) * wave.amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      for (const s of game.stars) {
        ctx.save();
        ctx.globalAlpha = s.alpha + Math.sin(game.worldTime * 2.2 + s.phase) * 0.05;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      const gridOffset = (game.scrollX * 0.35) % 24;
      for (let x = -24; x < W + 24; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x - gridOffset, 0);
        ctx.lineTo(x - gridOffset, GROUND_Y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawObstacle(x, y, w, h, flipY) {
      if (h <= 0) return;
      const img = app.images['assets/obstacle.png'];
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.28)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.translate(x + w / 2, y + h / 2);
      if (flipY) ctx.scale(1, -1);
      if (img) {
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = '#6ec058';
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#000';
      ctx.fillRect(x + w - 10, y, 10, h);
      ctx.restore();
    }

    function drawPipes() {
      for (const pipe of game.pipes) {
        const topH = pipe.gapY - pipe.gap / 2;
        const botY = pipe.gapY + pipe.gap / 2;
        const botH = GROUND_Y - botY;
        drawObstacle(pipe.x, 0, pipe.w, topH, true);
        drawObstacle(pipe.x, botY, pipe.w, botH, false);
      }
    }

    function drawGround(level) {
      const gy = GROUND_Y;
      const floorGrad = ctx.createLinearGradient(0, gy, 0, H);
      floorGrad.addColorStop(0, 'rgba(12,14,22,0.94)');
      floorGrad.addColorStop(1, 'rgba(5,6,10,0.98)');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, gy, W, H - gy);

      ctx.save();
      ctx.globalAlpha = 0.26 + game.floorPulse * 0.18;
      ctx.fillStyle = level.bgTop;
      ctx.fillRect(0, gy, W, 4);
      ctx.restore();

      const stripeW = 26;
      for (let x = -stripeW; x < W + stripeW; x += stripeW) {
        const offset = (game.scrollX * 0.95) % (stripeW * 2);
        ctx.fillStyle = ((Math.floor(x / stripeW) % 2) === 0)
          ? 'rgba(255,255,255,.05)'
          : 'rgba(255,255,255,.015)';
        ctx.fillRect(x - offset, gy + 10, stripeW, H - gy - 14);
      }

      ctx.save();
      ctx.globalAlpha = 0.11;
      ctx.strokeStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const r = 18 + i * 8 + Math.sin(game.worldTime * 3 + i) * 0.6;
        ctx.beginPath();
        ctx.arc(40 + i * 72, gy + 34, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawMilestones() {
      ctx.save();
      const x = W - 30;
      const top = 130;
      const height = GROUND_Y - 170;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + height);
      ctx.stroke();

      for (let i = 0; i <= SCORE_CAP; i += 5) {
        const y = top + height - (i / SCORE_CAP) * height;
        ctx.strokeStyle = i === SCORE_CAP ? 'rgba(127,255,210,0.8)' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = i === SCORE_CAP ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(x - 7, y);
        ctx.lineTo(x + 7, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '700 11px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(i), x - 12, y + 4);
      }

      const markerY = top + height - (Math.min(game.score, SCORE_CAP) / SCORE_CAP) * height;
      ctx.fillStyle = '#7fffd2';
      ctx.beginPath();
      ctx.arc(x, markerY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawPlayer() {
      const level = currentLevelConfig();
      const visualSprite = (game.inlineUpgradeSpriteActive && UPGRADE_SEQUENCE.image) ? UPGRADE_SEQUENCE.image : level.sprite;
      const img = app.images[visualSprite];
      const p = game.player;
      const idleBob = Math.sin(game.worldTime * 7.2 + p.idlePhase) * (game.phase === 'playing' ? 2.8 : 5.0);
      const tapWave = Math.sin(game.worldTime * 16) * p.tapOsc * 6;
      const hover = idleBob + tapWave;
      const drawH = (level.playerHeight + (game.inlineUpgradeSpriteActive ? 8 : 0)) + p.flapPulse * 5;
      const aspect = img ? (img.naturalWidth / img.naturalHeight) : 0.6;
      const drawW = drawH * aspect;
      p.radius = clamp(Math.min(drawW, drawH) * 0.17 + 8, 18, 29);

      const scaleX = 1 + Math.sin(game.worldTime * 18) * p.flapPulse * 0.025;
      const scaleY = 1 - Math.sin(game.worldTime * 18) * p.flapPulse * 0.03;
      const blastScale = game.collisionBlastQueued ? Math.max(0.2, 1 - game.hitFlash * 0.75) : 1;
      const blastAlpha = game.collisionBlastQueued ? Math.max(0, 1 - game.hitFlash * 0.95) : 1;

      ctx.save();
      ctx.translate(p.x, p.y + hover);
      ctx.rotate(p.angle);
      ctx.scale(scaleX * blastScale, scaleY * blastScale);
      ctx.globalAlpha = blastAlpha;

      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(0, drawH * 0.52, p.radius * 1.22, p.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (img) {
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(-20, -40, 40, 80);
      }

      if (game.phase === 'playing') {
        ctx.save();
        ctx.globalAlpha = 0.18 + p.flapPulse * 0.12;
        ctx.strokeStyle = 'rgba(255,255,255,.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 10 + p.flapPulse * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    function drawLevelBadge() {
      const level = currentLevelConfig();
      ctx.save();
      const x = 14;
      const y = 66;
      const w = 120;
      const h = 44;
      ctx.fillStyle = 'rgba(8, 11, 20, 0.52)';
      roundRect(ctx, x, y, w, h, 12, true, false);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      roundRect(ctx, x, y, w, h, 12, false, true);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 14px system-ui, sans-serif';
      ctx.fillText(level.name, x + 12, y + 19);
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.font = '600 11px system-ui, sans-serif';
      const minRange = level.maxScore === LEVELS[0].maxScore ? 0 : (LEVELS[LEVELS.indexOf(level) - 1].maxScore + 1);
      ctx.fillText(`Points ${minRange}-${level.maxScore}`, x + 12, y + 34);
      ctx.restore();
    }

    function drawHitFlash() {
      if (game.hitFlash <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(0.42, game.hitFlash * 0.35);
      ctx.fillStyle = game.phase === 'gameover' ? '#ff5f7a' : '#7fffd2';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function roundRect(context, x, y, w, h, r, fill, stroke) {
      const rr = Math.min(r, w / 2, h / 2);
      context.beginPath();
      context.moveTo(x + rr, y);
      context.arcTo(x + w, y, x + w, y + h, rr);
      context.arcTo(x + w, y + h, x, y + h, rr);
      context.arcTo(x, y + h, x, y, rr);
      context.arcTo(x, y, x + w, y, rr);
      context.closePath();
      if (fill) context.fill();
      if (stroke) context.stroke();
    }

    function render() {
      ctx.clearRect(0, 0, W, H);

      const shakeX = rand(-game.shake, game.shake) * 0.35;
      const shakeY = rand(-game.shake, game.shake) * 0.35;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      const level = currentLevelConfig();
      drawSky(level);
      drawMilestones();
      drawPipes();
      drawGround(level);
      drawPlayer();
      drawLevelBadge();
      drawHitFlash();

      ctx.restore();
    }

    function frame(ts) {
      if (!game.lastTs) game.lastTs = ts;
      const dt = Math.min(0.033, (ts - game.lastTs) / 1000);
      game.lastTs = ts;

      if (app.screen === 'game') {
        update(dt);
        render();
      }

      app.raf = requestAnimationFrame(frame);
    }

    function handleGameAction() {
      resumeAudioContext();
      if (app.screen !== 'game') return;
      if (game.phase === 'playing') {
        flap();
      } else if (game.phase === 'gameover') {
        restartGame();
      } else if (game.phase === 'win') {
        // Keep explicit buttons for win to avoid accidental restarts.
      } else if (game.phase === 'upgrading') {
        // Ignore taps during upgrade transition.
      }
    }

    function bindEvents() {
      if (el.skipSplashBtn) {
        el.skipSplashBtn.addEventListener('click', () => {
          resumeAudioContext();
          playLaunchSparkle();
          showHomeAfterSplash();
        });
      }
      el.playBtn.addEventListener('click', () => {
        startGameFromHome();
      });
      el.homeMuteBtn.addEventListener('click', () => {
        resumeAudioContext();
        toggleMute();
      });
      el.gameMuteBtn.addEventListener('click', () => {
        resumeAudioContext();
        toggleMute();
      });
      el.gameHomeBtn.addEventListener('click', () => {
        goHome();
      });
      el.retryBtn.addEventListener('click', restartGame);
      el.failHomeBtn.addEventListener('click', goHome);
      el.winRetryBtn.addEventListener('click', restartGame);
      el.winHomeBtn.addEventListener('click', goHome);

      el.canvas.addEventListener('pointerdown', (evt) => {
        evt.preventDefault();
        handleGameAction();
      });

      window.addEventListener('keydown', (evt) => {
        if (evt.code === 'Space' || evt.code === 'ArrowUp') {
          evt.preventDefault();
          if (app.screen === 'splash') {
            resumeAudioContext();
            playLaunchSparkle();
            showHomeAfterSplash();
            return;
          }
          if (app.screen === 'home') {
            if (app.assetsReady) startGameFromHome();
            return;
          }
          handleGameAction();
        }
        if (evt.code === 'KeyM') {
          evt.preventDefault();
          resumeAudioContext();
          toggleMute();
        }
        if (evt.code === 'Escape' && app.screen === 'game') {
          evt.preventDefault();
          goHome();
        }
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          el.failMusic.pause();
          if (el.upgradeMusic) el.upgradeMusic.pause();
          if (app.screen === 'home') el.homeVideo.pause();
        } else if (app.screen === 'home') {
          playHomeVideo();
        }
      });
    }

    function showHomeAfterSplash() {
      if (app.bootStage !== 'splash') return;
      app.bootStage = 'home';
      if (app.splashTimer) {
        clearTimeout(app.splashTimer);
        app.splashTimer = null;
      }
      setScreen('home');
      updateBestUI();
      syncAudioButtons();
      playHomeVideo();
    }

    function startSplashSequence() {
      app.bootStage = 'splash';
      setScreen('splash');
      if (el.splashTitle && LAUNCH_SEQUENCE.title) el.splashTitle.textContent = LAUNCH_SEQUENCE.title;
      if (el.splashSubtitle && LAUNCH_SEQUENCE.subtitle) el.splashSubtitle.textContent = LAUNCH_SEQUENCE.subtitle;
      if (el.splashLogo && LAUNCH_SEQUENCE.logo) el.splashLogo.src = LAUNCH_SEQUENCE.logo;
      if (el.splashLion && LAUNCH_SEQUENCE.lion) el.splashLion.src = LAUNCH_SEQUENCE.lion;
      if (el.splashFounderName && LAUNCH_SEQUENCE.founderName) el.splashFounderName.textContent = LAUNCH_SEQUENCE.founderName;
      if (el.splashFounderPhoto && LAUNCH_SEQUENCE.founderPhoto) el.splashFounderPhoto.src = LAUNCH_SEQUENCE.founderPhoto;

      // Will play only if browser permits audio before interaction.
      playLaunchSparkle();

      if (app.splashTimer) clearTimeout(app.splashTimer);
      app.splashTimer = setTimeout(() => {
        showHomeAfterSplash();
      }, LAUNCH_SEQUENCE.durationMs || 1000);
    }

    function init() {
      bindEvents();
      syncAudioButtons();
      applyStaticUiFromConfig();
      updateBestUI();
      updateHud();
      setTapPrompt(true);
      startSplashSequence();

      if (el.assetStatus) el.assetStatus.textContent = 'Loading player sprites and obstacle asset...';
      preloadImages()
        .then(() => {
          app.assetsReady = true;
          el.playBtn.disabled = false;
          el.playBtn.textContent = 'Play';
          if (el.assetStatus) el.assetStatus.textContent = 'Assets ready. 4 tiers active (0-10, 11-20, 21-30, 31-40).';
        })
        .catch((err) => {
          console.error(err);
          if (el.assetStatus) el.assetStatus.textContent = 'Asset loading failed. Check the assets/ folder paths.';
          el.playBtn.disabled = true;
          el.playBtn.textContent = 'Assets Missing';
        });

      if (!app.raf) {
        app.raf = requestAnimationFrame(frame);
      }

      // Home video starts after splash ends.
    }

    init();
  })();
