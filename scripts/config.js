window.FLAPPY_JESS_CONFIG = {
  canvasWidth: 432,
  canvasHeight: 768,
  groundOffset: 88,
  scoreCap: 40,
  storageKey: 'flappy_jess_best_v2',
  milestoneEvery: 10,
  difficultyMultiplierPerTier: 1.1,

  launchSequence: {
    title: 'DL Developers',
    subtitle: 'Transmission Initializing',
    logo: 'assets/dl-logo.png',
    lion: 'assets/team-lion.png',
    founderName: 'Dr Gnandeep Kodavali',
    founderPhoto: 'assets/founder.png',
    durationMs: 3200,
    exitDurationMs: 760
  },

  upgradeSequence: {
    image: 'assets/level10-upgrade.png',
    sound: 'assets/upgrade-level.mp3',
    durationMs: 1700
  },

  // Primary player sprite pool (cycled every 10 points; Endless mode uses all sprites in rotation).
  // `scale`, `yOffset`, and `hitboxScale` keep very different cutouts feeling fair in gameplay.
  sprites: [
    { src: 'assets/sprite-1.webp', name: 'Head Close', scale: 0.84, yOffset: -8, hitboxScale: 0.82 },
    { src: 'assets/sprite-2.webp', name: 'Standing', scale: 1.00, yOffset: 4, hitboxScale: 0.92 },
    { src: 'assets/sprite-3.webp', name: 'Akatsuki Full', scale: 1.02, yOffset: 6, hitboxScale: 0.88 },
    { src: 'assets/sprite-4.webp', name: 'Akatsuki Side', scale: 0.96, yOffset: 0, hitboxScale: 0.88 },
    { src: 'assets/sprite-5.webp', name: 'Bottles Wide', scale: 0.90, yOffset: 8, hitboxScale: 0.86 },
    { src: 'assets/sprite-6.webp', name: 'Bottles Close', scale: 0.92, yOffset: 6, hitboxScale: 0.88 }
  ],

  // Primary gameplay tuning (difficulty tiers). Sprite visuals are controlled by `sprites` above.
  levels: [
    {
      maxScore: 9,
      label: '1',
      name: 'Level 1',
      bgTop: '#7dc5ff',
      bgBottom: '#f8f0b0',
      speed: 162,
      gap: 278,
      pipeWidth: 72,
      playerHeight: 122
    },
    {
      maxScore: 19,
      label: '2',
      name: 'Level 2',
      bgTop: '#7b7cff',
      bgBottom: '#ffaf83',
      speed: 178,
      gap: 258,
      pipeWidth: 76,
      playerHeight: 120
    },
    {
      maxScore: 29,
      label: '3',
      name: 'Level 3',
      bgTop: '#16335f',
      bgBottom: '#5e82ca',
      speed: 196,
      gap: 238,
      pipeWidth: 80,
      playerHeight: 112
    },
    {
      maxScore: 40,
      label: '4',
      name: 'Level 4',
      bgTop: '#2a1b41',
      bgBottom: '#d07e63',
      speed: 216,
      gap: 220,
      pipeWidth: 84,
      playerHeight: 108
    }
  ]
};
