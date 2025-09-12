(() => {
  // Level 8: Storm Clouds - weather platforms
  const cols = 360;
  const rows = 45;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // Storm ground
  for (let x = 0; x < cols; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // Cloud platforms - irregular shapes
  for (let x = 20; x < 40; x++) grid[rows - 16][x] = 1;
  for (let x = 60; x < 85; x++) grid[rows - 20][x] = 1;
  for (let x = 110; x < 130; x++) grid[rows - 24][x] = 1;
  for (let x = 150; x < 175; x++) grid[rows - 18][x] = 1;
  for (let x = 200; x < 220; x++) grid[rows - 22][x] = 1;
  for (let x = 250; x < 275; x++) grid[rows - 26][x] = 1;
  for (let x = 300; x < 325; x++) grid[rows - 20][x] = 1;
  for (let x = 340; x < 355; x++) grid[rows - 14][x] = 1;

  // Lightning hazards
  const spikes = [];
  function addLightning(startX, endX) {
    for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
  }
  addLightning(45, 55);
  addLightning(90, 105);
  addLightning(135, 145);
  addLightning(180, 195);
  addLightning(225, 245);
  addLightning(280, 295);

  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    return { x: 64, y: (rows - 18) * Tiles.TILE_SIZE - 32 }; 
  }

  window.Level8 = { tiles, spawnPoint };
})();
