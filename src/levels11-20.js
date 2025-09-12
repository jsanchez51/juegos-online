(() => {
  // Level 11: Space World
  const Level11 = {
    tiles: (() => {
      const cols = 350, rows = 45;
      const grid = Tiles.createTilemap(cols, rows, 0);
      for (let x = 0; x < cols; x++) { grid[rows - 8][x] = 1; grid[rows - 7][x] = 1; grid[rows - 6][x] = 1; }
      // Asteroid platforms
      for (let x = 20; x < 35; x++) grid[rows - 16][x] = 1;
      for (let x = 60; x < 80; x++) grid[rows - 22][x] = 1;
      for (let x = 110; x < 130; x++) grid[rows - 18][x] = 1;
      for (let x = 160; x < 180; x++) grid[rows - 26][x] = 1;
      for (let x = 210; x < 230; x++) grid[rows - 20][x] = 1;
      for (let x = 270; x < 290; x++) grid[rows - 24][x] = 1;
      for (let x = 320; x < 340; x++) grid[rows - 16][x] = 1;
      // Additional challenging platforms
      for (let x = 45; x < 55; x++) grid[rows - 14][x] = 1;
      for (let x = 90; x < 105; x++) grid[rows - 28][x] = 1;
      for (let x = 140; x < 155; x++) grid[rows - 30][x] = 1;
      for (let x = 190; x < 205; x++) grid[rows - 32][x] = 1;
      for (let x = 250; x < 265; x++) grid[rows - 28][x] = 1;
      for (let x = 300; x < 315; x++) grid[rows - 22][x] = 1;
      // Space hazards (laser beams)
      const spikes = [];
      function addLaser(startX, endX) {
        for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
      }
      addLaser(40, 45); addLaser(85, 90); addLaser(135, 140);
      addLaser(185, 190); addLaser(245, 250); addLaser(295, 300);
      return { grid, cols, rows, spikes };
    })(),
    spawnPoint: () => ({ x: 64, y: (45 - 18) * 32 - 32 })
  };

  // Level 12: Crystal Caves
  const Level12 = {
    tiles: (() => {
      const cols = 360, rows = 46;
      const grid = Tiles.createTilemap(cols, rows, 0);
      for (let x = 0; x < cols; x++) { grid[rows - 8][x] = 1; grid[rows - 7][x] = 1; grid[rows - 6][x] = 1; }
      // Crystal formations - more complex
      for (let x = 25; x < 45; x++) grid[rows - 20][x] = 1;
      for (let x = 70; x < 90; x++) grid[rows - 24][x] = 1;
      for (let x = 120; x < 140; x++) grid[rows - 18][x] = 1;
      for (let x = 170; x < 190; x++) grid[rows - 28][x] = 1;
      for (let x = 220; x < 240; x++) grid[rows - 22][x] = 1;
      for (let x = 280; x < 300; x++) grid[rows - 26][x] = 1;
      for (let x = 330; x < 350; x++) grid[rows - 20][x] = 1;
      // Crystal spikes and barriers
      for (let x = 50; x < 65; x++) grid[rows - 16][x] = 1;
      for (let x = 95; x < 115; x++) grid[rows - 30][x] = 1;
      for (let x = 145; x < 165; x++) grid[rows - 32][x] = 1;
      for (let x = 195; x < 215; x++) grid[rows - 24][x] = 1;
      for (let x = 245; x < 275; x++) grid[rows - 30][x] = 1;
      for (let x = 305; x < 325; x++) grid[rows - 28][x] = 1;
      // Crystal shard hazards
      const spikes = [];
      function addCrystalSpikes(startX, endX) {
        for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
      }
      addCrystalSpikes(55, 60); addCrystalSpikes(100, 110); addCrystalSpikes(150, 160);
      addCrystalSpikes(200, 210); addCrystalSpikes(255, 270); addCrystalSpikes(310, 320);
      return { grid, cols, rows, spikes };
    })(),
    spawnPoint: () => ({ x: 64, y: (46 - 22) * 32 - 32 })
  };

  // Level 13: Underwater Ruins
  const Level13 = {
    tiles: (() => {
      const cols = 370, rows = 48;
      const grid = Tiles.createTilemap(cols, rows, 0);
      for (let x = 0; x < cols; x++) { grid[rows - 8][x] = 1; grid[rows - 7][x] = 1; grid[rows - 6][x] = 1; }
      // Ruins platforms - more complex
      for (let x = 30; x < 50; x++) grid[rows - 18][x] = 1;
      for (let x = 80; x < 100; x++) grid[rows - 25][x] = 1;
      for (let x = 130; x < 150; x++) grid[rows - 20][x] = 1;
      for (let x = 180; x < 200; x++) grid[rows - 30][x] = 1;
      for (let x = 230; x < 250; x++) grid[rows - 24][x] = 1;
      for (let x = 290; x < 310; x++) grid[rows - 28][x] = 1;
      for (let x = 340; x < 360; x++) grid[rows - 22][x] = 1;
      // Underwater obstacles - pillars and broken structures
      for (let x = 55; x < 75; x++) grid[rows - 16][x] = 1;
      for (let x = 105; x < 125; x++) grid[rows - 32][x] = 1;
      for (let x = 155; x < 175; x++) grid[rows - 26][x] = 1;
      for (let x = 205; x < 225; x++) grid[rows - 34][x] = 1;
      for (let x = 255; x < 285; x++) grid[rows - 30][x] = 1;
      for (let x = 315; x < 335; x++) grid[rows - 26][x] = 1;
      // Underwater currents (dangerous zones)
      const spikes = [];
      function addCurrent(startX, endX) {
        for (let x = startX; x < endX; x++) spikes.push({ x, y: rows - 9 });
      }
      addCurrent(60, 70); addCurrent(110, 120); addCurrent(160, 170);
      addCurrent(210, 220); addCurrent(270, 280); addCurrent(320, 330);
      return { grid, cols, rows, spikes };
    })(),
    spawnPoint: () => ({ x: 64, y: (48 - 20) * 32 - 32 })
  };

  // Level 14: Desert Temple
  const Level14 = {
    tiles: (() => {
      const cols = 380, rows = 47;
      const grid = Tiles.createTilemap(cols, rows, 0);
      for (let x = 0; x < cols; x++) { grid[rows - 8][x] = 1; grid[rows - 7][x] = 1; grid[rows - 6][x] = 1; }
      // Temple steps
      for (let x = 40; x < 60; x++) grid[rows - 15][x] = 1;
      for (let x = 80; x < 100; x++) grid[rows - 20][x] = 1;
      for (let x = 120; x < 140; x++) grid[rows - 25][x] = 1;
      for (let x = 160; x < 180; x++) grid[rows - 22][x] = 1;
      for (let x = 200; x < 220; x++) grid[rows - 27][x] = 1;
      for (let x = 250; x < 270; x++) grid[rows - 24][x] = 1;
      for (let x = 300; x < 320; x++) grid[rows - 18][x] = 1;
      for (let x = 350; x < 370; x++) grid[rows - 16][x] = 1;
      const spikes = []; return { grid, cols, rows, spikes };
    })(),
    spawnPoint: () => ({ x: 64, y: (47 - 17) * 32 - 32 })
  };

  // Level 15: Floating Fortress
  const Level15 = {
    tiles: (() => {
      const cols = 390, rows = 50;
      const grid = Tiles.createTilemap(cols, rows, 0);
      for (let x = 0; x < cols; x++) { grid[rows - 8][x] = 1; grid[rows - 7][x] = 1; grid[rows - 6][x] = 1; }
      // Fortress platforms
      for (let x = 35; x < 55; x++) grid[rows - 22][x] = 1;
      for (let x = 80; x < 100; x++) grid[rows - 28][x] = 1;
      for (let x = 130; x < 150; x++) grid[rows - 24][x] = 1;
      for (let x = 180; x < 200; x++) grid[rows - 32][x] = 1;
      for (let x = 230; x < 250; x++) grid[rows - 26][x] = 1;
      for (let x = 280; x < 300; x++) grid[rows - 30][x] = 1;
      for (let x = 330; x < 350; x++) grid[rows - 20][x] = 1;
      for (let x = 360; x < 380; x++) grid[rows - 18][x] = 1;
      const spikes = []; return { grid, cols, rows, spikes };
    })(),
    spawnPoint: () => ({ x: 64, y: (50 - 24) * 32 - 32 })
  };

  // Levels 16-20 (simplified for now)
  const Level16 = { tiles: Level11.tiles, spawnPoint: Level11.spawnPoint };
  const Level17 = { tiles: Level12.tiles, spawnPoint: Level12.spawnPoint };
  const Level18 = { tiles: Level13.tiles, spawnPoint: Level13.spawnPoint };
  const Level19 = { tiles: Level14.tiles, spawnPoint: Level14.spawnPoint };
  
  // Level 20: Epic Final Boss Castle
  const Level20 = {
    tiles: (() => {
      const cols = 400, rows = 55;
      const grid = Tiles.createTilemap(cols, rows, 0);
      for (let x = 0; x < cols; x++) { grid[rows - 8][x] = 1; grid[rows - 7][x] = 1; grid[rows - 6][x] = 1; }
      // Epic castle with multiple towers
      const castleX = 200;
      for (let x = castleX; x < castleX + 80; x++) {
        for (let y = rows - 30; y < rows - 8; y++) {
          grid[y][x] = 1;
        }
      }
      // Multiple towers
      for (let y = rows - 45; y < rows - 30; y++) {
        for (let x = castleX; x < castleX + 10; x++) grid[y][x] = 1;
        for (let x = castleX + 35; x < castleX + 45; x++) grid[y][x] = 1;
        for (let x = castleX + 70; x < castleX + 80; x++) grid[y][x] = 1;
      }
      const spikes = []; return { grid, cols, rows, spikes };
    })(),
    spawnPoint: () => ({ x: 64, y: (55 - 32) * 32 - 32 }),
    getCastleGoal: () => ({ x: 240 * 32, y: (55 - 40) * 32, w: 32 * 10, h: 32 * 8 })
  };

  window.Level11 = Level11;
  window.Level12 = Level12;
  window.Level13 = Level13;
  window.Level14 = Level14;
  window.Level15 = Level15;
  window.Level16 = Level16;
  window.Level17 = Level17;
  window.Level18 = Level18;
  window.Level19 = Level19;
  window.Level20 = Level20;
})();
