(() => {
  // Level 6: Volcano World - lava and fire
  const cols = 320;
  const rows = 42;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // Volcanic ground
  for (let x = 0; x < cols; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // Volcanic platforms - jagged rock formations
  for (let x = 20; x < 35; x++) grid[rows - 15][x] = 1;
  for (let x = 50; x < 70; x++) grid[rows - 18][x] = 1;
  for (let x = 90; x < 110; x++) grid[rows - 22][x] = 1;
  for (let x = 130; x < 150; x++) grid[rows - 16][x] = 1;
  for (let x = 170; x < 190; x++) grid[rows - 20][x] = 1;
  for (let x = 210; x < 230; x++) grid[rows - 24][x] = 1;
  for (let x = 250; x < 270; x++) grid[rows - 18][x] = 1;
  for (let x = 290; x < 310; x++) grid[rows - 14][x] = 1;

  // Lava pools (deadly spikes)
  const spikes = [];
  function addLavaPool(startX, endX) {
    for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
  }
  addLavaPool(40, 45);
  addLavaPool(75, 85);
  addLavaPool(115, 125);
  addLavaPool(155, 165);
  addLavaPool(195, 205);
  addLavaPool(235, 245);
  addLavaPool(275, 285);

  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    return { x: 64, y: (rows - 17) * Tiles.TILE_SIZE - 32 }; 
  }

  window.Level6 = { tiles, spawnPoint };
})();
