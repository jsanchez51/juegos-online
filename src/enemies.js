(() => {
  function createEnemy(x, y, { speed = 80, w = 28, h = 20, range, left = null, right = null, type = 'gronckle' } = {}) {
    // Determine patrol bounds in world pixels. If left/right are not provided, use range around spawn.
    if (left == null || right == null) {
      const half = (range != null ? range : 400) / 2;
      left = x - half;
      right = x + half;
    }
    
    // Set properties based on enemy type
    const typeProps = getEnemyTypeProperties(type);
    
    return {
      x, y, 
      w: typeProps.w || w, 
      h: typeProps.h || h,
      vx: speed,
      vy: 0,
      alive: true,
      patrolSpeed: speed,
      onGround: false,
      dir: Math.sign(speed) || 1,
      leftBound: Math.min(left, right),
      rightBound: Math.max(left, right),
      type: type,
      color: typeProps.color,
      canFly: typeProps.canFly,
      flyHeight: typeProps.flyHeight || 0,
      attackTimer: 0,
      animFrame: 0,
    };
  }
  
  function getEnemyTypeProperties(type) {
    const types = {
      gronckle: { w: 32, h: 24, color: '#8d6e63', canFly: false },
      nadder: { w: 30, h: 22, color: '#ff5722', canFly: true, flyHeight: 80 },
      zippleback: { w: 36, h: 26, color: '#4caf50', canFly: false },
      viking: { w: 20, h: 28, color: '#795548', canFly: false },
      nightmare: { w: 34, h: 28, color: '#d32f2f', canFly: true, flyHeight: 60 }
    };
    return types[type] || types.gronckle;
  }

  function updateEnemy(e, dt, tiles) {
    if (!e.alive) return;
    
    e.animFrame += dt * 8; // animation speed
    e.attackTimer += dt;
    
    // Flying enemies have different behavior
    if (e.canFly) {
      updateFlyingEnemy(e, dt);
    } else {
      updateGroundEnemy(e, dt, tiles);
    }
  }
  
  function updateGroundEnemy(e, dt, tiles) {
    // Simple patrol logic: flip at bounds
    if (e.x <= e.leftBound) {
      e.dir = 1;
      e.x = e.leftBound + 1;
    } else if (e.x + e.w >= e.rightBound) {
      e.dir = -1;
      e.x = e.rightBound - e.w - 1;
    }
    
    // Set velocity based on direction
    e.vx = e.dir * e.patrolSpeed;
    
    // Apply physics
    Physics.applyGravity(e, dt);
    Physics.integrate(e, dt);
    const { onGround } = Physics.resolveTileCollisions(e, tiles);
    e.onGround = onGround;
    
    // If collision stopped us, reverse
    if (Math.abs(e.vx) < 10 && e.onGround) {
      e.dir = -e.dir;
      e.vx = e.dir * e.patrolSpeed;
    }
  }
  
  function updateFlyingEnemy(e, dt) {
    // Flying patrol with sine wave movement
    const centerY = e.y - e.flyHeight;
    const waveOffset = Math.sin(Date.now() * 0.003 + e.x * 0.01) * 20;
    
    // Horizontal movement
    if (e.x <= e.leftBound) {
      e.dir = 1;
      e.x = e.leftBound + 1;
    } else if (e.x + e.w >= e.rightBound) {
      e.dir = -1;
      e.x = e.rightBound - e.w - 1;
    }
    
    e.vx = e.dir * e.patrolSpeed;
    e.x += e.vx * dt;
    
    // Vertical sine wave flight
    const targetY = centerY + waveOffset;
    e.y += (targetY - e.y) * dt * 3;
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  
  function drawEnemySprite(ctx, enemy, camX, camY) {
    ctx.save();
    ctx.translate(-camX, -camY);
    
    const x = enemy.x;
    const y = enemy.y;
    const w = enemy.w;
    const h = enemy.h;
    const facing = enemy.dir;
    
    // Flip horizontally if facing left
    if (facing < 0) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
    }
    
    switch(enemy.type) {
      case 'gronckle':
        drawGronckle(ctx, facing < 0 ? 0 : x, facing < 0 ? 0 : y, w, h, enemy);
        break;
      case 'nadder':
        drawNadder(ctx, facing < 0 ? 0 : x, facing < 0 ? 0 : y, w, h, enemy);
        break;
      case 'zippleback':
        drawZippleback(ctx, facing < 0 ? 0 : x, facing < 0 ? 0 : y, w, h, enemy);
        break;
      case 'viking':
        drawViking(ctx, facing < 0 ? 0 : x, facing < 0 ? 0 : y, w, h, enemy);
        break;
      case 'nightmare':
        drawNightmare(ctx, facing < 0 ? 0 : x, facing < 0 ? 0 : y, w, h, enemy);
        break;
      default:
        drawGronckle(ctx, facing < 0 ? 0 : x, facing < 0 ? 0 : y, w, h, enemy);
    }
    
    ctx.restore();
  }
  
  function drawGronckle(ctx, x, y, w, h, enemy) {
    // Gronckle: Rock-eating dragon, brown and sturdy
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(x + 2, y + 6, w - 4, h - 10);
    
    // Head
    ctx.beginPath();
    ctx.ellipse(x + w - 8, y + 8, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Small wings
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 4, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(x + w - 12, y + 6, 2, 2);
    ctx.fillRect(x + w - 8, y + 6, 2, 2);
  }
  
  function drawNadder(ctx, x, y, w, h, enemy) {
    // Deadly Nadder: Blue with spikes
    const wingFlap = Math.sin(enemy.animFrame) * 0.3;
    
    ctx.fillStyle = '#2196f3';
    ctx.fillRect(x + 2, y + 6, w - 4, h - 10);
    
    // Head with spikes
    ctx.beginPath();
    ctx.ellipse(x + w - 8, y + 8, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Animated wings
    ctx.fillStyle = '#1976d2';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 4 + wingFlap, 5, 3, wingFlap * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Spikes on head
    ctx.fillStyle = '#ff5722';
    for(let i = 0; i < 3; i++) {
      ctx.fillRect(x + w - 14 + i * 2, y + 2, 2, 4);
    }
    
    // Eyes
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x + w - 12, y + 6, 2, 2);
    ctx.fillRect(x + w - 8, y + 6, 2, 2);
  }
  
  function drawZippleback(ctx, x, y, w, h, enemy) {
    // Hideous Zippleback: Two-headed dragon
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x + 2, y + 6, w - 4, h - 10);
    
    // Two heads
    ctx.beginPath();
    ctx.ellipse(x + w - 12, y + 6, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(x + w - 6, y + 10, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes on both heads
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(x + w - 14, y + 4, 2, 2);
    ctx.fillRect(x + w - 8, y + 8, 2, 2);
    
    // Gas effect
    if (enemy.attackTimer > 2) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
      ctx.fillRect(x + w, y + 4, 8, 12);
    }
  }
  
  function drawViking(ctx, x, y, w, h, enemy) {
    // Viking warrior
    ctx.fillStyle = '#795548';
    ctx.fillRect(x + 4, y + 8, w - 8, h - 12);
    
    // Head
    ctx.fillStyle = '#ffdbcb';
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + 6, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Helmet
    ctx.fillStyle = '#607d8b';
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + 4, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Horns
    ctx.fillStyle = '#ffc107';
    ctx.fillRect(x + w/2 - 6, y + 2, 2, 4);
    ctx.fillRect(x + w/2 + 4, y + 2, 2, 4);
    
    // Legs
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x + 4, y + h - 8, 3, 8);
    ctx.fillRect(x + w - 7, y + h - 8, 3, 8);
  }
  
  function drawNightmare(ctx, x, y, w, h, enemy) {
    // Monstrous Nightmare: Fire dragon
    const wingFlap = Math.sin(enemy.animFrame) * 0.4;
    const fireGlow = Math.sin(enemy.animFrame * 2) * 0.2 + 0.8;
    
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(x + 2, y + 6, w - 4, h - 10);
    
    // Head
    ctx.beginPath();
    ctx.ellipse(x + w - 8, y + 8, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Large animated wings
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 2 + wingFlap, 6, 4, wingFlap * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Fire effect
    ctx.fillStyle = `rgba(255, 193, 7, ${fireGlow * 0.6})`;
    ctx.fillRect(x + w, y + 6, 6, 8);
    ctx.fillStyle = `rgba(255, 87, 34, ${fireGlow * 0.4})`;
    ctx.fillRect(x + w + 3, y + 8, 4, 4);
    
    // Glowing eyes
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(x + w - 12, y + 6, 3, 3);
    ctx.fillRect(x + w - 7, y + 6, 3, 3);
  }

  window.Enemies = {
    createEnemy,
    updateEnemy,
    aabb,
    drawEnemySprite,
  };
})();


