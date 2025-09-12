(() => {
  // Level 5: Ice World - slippery platforms
  const cols = 300;
  const rows = 40;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // Ice ground
  for (let x = 0; x < cols; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // Ice platforms - crystal formations
  for (let x = 15; x < 30; x++) grid[rows - 12][x] = 1;
  for (let x = 45; x < 65; x++) grid[rows - 16][x] = 1;
  for (let x = 80; x < 100; x++) grid[rows - 14][x] = 1;
  for (let x = 120; x < 140; x++) grid[rows - 18][x] = 1;
  for (let x = 160; x < 180; x++) grid[rows - 16][x] = 1;
  for (let x = 200; x < 220; x++) grid[rows - 20][x] = 1;
  for (let x = 240; x < 260; x++) grid[rows - 14][x] = 1;
  for (let x = 275; x < 295; x++) grid[rows - 12][x] = 1;

  // Ice spikes (icicles)
  const spikes = [];
  function addIceSpikes(startX, endX) {
    for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
  }
  addIceSpikes(35, 40);
  addIceSpikes(70, 75);
  addIceSpikes(105, 110);
  addIceSpikes(145, 150);
  addIceSpikes(185, 190);
  addIceSpikes(225, 230);

  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    return { x: 64, y: (rows - 14) * Tiles.TILE_SIZE - 32 }; 
  }

  window.Level5 = { tiles, spawnPoint };
})();
