(() => {
  // Level 2: Castle level with more challenging platforming
  const cols = 300;
  const rows = 40;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // ground
  for (let x = 0; x < cols; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // More accessible platforms leading to castle
  for (let x = 8; x < 20; x++) grid[rows - 12][x] = 1;   // start platform
  for (let x = 35; x < 50; x++) grid[rows - 14][x] = 1;  // gradual increase
  for (let x = 70; x < 85; x++) grid[rows - 16][x] = 1;  // medium height
  for (let x = 110; x < 125; x++) grid[rows - 18][x] = 1; // higher
  for (let x = 150; x < 165; x++) grid[rows - 20][x] = 1; // high but reachable
  for (let x = 190; x < 205; x++) grid[rows - 16][x] = 1; // step down
  for (let x = 230; x < 245; x++) grid[rows - 12][x] = 1; // approach to castle
  for (let x = 250; x < 265; x++) grid[rows - 10][x] = 1; // castle entrance

  // Easier access to level end - remove castle wall, just add exit ramp
  for (let x = 270; x < 290; x++) grid[rows - 10][x] = 1; // exit ramp
  for (let x = 290; x < 300; x++) grid[rows - 8][x] = 0;  // clear exit path

  // More challenging spike patterns - separated from enemy zones
  const spikes = [];
  function addSpikes(startX, endX) {
    for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
  }
  addSpikes(25, 30);   // shorter spike sections
  addSpikes(95, 100);  // away from enemy patrol zones
  addSpikes(170, 175);
  // removed spikes before exit for easier passage

  // Lava pits (deeper hazards)
  function carveLavaPit(startX, width, depth = 3) {
    for (let x = startX; x < startX + width; x++) {
      for (let d = 0; d < depth; d++) {
        grid[rows - 8 + d][x] = 0;
      }
      // Add lava spikes at bottom
      spikes.push({ x, y: rows - 9 + depth });
    }
  }
  carveLavaPit(52, 6, 2);
  carveLavaPit(127, 8, 2);
  carveLavaPit(207, 10, 2);

  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    return { x: 64, y: (rows - 17) * Tiles.TILE_SIZE - 32 }; 
  }

  // Castle goal area
  function getCastleGoal() {
    return { 
      x: (castleX + 12) * Tiles.TILE_SIZE, 
      y: (castleY - 2) * Tiles.TILE_SIZE, 
      w: Tiles.TILE_SIZE * 2, 
      h: Tiles.TILE_SIZE * 2 
    };
  }

  window.Level2 = { tiles, spawnPoint, getCastleGoal };
})();
