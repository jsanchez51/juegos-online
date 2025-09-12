(() => {
  // Simple level: ground + some platforms
  const cols = 260;
  const rows = 36;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // ground (thicker and longer)
  for (let x = 0; x < cols; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // platforms (máx ~4 tiles sobre suelo)
  for (let x = 8; x < 18; x++) grid[rows - 12][x] = 1;   // 4 tiles sobre el suelo
  for (let x = 30; x < 44; x++) grid[rows - 11][x] = 1;  // 3 tiles
  for (let x = 60; x < 78; x++) grid[rows - 10][x] = 1;  // 2 tiles
  for (let x = 90; x < 110; x++) grid[rows - 12][x] = 1; // 4 tiles
  for (let x = 130; x < 150; x++) grid[rows - 11][x] = 1; // 3 tiles
  for (let x = 175; x < 195; x++) grid[rows - 10][x] = 1; // 2 tiles
  for (let x = 210; x < 230; x++) grid[rows - 12][x] = 1; // 4 tiles

  // crear fosos (huecos) en el suelo, anchos ≤ 5 tiles
  function carvePit(startX, width) {
    for (let x = startX; x < startX + width; x++) {
      grid[rows - 8][x] = 0;
      grid[rows - 7][x] = 0;
      grid[rows - 6][x] = 0;
    }
  }
  carvePit(42, 4);
  carvePit(84, 4);
  carvePit(164, 4);
  carvePit(206, 4);

  // hazards (spikes) row just above the ground in some segments
  const spikes = [];
  function addSpikes(startX, endX) {
    for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
  }
  addSpikes(36, 40);
  addSpikes(78, 82);
  addSpikes(156, 160);
  addSpikes(198, 202);

  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    // Spawn safely above the first platform
    return { x: 64, y: (rows - 14) * Tiles.TILE_SIZE - 32 }; 
  }

  window.Level1 = { tiles, spawnPoint };
})();


