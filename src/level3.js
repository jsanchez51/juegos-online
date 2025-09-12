(() => {
  // Level 3: Dragon Caves - underground theme
  const cols = 280;
  const rows = 42;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // Cave ceiling (top part filled)
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < 8; y++) {
      grid[y][x] = 1;
    }
  }

  // Cave floor
  for (let x = 0; x < cols; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // Cave platforms - stalactites and stalagmites
  // Stalactites from ceiling
  for (let x = 20; x < 25; x++) grid[8][x] = 1;
  for (let x = 21; x < 24; x++) grid[9][x] = 1;
  for (let x = 22; x < 23; x++) grid[10][x] = 1;

  for (let x = 60; x < 67; x++) grid[8][x] = 1;
  for (let x = 61; x < 66; x++) grid[9][x] = 1;
  for (let x = 62; x < 65; x++) grid[10][x] = 1;
  for (let x = 63; x < 64; x++) grid[11][x] = 1;

  // Cave platforms
  for (let x = 15; x < 30; x++) grid[rows - 15][x] = 1;
  for (let x = 45; x < 65; x++) grid[rows - 20][x] = 1;
  for (let x = 80; x < 100; x++) grid[rows - 16][x] = 1;
  for (let x = 120; x < 140; x++) grid[rows - 22][x] = 1;
  for (let x = 160; x < 180; x++) grid[rows - 18][x] = 1;
  for (let x = 200; x < 220; x++) grid[rows - 14][x] = 1;
  for (let x = 240; x < 260; x++) grid[rows - 12][x] = 1;

  // Cave hazards - lava pools
  const spikes = [];
  function addLavaPool(startX, endX) {
    for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
  }
  addLavaPool(35, 42);
  addLavaPool(70, 77);
  addLavaPool(105, 115);
  addLavaPool(145, 155);
  addLavaPool(185, 195);
  addLavaPool(225, 235);

  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    return { x: 64, y: (rows - 17) * Tiles.TILE_SIZE - 32 }; 
  }

  window.Level3 = { tiles, spawnPoint };
})();
