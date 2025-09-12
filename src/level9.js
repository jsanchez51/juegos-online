(() => {
  // Level 9: Night Flight - dark level with glowing platforms
  const cols = 380;
  const rows = 48;
  const grid = Tiles.createTilemap(cols, rows, 0);

  // Night ground
  for (let x = 0; x < cols; x++) {
    grid[rows - 8][x] = 1;
    grid[rows - 7][x] = 1;
    grid[rows - 6][x] = 1;
  }

  // Glowing night platforms - scattered and challenging
  for (let x = 25; x < 45; x++) grid[rows - 18][x] = 1;
  for (let x = 70; x < 90; x++) grid[rows - 25][x] = 1;
  for (let x = 120; x < 140; x++) grid[rows - 22][x] = 1;
  for (let x = 170; x < 190; x++) grid[rows - 28][x] = 1;
  for (let x = 220; x < 240; x++) grid[rows - 24][x] = 1;
  for (let x = 270; x < 290; x++) grid[rows - 30][x] = 1;
  for (let x = 320; x < 340; x++) grid[rows - 26][x] = 1;
  for (let x = 360; x < 375; x++) grid[rows - 20][x] = 1;

  // Shadow traps
  const spikes = [];
  function addShadowTrap(startX, endX) {
    for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
  }
  addShadowTrap(50, 65);
  addShadowTrap(95, 115);
  addShadowTrap(145, 165);
  addShadowTrap(195, 215);
  addShadowTrap(245, 265);
  addShadowTrap(295, 315);

  const tiles = { grid, cols, rows, spikes };

  function spawnPoint() { 
    return { x: 64, y: (rows - 20) * Tiles.TILE_SIZE - 32 }; 
  }

  window.Level9 = { tiles, spawnPoint };
})();
