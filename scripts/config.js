window.FLAPPY_JESS_CONFIG = {
  canvasWidth: 432,
  canvasHeight: 768,
  groundOffset: 88,
  scoreCap: 20,
  storageKey: 'flappy_jess_best_v2',

  // Primary gameplay tuning. Edit this file to rebalance difficulty or swap level sprites.
  levels: [
    {
      maxScore: 5,
      label: '1',
      name: 'Level 1',
      sprite: 'assets/level-1.png',
      bgTop: '#7dc5ff',
      bgBottom: '#f8f0b0',
      speed: 148,
      gap: 294,
      pipeWidth: 70,
      playerHeight: 122
    },
    {
      maxScore: 10,
      label: '2',
      name: 'Level 2',
      sprite: 'assets/level-2.png',
      bgTop: '#7b7cff',
      bgBottom: '#ffaf83',
      speed: 164,
      gap: 280,
      pipeWidth: 72,
      playerHeight: 120
    },
    {
      maxScore: 15,
      label: '3',
      name: 'Level 3',
      sprite: 'assets/level-3.png',
      bgTop: '#16335f',
      bgBottom: '#5e82ca',
      speed: 178,
      gap: 264,
      pipeWidth: 74,
      playerHeight: 112
    },
    {
      maxScore: 20,
      label: '4',
      name: 'Level 4',
      sprite: 'assets/level-4.png',
      bgTop: '#2a1b41',
      bgBottom: '#d07e63',
      speed: 192,
      gap: 248,
      pipeWidth: 76,
      playerHeight: 108
    }
  ]
};
