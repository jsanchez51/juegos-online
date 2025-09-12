(() => {
  // Level 10: Final Castle - epic finale
  const cols = 400;
  const rows = 50;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // Castle grounds
  for (let x = 0; x < cols; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // Castle approach - grand staircase
  for (let x = 30; x < 50; x++) grid[rows - 12][x] = 1;  // step 1
  for (let x = 55; x < 75; x++) grid[rows - 16][x] = 1;  // step 2
  for (let x = 80; x < 100; x++) grid[rows - 20][x] = 1; // step 3
  for (let x = 105; x < 125; x++) grid[rows - 24][x] = 1; // step 4
  for (let x = 130; x < 150; x++) grid[rows - 28][x] = 1; // step 5

  // Castle towers and walls
  const castleStart = 200;
  
  // Main castle base
  for (let x = castleStart; x < castleStart + 60; x++) {
    for (let y = rows - 25; y < rows - 8; y++) {
      grid[y][x] = 1;
    }
  }

  // Castle towers
  for (let y = rows - 35; y < rows - 25; y++) {
    // Left tower
    for (let x = castleStart; x < castleStart + 8; x++) {
      grid[y][x] = 1;
    }
    // Right tower  
    for (let x = castleStart + 52; x < castleStart + 60; x++) {
      grid[y][x] = 1;
    }
    // Central tower
    for (let x = castleStart + 26; x < castleStart + 34; x++) {
      grid[y][x] = 1;
    }
  }

  // Castle entrance platforms
  for (let x = 160; x < 180; x++) grid[rows - 20][x] = 1;
  for (let x = 180; x < 200; x++) grid[rows - 22][x] = 1;

  // Final approach to castle
  for (let x = 270; x < 290; x++) grid[rows - 18][x] = 1;
  for (let x = 300; x < 320; x++) grid[rows - 16][x] = 1;
  for (let x = 330; x < 350; x++) grid[rows - 14][x] = 1;
  for (let x = 360; x < 380; x++) grid[rows - 12][x] = 1;

  // Castle hazards - dragon fire
  const spikes = [];
  function addDragonFire(startX, endX) {
    for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
  }
  addDragonFire(25, 28);
  addDragonFire(77, 82);
  addDragonFire(127, 132);
  addDragonFire(155, 165);
  addDragonFire(295, 305);

  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    return { x: 64, y: (rows - 14) * Tiles.TILE_SIZE - 32 }; 
  }

  // Final castle goal
  function getCastleGoal() {
    return { 
      x: (castleStart + 20) * Tiles.TILE_SIZE, 
      y: (rows - 30) * Tiles.TILE_SIZE, 
      w: Tiles.TILE_SIZE * 20, 
      h: Tiles.TILE_SIZE * 8 
    };
  }

  window.Level10 = { tiles, spawnPoint, getCastleGoal };
})();
