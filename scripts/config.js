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
    durationMs: 1000
  },

  upgradeSequence: {
    image: 'assets/level10-upgrade.png',
    sound: 'assets/upgrade-level.mp3',
    durationMs: 1700
  },

  // Primary gameplay tuning. Edit this file to rebalance difficulty or swap level sprites.
  levels: [
    {
      maxScore: 9,
      label: '1',
      name: 'Level 1',
      sprite: 'assets/level-1.png',
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
      sprite: 'assets/level-2.png',
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
      sprite: 'assets/level-3.png',
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
      sprite: 'assets/level-4.png',
      bgTop: '#2a1b41',
      bgBottom: '#d07e63',
      speed: 216,
      gap: 220,
      pipeWidth: 84,
      playerHeight: 108
    }
  ]
};
