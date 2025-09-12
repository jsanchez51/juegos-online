(() => {
  // Level 4: Berk Village - final level leading to castle
  const cols = 320;
  const rows = 45;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // Ground
  for (let x = 0; x < cols; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // Viking house platforms (stepped houses with accessible heights)
  // House 1 - low and accessible
  for (let x = 20; x < 35; x++) {
    for (let y = rows - 14; y < rows - 8; y++) {
      grid[y][x] = 1;
    }
  }
  // House 1 roof
  for (let x = 22; x < 33; x++) grid[rows - 15][x] = 1;
  
  // Stepping stones to House 2
  for (let x = 40; x < 45; x++) grid[rows - 12][x] = 1;
  for (let x = 46; x < 50; x++) grid[rows - 16][x] = 1;

  // House 2 - medium height with steps
  for (let x = 50; x < 70; x++) {
    for (let y = rows - 18; y < rows - 8; y++) {
      grid[y][x] = 1;
    }
  }
  // House 2 roof
  for (let x = 52; x < 68; x++) grid[rows - 19][x] = 1;
  
  // Stepping stones to House 3
  for (let x = 75; x < 80; x++) grid[rows - 14][x] = 1;
  for (let x = 82; x < 87; x++) grid[rows - 16][x] = 1;

  // House 3 - accessible height
  for (let x = 90; x < 110; x++) {
    for (let y = rows - 16; y < rows - 8; y++) {
      grid[y][x] = 1;
    }
  }
  // House 3 roof
  for (let x = 92; x < 108; x++) grid[rows - 17][x] = 1;

  // Bridge platforms with stepping stones
  for (let x = 120; x < 130; x++) grid[rows - 12][x] = 1; // approach bridge
  for (let x = 130; x < 150; x++) grid[rows - 14][x] = 1; // first bridge
  for (let x = 160; x < 170; x++) grid[rows - 16][x] = 1; // step up
  for (let x = 170; x < 190; x++) grid[rows - 16][x] = 1; // second bridge (lower)
  for (let x = 200; x < 210; x++) grid[rows - 18][x] = 1; // step up
  for (let x = 210; x < 230; x++) grid[rows - 18][x] = 1; // third bridge (lower)
  
  // Castle approach ramp
  for (let x = 240; x < 250; x++) grid[rows - 16][x] = 1; // approach ramp
  for (let x = 250; x < 260; x++) grid[rows - 14][x] = 1; // mid ramp
  for (let x = 260; x < 270; x++) grid[rows - 12][x] = 1; // high ramp

  // Final castle - more accessible
  const castleX = 280;
  const castleY = rows - 16; // much lower castle
  // Castle base - smaller and more accessible
  for (let x = castleX; x < castleX + 25; x++) {
    for (let y = castleY; y < rows - 8; y++) {
      grid[y][x] = 1;
    }
  }
  // Castle towers - smaller
  for (let y = castleY - 6; y < castleY; y++) {
    grid[y][castleX] = 1;
    grid[y][castleX + 1] = 1;
    grid[y][castleX + 23] = 1;
    grid[y][castleX + 24] = 1;
  }
  // Central tower - smaller
  for (let y = castleY - 8; y < castleY; y++) {
    grid[y][castleX + 11] = 1;
    grid[y][castleX + 12] = 1;
    grid[y][castleX + 13] = 1;
  }

  // Viking hazards - fewer but strategic
  const spikes = [];
  function addSpikes(startX, endX) {
    for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
  }
  addSpikes(40, 45);
  addSpikes(80, 85);
  addSpikes(120, 125);
  addSpikes(160, 165);
  addSpikes(200, 205);

  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    return { x: 64, y: (rows - 12) * Tiles.TILE_SIZE - 32 }; 
  }

  // Castle goal area - more accessible
  function getCastleGoal() {
    return { 
      x: (castleX + 10) * Tiles.TILE_SIZE, 
      y: (castleY - 2) * Tiles.TILE_SIZE, 
      w: Tiles.TILE_SIZE * 6, 
      h: Tiles.TILE_SIZE * 3 
    };
  }

  window.Level4 = { tiles, spawnPoint, getCastleGoal };
})();
