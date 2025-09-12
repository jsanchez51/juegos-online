(() => {
  // Level 7: Sky Islands - floating platforms
  const cols = 340;
  const rows = 50;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // Starting platform
  for (let x = 0; x < 25; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // Floating sky islands
  for (let x = 40; x < 55; x++) grid[rows - 20][x] = 1;
  for (let x = 70; x < 85; x++) grid[rows - 25][x] = 1;
  for (let x = 100; x < 115; x++) grid[rows - 30][x] = 1;
  for (let x = 140; x < 155; x++) grid[rows - 28][x] = 1;
  for (let x = 180; x < 195; x++) grid[rows - 22][x] = 1;
  for (let x = 220; x < 235; x++) grid[rows - 26][x] = 1;
  for (let x = 260; x < 275; x++) grid[rows - 24][x] = 1;
  for (let x = 300; x < 320; x++) grid[rows - 18][x] = 1;

  // Wind currents (no spikes, just challenging jumps)
  const spikes = [];
  
  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    return { x: 64, y: (rows - 10) * Tiles.TILE_SIZE - 32 }; 
  }

  window.Level7 = { tiles, spawnPoint };
})();
