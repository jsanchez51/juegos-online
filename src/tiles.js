(() => {
  const TILE_SIZE = 32;

  function createTilemap(cols, rows, fill = 0) {
    const grid = new Array(rows);
    for (let y = 0; y < rows; y++) {
      grid[y] = new Array(cols).fill(fill);
    }
    return grid;
  }

  function worldToTile(value) {
    return Math.floor(value / TILE_SIZE);
  }

  function tileToWorld(tileIndex) {
    return tileIndex * TILE_SIZE;
  }

  function rectVsTiles(rect, tiles) {
    const collisions = [];
    const minTx = Math.max(0, worldToTile(rect.x));
    const maxTx = Math.min(tiles.cols - 1, worldToTile(rect.x + rect.w));
    const minTy = Math.max(0, worldToTile(rect.y));
    const maxTy = Math.min(tiles.rows - 1, worldToTile(rect.y + rect.h));
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const t = tiles.grid[ty][tx];
        if (t === 1) {
          const tileRect = { x: tx * TILE_SIZE, y: ty * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
          // AABB overlap
          const dx = (rect.x + rect.w / 2) - (tileRect.x + tileRect.w / 2);
          const px = (rect.w / 2 + tileRect.w / 2) - Math.abs(dx);
          if (px <= 0) continue;
          const dy = (rect.y + rect.h / 2) - (tileRect.y + tileRect.h / 2);
          const py = (rect.h / 2 + tileRect.h / 2) - Math.abs(dy);
          if (py <= 0) continue;
          if (px < py) {
            collisions.push({ axis: 'x', sign: Math.sign(dx), depth: px, tileRect });
          } else {
            collisions.push({ axis: 'y', sign: Math.sign(dy), depth: py, tileRect });
          }
        }
      }
    }
    return collisions;
  }

  window.Tiles = {
    TILE_SIZE,
    createTilemap,
    worldToTile,
    tileToWorld,
    rectVsTiles,
  };
})();


