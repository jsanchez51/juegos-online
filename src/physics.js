(() => {
  const GRAVITY = 2200; // px/s^2
  const MAX_FALL_SPEED = 1600; // reduced to prevent clipping

  function applyGravity(body, dt) {
    body.vy += GRAVITY * dt;
    if (body.vy > MAX_FALL_SPEED) body.vy = MAX_FALL_SPEED;
  }

  function integrate(body, dt) {
    // Predictive collision for large movements
    const futureX = body.x + body.vx * dt;
    const futureY = body.y + body.vy * dt;
    
    // If big movement predicted, check landing spot first
    if (Math.abs(body.vy * dt) > 20 || Math.abs(body.vx * dt) > 20) {
      const futureRect = { x: futureX, y: futureY, w: body.w, h: body.h };
      const futureHits = Tiles.rectVsTiles(futureRect, window.currentTiles);
      
      if (futureHits.length > 0) {
        // Collision predicted - use smaller steps to approach safely
        const steps = Math.max(8, Math.ceil(Math.max(Math.abs(body.vx), Math.abs(body.vy)) * dt / 4));
        const subDt = dt / steps;
        
        for (let i = 0; i < steps; i++) {
          const oldX = body.x, oldY = body.y;
          body.x += body.vx * subDt;
          body.y += body.vy * subDt;
          
          // Check collision at each substep
          const stepRect = { x: body.x, y: body.y, w: body.w, h: body.h };
          const stepHits = Tiles.rectVsTiles(stepRect, window.currentTiles);
          if (stepHits.length > 0) {
            // Hit something - stop here and let collision resolution handle it
            break;
          }
        }
        return;
      }
    }
    
    // Normal integration for small movements
    const maxStep = 6; // even smaller for safety
    const stepsX = Math.max(1, Math.ceil(Math.abs(body.vx) * dt / maxStep));
    const stepsY = Math.max(1, Math.ceil(Math.abs(body.vy) * dt / maxStep));
    const steps = Math.max(stepsX, stepsY);
    const subDt = dt / steps;
    
    for (let i = 0; i < steps; i++) {
      body.x += body.vx * subDt;
      body.y += body.vy * subDt;
    }
  }

  function resolveTileCollisions(body, tiles) {
    // Multiple collision passes for high-speed impacts
    let onGround = false;
    const maxPasses = 3; // multiple passes for robust collision
    
    for (let pass = 0; pass < maxPasses; pass++) {
      const rect = { x: body.x, y: body.y, w: body.w, h: body.h };
      const hits = Tiles.rectVsTiles(rect, tiles);
      
      if (hits.length === 0) break; // no more collisions
      
      // Sort by depth - resolve deepest first
      hits.sort((a, b) => b.depth - a.depth);
      
      // Separate X and Y hits
      const xHits = hits.filter(h => h.axis === 'x');
      const yHits = hits.filter(h => h.axis === 'y');
      
      // Resolve Y first (vertical) - critical for preventing fall-through
      for (const hit of yHits) {
        const dir = hit.sign > 0 ? 1 : -1;
        // Much larger separation for any collision to prevent tunneling
        const separation = hit.depth + 2.0; // always use large separation
        body.y += separation * dir;
        
        if (dir < 0 && body.vy > 0) {
          onGround = true;
        }
        body.vy = 0;
      }
      
      // Then resolve X (horizontal)
      for (const hit of xHits) {
        const dir = hit.sign > 0 ? 1 : -1;
        const separation = hit.depth + (Math.abs(body.vx) > 400 ? 0.5 : 0.2);
        body.x += separation * dir;
        body.vx = 0;
      }
    }
    
    return { onGround };
  }

  window.Physics = {
    GRAVITY,
    applyGravity,
    integrate,
    resolveTileCollisions,
  };
})();


