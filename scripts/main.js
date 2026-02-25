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
    const SPRITE_POOL = buildSpritePool(CONFIG.sprites, LEVELS);
    const META_STORAGE_KEY = `${STORAGE_KEY}_meta_v1`;
    const COSMETICS = [
      { id: 'default', name: 'Default', cost: 0, pf1: '#78f4c5', pf2: '#5ba2ff', pf3: '#f0b15f', comboGlow: 'rgba(127,255,210,.26)', ring: 'rgba(255,255,255,.7)' },
      { id: 'neon', name: 'Neon Mint', cost: 35, pf1: '#8bffcc', pf2: '#2cf2ff', pf3: '#5c8cff', comboGlow: 'rgba(44,242,255,.28)', ring: 'rgba(137,255,225,.82)' },
      { id: 'ember', name: 'Ember Gold', cost: 75, pf1: '#ffd46f', pf2: '#ff8a5b', pf3: '#ff5d89', comboGlow: 'rgba(255,138,91,.28)', ring: 'rgba(255,210,120,.82)' },
      { id: 'violet', name: 'Violet Flux', cost: 120, pf1: '#b894ff', pf2: '#7a8dff', pf3: '#54d2ff', comboGlow: 'rgba(184,148,255,.28)', ring: 'rgba(201,180,255,.85)' }
    ];
    const ACHIEVEMENTS = [
      { id: 'first_win', label: 'First Win', hint: 'Clear 40 in classic mode' },
      { id: 'score_10', label: 'Score 10', hint: 'Reach 10 points' },
      { id: 'score_20', label: 'Score 20', hint: 'Reach 20 points' },
      { id: 'score_30', label: 'Score 30', hint: 'Reach 30 points' },
      { id: 'score_40', label: 'Score 40', hint: 'Reach 40 points' },
      { id: 'retry_3', label: 'Retry x3', hint: 'Retry 3 runs in a row' },
      { id: 'perfect_tier_upgrade', label: 'Perfect Tier', hint: 'Hit a tier upgrade on a clean pass' }
    ];

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
      modeToggleBtn: document.getElementById('modeToggleBtn'),
      cosmeticBtn: document.getElementById('cosmeticBtn'),
      gameMuteBtn: document.getElementById('gameMuteBtn'),
      gameHomeBtn: document.getElementById('gameHomeBtn'),
      homeHighScore: document.getElementById('homeHighScore'),
      homeCoins: document.getElementById('homeCoins'),
      homeBadgeCount: document.getElementById('homeBadgeCount'),
      achievementStrip: document.getElementById('achievementStrip'),
      homeBadgePopupStack: document.getElementById('homeBadgePopupStack'),
      homeFounderName: document.getElementById('homeFounderName'),
      homeFounderPhoto: document.getElementById('homeFounderPhoto'),
      goalValue: document.getElementById('goalValue'),
      brandSub: document.getElementById('brandSub'),
      hudMode: document.getElementById('hudMode'),
      hudScore: document.getElementById('hudScore'),
      hudLevel: document.getElementById('hudLevel'),
      hudGears: document.getElementById('hudGears'),
      hudCombo: document.getElementById('hudCombo'),
      comboChip: document.getElementById('comboChip'),
      reviveChip: document.getElementById('reviveChip'),
      hudRevive: document.getElementById('hudRevive'),
      hudBest: document.getElementById('hudBest'),
      progressFill: document.getElementById('progressFill'),
      progressBestMarker: document.getElementById('progressBestMarker'),
      progressBestLabel: document.getElementById('progressBestLabel'),
      microRewardToast: document.getElementById('microRewardToast'),
      tapPrompt: document.getElementById('tapPrompt'),
      canvas: document.getElementById('gameCanvas'),
      assetStatus: document.getElementById('assetStatus'),
      failMusic: document.getElementById('failMusic'),
      upgradeMusic: document.getElementById('upgradeMusic'),
      homeBgmCue: document.getElementById('homeBgmCue'),
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
      failMessage: document.getElementById('failMessage'),
      winScore: document.getElementById('winScore'),
      winLevel: document.getElementById('winLevel'),
      winBest: document.getElementById('winBest'),
      winSummary: document.getElementById('winSummary'),
      confettiLayer: document.getElementById('confettiLayer')
    };

    const ctx = el.canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) {
      ctx.imageSmoothingQuality = 'high';
    }

    const app = {
      bootStage: 'splash', // splash | home | game
      screen: 'home',
      muted: false,
      homeVideoForcedMuted: false,
      audioCtx: null,
      meta: loadMeta(),
      selectedMode: 'classic',
      assetsReady: false,
      images: {},
      raf: 0,
      triedAutoplay: false,
      splashTimer: null,
      splashExitTimer: null,
      splashExiting: false,
      retryStreak: 0,
      badgeToastQueue: [],
      badgeToastActive: false,
      microToastTimer: null,
      bgmCueFadeRaf: 0,
      bgmCueHoldTimer: null,
      upgradeTimer: null
    };

    const game = {
      mode: 'classic',
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
      runCoinsEarned: 0,
      rewardsCommitted: false,
      gearsCollectedRun: 0,
      comboStreak: 0,
      comboPulse: 0,
      comboGlow: 0,
      lastPassWasClean: false,
      reviveAvailable: true,
      reviveUsed: false,
      reviveShieldTime: 0,
      bgmCueMilestonesPlayed: [],
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

    function loadMeta() {
      let raw = null;
      try {
        raw = JSON.parse(localStorage.getItem(META_STORAGE_KEY) || '{}') || {};
      } catch {
        raw = {};
      }
      const validIds = new Set(COSMETICS.map((c) => c.id));
      const ownedCosmetics = Array.isArray(raw.ownedCosmetics)
        ? raw.ownedCosmetics.filter((id) => validIds.has(id))
        : ['default'];
      if (!ownedCosmetics.includes('default')) ownedCosmetics.unshift('default');
      const selectedCosmetic = (typeof raw.selectedCosmetic === 'string' && validIds.has(raw.selectedCosmetic))
        ? raw.selectedCosmetic
        : 'default';
      const preferredMode = raw.preferredMode === 'endless' ? 'endless' : 'classic';
      return {
        coins: Math.max(0, Math.floor(Number(raw.coins) || 0)),
        ownedCosmetics: [...new Set(ownedCosmetics)],
        selectedCosmetic: ownedCosmetics.includes(selectedCosmetic) ? selectedCosmetic : ownedCosmetics[0],
        achievements: (raw.achievements && typeof raw.achievements === 'object') ? raw.achievements : {},
        endlessUnlocked: !!raw.endlessUnlocked,
        preferredMode
      };
    }

    function saveMeta() {
      if (!app.meta) return;
      app.meta.preferredMode = app.selectedMode;
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(app.meta));
    }

    function currentMode(mode = null) {
      if (mode) return mode;
      if (app.screen === 'game') return game.mode || app.selectedMode || 'classic';
      return app.selectedMode || game.mode || 'classic';
    }

    function isEndlessMode(mode = null) {
      return currentMode(mode) === 'endless';
    }

    function isClassicMode(mode = null) {
      return currentMode(mode) === 'classic';
    }

    function buildSpritePool(spriteEntries, levels) {
      const raw = Array.isArray(spriteEntries) && spriteEntries.length
        ? spriteEntries
        : (levels || []).map((lvl, i) => ({ src: lvl?.sprite, name: lvl?.name || `Sprite ${i + 1}` }));

      return raw
        .map((entry, i) => {
          if (!entry) return null;
          if (typeof entry === 'string') {
            return {
              src: entry,
              name: `Sprite ${i + 1}`,
              scale: 1,
              yOffset: 0,
              hitboxScale: 1
            };
          }
          if (!entry.src) return null;
          return {
            src: entry.src,
            name: entry.name || `Sprite ${i + 1}`,
            scale: Number.isFinite(entry.scale) ? entry.scale : 1,
            yOffset: Number.isFinite(entry.yOffset) ? entry.yOffset : 0,
            hitboxScale: Number.isFinite(entry.hitboxScale) ? entry.hitboxScale : 1
          };
        })
        .filter(Boolean);
    }

    function getTierIndexForScore(score, mode = null) {
      const safeScore = Math.max(0, Math.floor(score));
      if (isEndlessMode(mode)) {
        return Math.floor(safeScore / MILESTONE_EVERY) % LEVELS.length;
      }
      for (let i = 0; i < LEVELS.length; i += 1) {
        if (safeScore <= LEVELS[i].maxScore) return i;
      }
      return LEVELS.length - 1;
    }

    function getLevelForScore(score, mode = null) {
      return LEVELS[getTierIndexForScore(score, mode)] || LEVELS[LEVELS.length - 1];
    }

    function getLevelIndex(score, mode = null) {
      return getTierIndexForScore(score, mode);
    }

    function getEndlessLoop(score = game.score) {
      const cycleSpan = MILESTONE_EVERY * LEVELS.length;
      return Math.floor(Math.max(0, score) / cycleSpan);
    }

    function getLevelTuning(score = game.score, mode = null) {
      const base = getLevelForScore(score, mode);
      if (!isEndlessMode(mode)) return base;
      const loop = getEndlessLoop(score);
      const loopScale = Math.pow(CONFIG.difficultyMultiplierPerTier || 1.1, loop);
      return {
        ...base,
        speed: Math.round(base.speed * loopScale),
        gap: Math.max(166, Math.round(base.gap - loop * 10)),
        pipeWidth: Math.min(106, Math.round(base.pipeWidth + loop * 2)),
        playerHeight: Math.max(90, Math.round(base.playerHeight - loop * 2)),
        endlessLoop: loop
      };
    }

    function getDisplayProgressValue(score = game.score, mode = null) {
      if (isClassicMode(mode)) return Math.min(score, SCORE_CAP);
      const n = Math.max(0, score);
      const remainder = n % SCORE_CAP;
      return remainder === 0 && n > 0 ? SCORE_CAP : remainder;
    }

    function getSpriteIndexForScore(score = game.score, mode = null) {
      if (!SPRITE_POOL.length) return 0;
      const safeScore = Math.max(0, Math.floor(score));
      if (isClassicMode(mode)) {
        const capped = Math.max(0, Math.min(safeScore, SCORE_CAP));
        const spriteScore = capped >= SCORE_CAP ? (SCORE_CAP - 1) : capped;
        return Math.floor(spriteScore / MILESTONE_EVERY) % SPRITE_POOL.length;
      }
      return Math.floor(safeScore / MILESTONE_EVERY) % SPRITE_POOL.length;
    }

    function getSpriteConfigForScore(score = game.score, mode = null) {
      if (!SPRITE_POOL.length) return null;
      return SPRITE_POOL[getSpriteIndexForScore(score, mode)] || SPRITE_POOL[0];
    }

    function getSelectedCosmetic() {
      const id = app.meta?.selectedCosmetic || 'default';
      return COSMETICS.find((c) => c.id === id) || COSMETICS[0];
    }

    function applyCosmeticTheme() {
      const cosmetic = getSelectedCosmetic();
      const root = document.documentElement;
      root.style.setProperty('--pf1', cosmetic.pf1);
      root.style.setProperty('--pf2', cosmetic.pf2);
      root.style.setProperty('--pf3', cosmetic.pf3);
    }

    function getUnlockedAchievementCount() {
      return ACHIEVEMENTS.reduce((count, item) => count + (app.meta.achievements[item.id] ? 1 : 0), 0);
    }

    function queueBadgeToast(title, body, icon = '★') {
      app.badgeToastQueue.push({ title, body, icon });
      flushBadgeToasts();
    }

    function flushBadgeToasts() {
      if (app.screen !== 'home') return;
      if (app.badgeToastActive || !el.homeBadgePopupStack || app.badgeToastQueue.length === 0) return;
      const item = app.badgeToastQueue.shift();
      app.badgeToastActive = true;

      const toast = document.createElement('div');
      toast.className = 'badgeToast';
      toast.innerHTML = `
        <div class="badgeToastIcon">${item.icon}</div>
        <div>
          <div class="badgeToastTitle">${item.title}</div>
          <div class="badgeToastBody">${item.body}</div>
        </div>
      `;
      el.homeBadgePopupStack.appendChild(toast);

      const exitAfter = 2000;
      setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => {
          toast.remove();
          app.badgeToastActive = false;
          flushBadgeToasts();
        }, 240);
      }, exitAfter);
    }

    function renderAchievementStrip() {
      if (!el.achievementStrip) return;
      el.achievementStrip.innerHTML = '';
      for (const ach of ACHIEVEMENTS) {
        const unlocked = !!app.meta.achievements[ach.id];
        const chip = document.createElement('div');
        chip.className = `achievementChip ${unlocked ? 'unlocked' : 'locked'}`;
        chip.title = unlocked ? `${ach.label} unlocked` : ach.hint;
        chip.innerHTML = `<span class="dot" aria-hidden="true"></span><span>${ach.label}</span>`;
        el.achievementStrip.appendChild(chip);
      }
      if (el.homeBadgeCount) {
        el.homeBadgeCount.textContent = `${getUnlockedAchievementCount()} / ${ACHIEVEMENTS.length}`;
      }
    }

    function unlockAchievement(id, reasonText = '') {
      if (!id || app.meta.achievements[id]) return false;
      const found = ACHIEVEMENTS.find((a) => a.id === id);
      if (!found) return false;
      app.meta.achievements[id] = true;
      saveMeta();
      renderAchievementStrip();
      queueBadgeToast('Achievement Unlocked', reasonText || found.label, '🏅');
      return true;
    }

    function unlockScoreAchievements(score) {
      if (score >= 10) unlockAchievement('score_10', 'Reached 10 points');
      if (score >= 20) unlockAchievement('score_20', 'Reached 20 points');
      if (score >= 30) unlockAchievement('score_30', 'Reached 30 points');
      if (score >= 40) unlockAchievement('score_40', 'Reached 40 points');
    }

    function updateModeButtonText() {
      if (!el.modeToggleBtn) return;
      if (!app.meta.endlessUnlocked) {
        el.modeToggleBtn.textContent = 'Mode: Classic (Unlock Endless)';
        return;
      }
      el.modeToggleBtn.textContent = `Mode: ${app.selectedMode === 'endless' ? 'Endless' : 'Classic'}`;
    }

    function updateCosmeticButtonText() {
      if (!el.cosmeticBtn) return;
      const current = getSelectedCosmetic();
      const idx = COSMETICS.findIndex((c) => c.id === current.id);
      const next = COSMETICS[(idx + 1) % COSMETICS.length];
      const nextOwned = app.meta.ownedCosmetics.includes(next.id);
      if (nextOwned) {
        el.cosmeticBtn.textContent = `Skin: ${current.name} → ${next.name}`;
      } else {
        el.cosmeticBtn.textContent = `Unlock ${next.name} (${next.cost}c)`;
      }
    }

    function updateHomeModeUi() {
      if (el.goalValue) el.goalValue.textContent = app.selectedMode === 'endless' ? '∞' : String(SCORE_CAP);
      if (el.brandSub) {
        el.brandSub.textContent = app.selectedMode === 'endless'
          ? `Endless mode • upgrades every ${MILESTONE_EVERY} • DL developers edition`
          : `${SCORE_CAP} points to win • sprite swap every ${MILESTONE_EVERY} • DL developers edition`;
      }
      if (el.playBtn) {
        if (!app.assetsReady) {
          el.playBtn.textContent = 'Loading Assets...';
        } else {
          el.playBtn.textContent = app.selectedMode === 'endless' ? 'Play Endless' : 'Play Classic';
        }
      }
      updateModeButtonText();
      updateCosmeticButtonText();
      if (el.homeCoins) el.homeCoins.textContent = String(app.meta.coins);
      renderAchievementStrip();
    }

    function updateProgressBestMarker() {
      if (!el.progressBestMarker || !el.progressBestLabel) return;
      if (!game.best || game.best <= 0) {
        el.progressBestMarker.classList.add('hidden');
        return;
      }
      let markerScore = game.best;
      if (isEndlessMode()) {
        const seg = game.best % SCORE_CAP;
        markerScore = seg === 0 ? SCORE_CAP : seg;
      } else {
        markerScore = Math.min(game.best, SCORE_CAP);
      }
      const pct = clamp((markerScore / SCORE_CAP) * 100, 0, 100);
      el.progressBestMarker.style.left = `${pct}%`;
      el.progressBestLabel.textContent = `Best ${game.best}`;
      el.progressBestMarker.classList.remove('hidden');
    }

    function setScreen(name) {
      app.screen = name;
      if (el.splashScreen) el.splashScreen.classList.toggle('active', name === 'splash');
      el.homeScreen.classList.toggle('active', name === 'home');
      el.gameScreen.classList.toggle('active', name === 'game');
      if (name === 'home') flushBadgeToasts();
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
      updateProgressBestMarker();
      updateHomeModeUi();
    }

    function updateHud() {
      const lvl = getLevelForScore(game.score);
      const progressValue = getDisplayProgressValue();
      const comboMult = 1 + Math.min(1.5, Math.floor(game.comboStreak / 3) * 0.25);
      el.hudScore.textContent = String(game.score);
      el.hudLevel.textContent = lvl.label;
      if (el.hudMode) el.hudMode.textContent = isEndlessMode() ? 'END' : 'CLS';
      if (el.hudGears) el.hudGears.textContent = String(game.gearsCollectedRun || 0);
      if (el.hudCombo) el.hudCombo.textContent = `x${comboMult.toFixed(2).replace(/\.00$/, '.0')}`;
      if (el.comboChip) {
        const showCombo = game.comboStreak >= 2;
        el.comboChip.classList.toggle('active', showCombo);
        el.comboChip.classList.toggle('hidden', !showCombo);
      }
      if (el.hudRevive) el.hudRevive.textContent = game.reviveAvailable ? '1' : '0';
      if (el.reviveChip) {
        const showRevive = game.score >= 15 || game.reviveUsed || !game.reviveAvailable || game.reviveShieldTime > 0;
        el.reviveChip.classList.toggle('hidden', !showRevive);
      }
      el.hudBest.textContent = String(game.best);
      el.progressFill.style.width = `${(progressValue / SCORE_CAP) * 100}%`;
      updateProgressBestMarker();
    }

    function applyStaticUiFromConfig() {
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
      applyCosmeticTheme();
      updateHomeModeUi();
      updateProgressBestMarker();
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
      if (el.homeBgmCue) {
        el.homeBgmCue.muted = app.muted;
      }
      if (app.muted) {
        el.failMusic.pause();
        el.failMusic.currentTime = 0;
        if (el.upgradeMusic) {
          el.upgradeMusic.pause();
          el.upgradeMusic.currentTime = 0;
        }
        stopHomeBgmCue(true);
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

    function stopHomeBgmCue(resetTime = false) {
      if (!el.homeBgmCue) return;
      if (app.bgmCueFadeRaf) {
        cancelAnimationFrame(app.bgmCueFadeRaf);
        app.bgmCueFadeRaf = 0;
      }
      if (app.bgmCueHoldTimer) {
        clearTimeout(app.bgmCueHoldTimer);
        app.bgmCueHoldTimer = null;
      }
      el.homeBgmCue.pause();
      if (resetTime) {
        try {
          el.homeBgmCue.currentTime = 0;
        } catch {}
      }
      el.homeBgmCue.volume = 0;
    }

    function fadeAudioElement(audioEl, from, to, durationMs, onDone) {
      if (!audioEl) {
        if (onDone) onDone();
        return;
      }
      if (app.bgmCueFadeRaf) cancelAnimationFrame(app.bgmCueFadeRaf);
      const start = performance.now();
      const dur = Math.max(1, durationMs);
      audioEl.volume = clamp(from, 0, 1);

      const step = (now) => {
        const t = clamp((now - start) / dur, 0, 1);
        const eased = t < 0.5 ? (2 * t * t) : (1 - Math.pow(-2 * t + 2, 2) / 2);
        audioEl.volume = clamp(lerp(from, to, eased), 0, 1);
        if (t < 1) {
          app.bgmCueFadeRaf = requestAnimationFrame(step);
          return;
        }
        app.bgmCueFadeRaf = 0;
        if (onDone) onDone();
      };

      app.bgmCueFadeRaf = requestAnimationFrame(step);
    }

    function playScoreBgmCue() {
      if (app.muted || !el.homeBgmCue) return;
      stopHomeBgmCue(true);
      el.homeBgmCue.loop = false;
      el.homeBgmCue.volume = 0;
      const p = el.homeBgmCue.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      fadeAudioElement(el.homeBgmCue, 0, 0.34, 900, () => {
        if (app.bgmCueHoldTimer) clearTimeout(app.bgmCueHoldTimer);
        app.bgmCueHoldTimer = setTimeout(() => {
          app.bgmCueHoldTimer = null;
          fadeAudioElement(el.homeBgmCue, el.homeBgmCue.volume || 0.34, 0, 1200, () => {
            stopHomeBgmCue(true);
          });
        }, 2100);
      });
    }

    function maybeTriggerScoreBgmCue() {
      const segmentScore = getDisplayProgressValue(game.score, game.mode);
      if (segmentScore !== 15 && segmentScore !== 25) return;
      const loop = isEndlessMode(game.mode) ? Math.floor((Math.max(0, game.score) - 1) / SCORE_CAP) : 0;
      const key = `${loop}:${segmentScore}`;
      if (game.bgmCueMilestonesPlayed.includes(key)) return;
      game.bgmCueMilestonesPlayed.push(key);
      playScoreBgmCue();
    }

    function queueMicroReward(text) {
      if (!el.microRewardToast || !text) return;
      el.microRewardToast.textContent = text;
      el.microRewardToast.classList.add('show');
      if (app.microToastTimer) clearTimeout(app.microToastTimer);
      app.microToastTimer = setTimeout(() => {
        el.microRewardToast.classList.remove('show');
      }, 1250);
    }

    function addRunCoins(amount, label = '') {
      const safeAmount = Math.max(0, Math.floor(amount || 0));
      if (!safeAmount) return;
      game.runCoinsEarned += safeAmount;
      if (label) {
        queueMicroReward(`${label} +${safeAmount}C`);
      }
    }

    function commitRunRewards(extraCoins = 0) {
      if (game.rewardsCommitted) return 0;
      game.rewardsCommitted = true;
      const payout = Math.max(0, Math.floor(game.runCoinsEarned + extraCoins));
      if (payout > 0) {
        app.meta.coins += payout;
        saveMeta();
        updateHomeModeUi();
      }
      return payout;
    }

    function resetRetryStreak() {
      app.retryStreak = 0;
    }

    function recordRetryAndRestart() {
      app.retryStreak += 1;
      if (app.retryStreak >= 3) {
        unlockAchievement('retry_3', 'Retried 3 runs in a row');
      }
      restartGame();
    }

    function toggleModePreference() {
      if (!app.meta.endlessUnlocked) {
        queueBadgeToast('Mode Locked', 'Reach 40 in Classic to unlock Endless', '!');
        return;
      }
      app.selectedMode = app.selectedMode === 'endless' ? 'classic' : 'endless';
      saveMeta();
      updateHomeModeUi();
      updateProgressBestMarker();
      queueBadgeToast('Mode Selected', app.selectedMode === 'endless' ? 'Endless is active' : 'Classic is active', app.selectedMode === 'endless' ? '∞' : 'C');
    }

    function handleCosmeticButton() {
      const current = getSelectedCosmetic();
      const idx = COSMETICS.findIndex((c) => c.id === current.id);
      const next = COSMETICS[(idx + 1) % COSMETICS.length];
      if (!next) return;

      if (app.meta.ownedCosmetics.includes(next.id)) {
        app.meta.selectedCosmetic = next.id;
        saveMeta();
        applyCosmeticTheme();
        updateHomeModeUi();
        queueBadgeToast('Skin Selected', next.name, '+');
        return;
      }

      if (app.meta.coins < next.cost) {
        queueBadgeToast('Not Enough Coins', `Need ${next.cost - app.meta.coins} more for ${next.name}`, 'C');
        return;
      }

      app.meta.coins -= next.cost;
      app.meta.ownedCosmetics.push(next.id);
      app.meta.selectedCosmetic = next.id;
      saveMeta();
      applyCosmeticTheme();
      updateHomeModeUi();
      queueBadgeToast('Cosmetic Unlocked', `${next.name} equipped`, '+');
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
        ...SPRITE_POOL.map((sprite) => sprite.src),
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

    function resetRun(mode = app.selectedMode) {
      const resolvedMode = (mode === 'endless' && app.meta.endlessUnlocked) ? 'endless' : 'classic';
      game.mode = resolvedMode;
      const startTuning = getLevelTuning(0, resolvedMode);
      game.phase = 'playing';
      game.score = 0;
      game.worldTime = 0;
      game.spawnTimer = 0.7;
      game.scrollX = 0;
      game.currentSpeed = startTuning.speed;
      game.pipes = [];
      game.hitFlash = 0;
      game.shake = 0;
      game.floorPulse = 0;
      game.runCoinsEarned = 0;
      game.rewardsCommitted = false;
      game.gearsCollectedRun = 0;
      game.comboStreak = 0;
      game.comboPulse = 0;
      game.comboGlow = 0;
      game.lastPassWasClean = false;
      game.reviveAvailable = true;
      game.reviveUsed = false;
      game.reviveShieldTime = 0;
      game.bgmCueMilestonesPlayed = [];
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
      stopHomeBgmCue(true);
      if (el.upgradeMusic) {
        el.upgradeMusic.pause();
        el.upgradeMusic.currentTime = 0;
      }
      if (el.microRewardToast) {
        el.microRewardToast.classList.remove('show');
        el.microRewardToast.textContent = '';
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
      stopHomeBgmCue(true);
      if (el.upgradeMusic) {
        el.upgradeMusic.pause();
        el.upgradeMusic.currentTime = 0;
      }
      hideAllOverlays();
      setTapPrompt(true);
      resetRetryStreak();
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
      stopHomeBgmCue(true);
      resetRetryStreak();
      resetRun(app.selectedMode);
      updateHud();
    }

    function restartGame() {
      app.bootStage = 'game';
      tryLockPortrait();
      resumeAudioContext();
      setScreen('game');
      pauseHomeVideo();
      stopHomeBgmCue(true);
      resetRun(game.mode || app.selectedMode);
    }

    function currentLevelConfig() {
      return getLevelForScore(game.score, game.mode);
    }

    function levelIndexForScore(score) {
      return getLevelIndex(score, game.mode);
    }

    function getMilestoneForScore(score) {
      if (score <= 0) return null;
      if (score % MILESTONE_EVERY !== 0) return null;
      if (isClassicMode(game.mode) && score >= SCORE_CAP) return null;
      return score;
    }

    function makePipeGear(gap) {
      const r = clamp(gap * 0.065, 12, 16);
      const maxDy = Math.max(0, gap * 0.27 - r);
      return {
        r,
        dx: rand(-10, 10),
        dy: rand(-maxDy, maxDy),
        phase: rand(0, Math.PI * 2),
        spin: rand(-2.4, 2.4) || 1.8,
        collected: false,
        bonusScored: false
      };
    }

    function spawnPipe() {
      const tuning = getLevelTuning(game.score, game.mode);
      const gap = tuning.gap;
      const topMargin = 74;
      const bottomMargin = 126;
      const minGapCenter = topMargin + gap / 2;
      const maxGapCenter = GROUND_Y - bottomMargin - gap / 2;
      const gapY = rand(minGapCenter, maxGapCenter);
      game.pipes.push({
        x: W + 36,
        w: tuning.pipeWidth,
        gap,
        gapY,
        scored: false,
        gear: makePipeGear(gap)
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
      if (game.reviveShieldTime > 0) return false;
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

    function getPipePassInfo(pipe) {
      const topEdge = pipe.gapY - pipe.gap / 2;
      const bottomEdge = pipe.gapY + pipe.gap / 2;
      const clearanceTop = (game.player.y - game.player.radius) - topEdge;
      const clearanceBottom = bottomEdge - (game.player.y + game.player.radius);
      const minClearance = Math.min(clearanceTop, clearanceBottom);
      const cleanMargin = 16;
      return {
        clean: minClearance >= cleanMargin,
        clearance: minClearance
      };
    }

    function getPipeGearWorldPos(pipe) {
      if (!pipe || !pipe.gear) return null;
      return {
        x: pipe.x + pipe.w * 0.5 + (pipe.gear.dx || 0),
        y: pipe.gapY + (pipe.gear.dy || 0) + Math.sin(game.worldTime * 5 + (pipe.gear.phase || 0)) * 2.4
      };
    }

    function tryCollectPipeGear(pipe) {
      if (!pipe || !pipe.gear || pipe.gear.collected || pipe.scored) return false;
      const pos = getPipeGearWorldPos(pipe);
      if (!pos) return false;
      const dx = game.player.x - pos.x;
      const dy = game.player.y - pos.y;
      const hitR = game.player.radius + pipe.gear.r + 2;
      if ((dx * dx + dy * dy) > hitR * hitR) return false;

      pipe.gear.collected = true;
      game.gearsCollectedRun += 1;
      addRunCoins(1, 'Gear');
      game.hitFlash = Math.max(game.hitFlash, 0.15);
      game.floorPulse = Math.max(game.floorPulse, 0.65);
      game.comboGlow = Math.max(game.comboGlow, 0.35);
      updateHud();
      return true;
    }

    function getFailMotivationText() {
      const score = game.score;
      const nextMilestone = Math.ceil((score + 1) / MILESTONE_EVERY) * MILESTONE_EVERY;
      const toMilestone = nextMilestone > score ? nextMilestone - score : MILESTONE_EVERY;
      if (isClassicMode(game.mode)) {
        const toWin = Math.max(0, SCORE_CAP - score);
        if (toWin === 0) {
          return 'Tap anywhere to retry. You hit the classic cap already.';
        }
        if (toMilestone < toWin) {
          return `${toMilestone} more point${toMilestone === 1 ? '' : 's'} to level up. Tap anywhere to retry.`;
        }
        return `${toWin} more point${toWin === 1 ? '' : 's'} to win classic mode. Tap anywhere to retry.`;
      }
      const nextTier = nextMilestone;
      return `${toMilestone} more point${toMilestone === 1 ? '' : 's'} to the next tier (${nextTier}). Tap anywhere to retry.`;
    }

    function tryConsumeRevive(cause) {
      if (!game.reviveAvailable || game.reviveUsed) return false;
      if (game.score < 15) return false;

      game.reviveAvailable = false;
      game.reviveUsed = true;
      game.reviveShieldTime = 1.05;
      game.phase = 'playing';
      game.hitFlash = Math.max(game.hitFlash, 0.55);
      game.shake = Math.max(game.shake, 5);
      game.floorPulse = 1;

      let reviveY = clamp(H * 0.48, game.player.radius + 4, GROUND_Y - game.player.radius - 8);
      if (cause === 'obstacle' && game.pipes.length) {
        let nearest = null;
        let minDx = Infinity;
        for (const p of game.pipes) {
          const dx = Math.abs((p.x + p.w * 0.5) - game.player.x);
          if (dx < minDx) {
            minDx = dx;
            nearest = p;
          }
        }
        if (nearest) {
          reviveY = clamp(nearest.gapY, game.player.radius + 6, GROUND_Y - game.player.radius - 12);
        }
      }

      game.player.y = reviveY;
      game.player.vy = -210;
      game.player.angle = -0.3;
      game.player.flapPulse = 1;
      game.player.tapOsc = 1;

      game.pipes = game.pipes.filter((p) => (p.x + p.w < game.player.x - 28) || (p.x > game.player.x + 56));
      for (const p of game.pipes) {
        if (p.x < game.player.x + 90 && p.x + p.w > game.player.x - 20) {
          p.x += 140;
        }
      }

      queueMicroReward('Revive Activated');
      updateHud();
      return true;
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
      const nextSprite = getSpriteConfigForScore(milestone, game.mode);
      el.upgradeTitle.textContent = `Level ${milestone} Upgrade`;
      el.upgradeSub.textContent = `Power-up animation playing. Next sprite: ${(nextSprite && nextSprite.name) || nextLevel.name}.`;
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

    function triggerLevelUpgrade(milestone, passInfo = null) {
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
      addRunCoins(5, 'Tier Up');
      if (passInfo && passInfo.clean) {
        unlockAchievement('perfect_tier_upgrade', 'Clean pass on a tier upgrade');
      }
    }

    function showGameOver() {
      game.phase = 'gameover';
      game.inlineUpgradeSpriteActive = false;
      game.inlineUpgradeAwaitingTapSwap = false;
      game.hitFlash = 0.95;
      game.shake = 7;
      stopHomeBgmCue(true);
      saveBestIfNeeded();
      const payout = commitRunRewards();
      const lvl = getLevelForScore(game.score);
      el.failScore.textContent = String(game.score);
      el.failLevel.textContent = lvl.label;
      el.failBest.textContent = String(game.best);
      if (el.failMessage) {
        const baseMsg = getFailMotivationText();
        el.failMessage.textContent = payout > 0 ? `${baseMsg} Run coins earned: ${payout}.` : baseMsg;
      }
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
      resetRetryStreak();
      game.inlineUpgradeSpriteActive = false;
      game.inlineUpgradeAwaitingTapSwap = false;
      game.hitFlash = 0.25;
      saveBestIfNeeded();
      stopFailMusic();
      stopHomeBgmCue(true);
      if (el.upgradeMusic) {
        el.upgradeMusic.pause();
        el.upgradeMusic.currentTime = 0;
      }
      unlockAchievement('first_win', 'Cleared classic mode');
      unlockScoreAchievements(game.score);
      let endlessJustUnlocked = false;
      if (isClassicMode(game.mode) && !app.meta.endlessUnlocked) {
        app.meta.endlessUnlocked = true;
        app.selectedMode = 'endless';
        endlessJustUnlocked = true;
        saveMeta();
        updateHomeModeUi();
        queueBadgeToast('Endless Unlocked', 'Endless is now your main mode', '∞');
      }
      const payout = commitRunRewards(12);
      if (payout > 0) {
        queueBadgeToast('Coins Earned', `+${payout} coins from this run`, 'C');
      }
      spawnConfetti();
      const lvl = getLevelForScore(Math.min(game.score, SCORE_CAP));
      el.winScore.textContent = String(Math.min(game.score, SCORE_CAP));
      el.winLevel.textContent = lvl.label;
      el.winBest.textContent = String(game.best);
      el.winSummary.textContent = endlessJustUnlocked
        ? `You cleared ${SCORE_CAP}. Endless mode unlocked and set as main mode. Winner banner, confetti, and gears are active.`
        : `You cleared all ${SCORE_CAP} points. Winner banner, confetti, and mechanical gear overlays are active.`;
      el.winOverlay.classList.add('show');
      el.winOverlay.setAttribute('aria-hidden', 'false');
    }

    function onCrash(cause = 'obstacle') {
      if (game.phase !== 'playing') return;
      if (tryConsumeRevive(cause)) return;
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

    function applyScoreGain(passInfo = null) {
      if (game.phase !== 'playing') return;
      game.score += 1;
      game.runCoinsEarned += 1;
      playScoreTick();
      unlockScoreAchievements(game.score);
      maybeTriggerScoreBgmCue();
      updateHud();
      const milestone = getMilestoneForScore(game.score);
      if (milestone) {
        triggerLevelUpgrade(milestone, passInfo);
      }
      if (isClassicMode(game.mode) && game.score >= SCORE_CAP) {
        game.score = SCORE_CAP;
        updateHud();
        showWin();
      }
    }

    function onPointScored(passInfo = null) {
      if (game.phase !== 'playing') return;

      const wasComboHot = game.comboStreak >= 3;
      const cleanPass = !!(passInfo && passInfo.clean);
      let comboBonusScoreReady = false;
      if (cleanPass) {
        game.comboStreak += 1;
        game.comboPulse = 1;
        game.comboGlow = 1;
        game.lastPassWasClean = true;
        if (game.comboStreak >= 3) {
          game.runCoinsEarned += 1;
          const comboMult = 1 + Math.min(1.5, Math.floor(game.comboStreak / 3) * 0.25);
          if (game.comboStreak === 3 || game.comboStreak === 6 || game.comboStreak % 10 === 0) {
            queueMicroReward(`Combo x${comboMult.toFixed(2).replace(/\.00$/, '.0')}`);
          }
          if (game.comboStreak % 4 === 0) {
            comboBonusScoreReady = true;
          }
        }
      } else {
        if (wasComboHot) {
          queueMicroReward('Combo Broken');
        }
        game.comboStreak = 0;
        game.lastPassWasClean = false;
      }

      applyScoreGain(passInfo);
      if (comboBonusScoreReady && game.phase === 'playing') {
        queueMicroReward('Combo Bonus +1');
        applyScoreGain(passInfo);
      }
    }

    function update(dt) {
      const level = currentLevelConfig();
      const tuning = getLevelTuning(game.score, game.mode);
      game.worldTime += dt;
      game.scrollX += game.currentSpeed * dt;
      game.currentSpeed = lerp(game.currentSpeed, tuning.speed, clamp(dt * 2.2, 0, 1));
      game.hitFlash = Math.max(0, game.hitFlash - dt * 2.4);
      game.shake = Math.max(0, game.shake - dt * 12);
      game.floorPulse = Math.max(0, game.floorPulse - dt * 5.5);
      game.comboPulse = Math.max(0, game.comboPulse - dt * 3.2);
      game.comboGlow = Math.max(0, game.comboGlow - dt * 2.1);
      game.reviveShieldTime = Math.max(0, game.reviveShieldTime - dt);

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
        if (game.phase === 'playing') {
          tryCollectPipeGear(pipe);
        }

        if (!pipe.scored && pipe.x + pipe.w < game.player.x - game.player.radius) {
          pipe.scored = true;
          const passInfo = getPipePassInfo(pipe);
          onPointScored(passInfo);
          if (pipe.gear && pipe.gear.collected && !pipe.gear.bonusScored && game.phase === 'playing') {
            pipe.gear.bonusScored = true;
            queueMicroReward('Gear Bonus +1');
            applyScoreGain(passInfo);
          }
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
    }

    function drawGearToken(x, y, r, spin = 0, collected = false) {
      if (collected) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(spin);

      // Outer teeth
      const teeth = 10;
      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i += 1) {
        const ang = (i / (teeth * 2)) * Math.PI * 2;
        const rr = i % 2 === 0 ? r : r * 0.78;
        const px = Math.cos(ang) * rr;
        const py = Math.sin(ang) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 216, 120, .95)';
      ctx.shadowColor = 'rgba(255, 201, 84, .35)';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,.42)';
      ctx.stroke();

      // Inner ring
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(131, 85, 24, .88)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(242, 236, 212, .92)';
      ctx.fill();

      // Subtle pulse halo
      ctx.beginPath();
      ctx.arc(0, 0, r + 4 + Math.sin(game.worldTime * 8) * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 218, 118, .18)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    function drawPipeGears() {
      for (const pipe of game.pipes) {
        if (!pipe.gear || pipe.gear.collected) continue;
        const pos = getPipeGearWorldPos(pipe);
        if (!pos) continue;
        if (pos.x < -40 || pos.x > W + 40) continue;
        drawGearToken(
          pos.x,
          pos.y,
          pipe.gear.r,
          game.worldTime * (pipe.gear.spin || 1.8) + (pipe.gear.phase || 0),
          pipe.gear.collected
        );
      }
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

      const markerY = top + height - (getDisplayProgressValue(game.score, game.mode) / SCORE_CAP) * height;
      ctx.fillStyle = '#7fffd2';
      ctx.beginPath();
      ctx.arc(x, markerY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawPlayer() {
      const tuning = getLevelTuning(game.score, game.mode);
      const cosmetic = getSelectedCosmetic();
      const spriteCfg = getSpriteConfigForScore(game.score, game.mode) || { src: null, scale: 1, yOffset: 0, hitboxScale: 1 };
      const visualSprite = (game.inlineUpgradeSpriteActive && UPGRADE_SEQUENCE.image) ? UPGRADE_SEQUENCE.image : spriteCfg.src;
      const img = app.images[visualSprite];
      const p = game.player;
      const idleBob = Math.sin(game.worldTime * 7.2 + p.idlePhase) * (game.phase === 'playing' ? 2.8 : 5.0);
      const tapWave = Math.sin(game.worldTime * 16) * p.tapOsc * 6;
      const hover = idleBob + tapWave;
      const spriteScale = game.inlineUpgradeSpriteActive ? 1 : (spriteCfg.scale || 1);
      const spriteYOffset = game.inlineUpgradeSpriteActive ? 0 : (spriteCfg.yOffset || 0);
      const hitboxScale = game.inlineUpgradeSpriteActive ? 1 : (spriteCfg.hitboxScale || 1);
      const drawH = ((tuning.playerHeight * spriteScale) + (game.inlineUpgradeSpriteActive ? 8 : 0)) + p.flapPulse * 5;
      const aspect = img ? (img.naturalWidth / img.naturalHeight) : 0.6;
      const drawW = drawH * aspect;
      p.radius = clamp((Math.min(drawW, drawH) * 0.17 + 8) * hitboxScale, 16, 29);

      const scaleX = 1 + Math.sin(game.worldTime * 18) * p.flapPulse * 0.025;
      const scaleY = 1 - Math.sin(game.worldTime * 18) * p.flapPulse * 0.03;
      const blastScale = game.collisionBlastQueued ? Math.max(0.2, 1 - game.hitFlash * 0.75) : 1;
      const blastAlpha = game.collisionBlastQueued ? Math.max(0, 1 - game.hitFlash * 0.95) : 1;

      ctx.save();
      ctx.translate(p.x, p.y + hover + spriteYOffset);
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
        const comboBoost = Math.min(1, game.comboGlow);
        ctx.globalAlpha = 0.16 + p.flapPulse * 0.12 + comboBoost * 0.18;
        ctx.strokeStyle = cosmetic.ring || 'rgba(255,255,255,.7)';
        ctx.shadowBlur = comboBoost > 0 ? 18 : 0;
        ctx.shadowColor = cosmetic.comboGlow || 'rgba(127,255,210,.22)';
        ctx.lineWidth = 2 + comboBoost * 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius + 10 + p.flapPulse * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (game.reviveShieldTime > 0) {
          ctx.save();
          ctx.globalAlpha = 0.22 + Math.sin(game.worldTime * 18) * 0.08;
          ctx.strokeStyle = 'rgba(147, 243, 255, .9)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius + 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
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
      ctx.fillText(isEndlessMode() ? `${level.name} • E` : level.name, x + 12, y + 19);
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.font = '600 11px system-ui, sans-serif';
      if (isEndlessMode()) {
        const segStart = Math.floor(game.score / MILESTONE_EVERY) * MILESTONE_EVERY;
        const segEnd = segStart + (MILESTONE_EVERY - 1);
        ctx.fillText(`Tier ${segStart}-${segEnd}`, x + 12, y + 34);
      } else {
        const minRange = level.maxScore === LEVELS[0].maxScore ? 0 : (LEVELS[LEVELS.indexOf(level) - 1].maxScore + 1);
        ctx.fillText(`Points ${minRange}-${level.maxScore}`, x + 12, y + 34);
      }
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
      drawPipes();
      drawPipeGears();
      drawGround(level);
      drawPlayer();
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
        recordRetryAndRestart();
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
      if (el.modeToggleBtn) {
        el.modeToggleBtn.addEventListener('click', () => {
          toggleModePreference();
        });
      }
      if (el.cosmeticBtn) {
        el.cosmeticBtn.addEventListener('click', () => {
          handleCosmeticButton();
        });
      }
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
      el.retryBtn.addEventListener('click', recordRetryAndRestart);
      el.failHomeBtn.addEventListener('click', goHome);
      el.winRetryBtn.addEventListener('click', () => {
        resetRetryStreak();
        restartGame();
      });
      el.winHomeBtn.addEventListener('click', goHome);

      el.canvas.addEventListener('pointerdown', (evt) => {
        evt.preventDefault();
        handleGameAction();
      });

      el.gameOverOverlay.addEventListener('pointerdown', (evt) => {
        if (game.phase !== 'gameover') return;
        if (evt.target.closest('button')) return;
        evt.preventDefault();
        recordRetryAndRestart();
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
          if (el.homeBgmCue) el.homeBgmCue.pause();
          if (app.screen === 'home') el.homeVideo.pause();
        } else if (app.screen === 'home') {
          playHomeVideo();
        }
      });
    }

    function showHomeAfterSplash() {
      if (app.bootStage !== 'splash' || app.splashExiting) return;
      if (app.splashTimer) {
        clearTimeout(app.splashTimer);
        app.splashTimer = null;
      }
      app.splashExiting = true;

      const prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const exitMs = prefersReducedMotion ? 90 : Math.max(0, Number(LAUNCH_SEQUENCE.exitDurationMs || 700));

      if (el.splashScreen && exitMs > 0) {
        el.splashScreen.classList.add('isExiting');
      }

      if (app.splashExitTimer) {
        clearTimeout(app.splashExitTimer);
      }

      app.splashExitTimer = setTimeout(() => {
        app.splashExitTimer = null;
        app.splashExiting = false;
        app.bootStage = 'home';
        if (el.splashScreen) el.splashScreen.classList.remove('isExiting');
        setScreen('home');
        updateBestUI();
        syncAudioButtons();
        playHomeVideo();
      }, exitMs);
    }

    function startSplashSequence() {
      app.bootStage = 'splash';
      app.splashExiting = false;
      if (app.splashExitTimer) {
        clearTimeout(app.splashExitTimer);
        app.splashExitTimer = null;
      }
      if (el.splashScreen) {
        el.splashScreen.classList.remove('isExiting');
      }
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
      }, LAUNCH_SEQUENCE.durationMs || 2300);
    }

    function init() {
      app.selectedMode = (app.meta.endlessUnlocked && app.meta.preferredMode === 'endless') ? 'endless' : 'classic';
      game.mode = app.selectedMode;
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
          updateHomeModeUi();
          if (el.assetStatus) el.assetStatus.textContent = `Assets ready. ${LEVELS.length} tiers + ${SPRITE_POOL.length} primary sprites active.`;
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
