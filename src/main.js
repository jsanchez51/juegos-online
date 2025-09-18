(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const VIEW_W = canvas.width;
  const VIEW_H = canvas.height;

  const cam = Camera.createCamera(VIEW_W, VIEW_H);

  // Player (placeholder): simple rectangle representing Chimuelo
  let currentLevel = 1;
  let currentLevelData = Level1;
  let gameComplete = false;
  let showLevelMenu = false;

  const player = {
    x: currentLevelData.spawnPoint().x,
    y: currentLevelData.spawnPoint().y,
    w: 28,
    h: 20,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    wasOnGround: false,
    speed: 400,
    runSpeed: 600,
    jumpSpeed: 860,
    runJumpSpeed: 1200,
    maxAirSpeed: 500,
    invuln: 0, // seconds of invulnerability after damage
    coyote: 0,
    jumpBuffer: 0,
    stuckTimer: 0,
    lastX: 0,
    flyTime: 0,
    maxFlyTime: 1.5,
    fireAmmo: 1, // empezar con algo de munición
    maxFireAmmo: 10,
    currentTrick: null,
    trickTimer: 0,
    trickCooldown: 0,
    spinAngle: 0,
    bounceHeight: 0,
    multiJumpCount: 0,
    maxMultiJumps: 5,
    headBob: 0,
    headTilt: 0,
    headX: 0, // offset horizontal de la cabeza
    headY: 0, // offset vertical de la cabeza
    headVisible: true, // si la cabeza está visible
    fallTime: 0, // tiempo cayendo para detectar caídas largas
  };

  let tiles = currentLevelData.tiles;
  window.currentTiles = tiles; // make tiles globally available for physics
  // Optional external assets. Set to true only if you upload files in /assets
  const ENABLE_OPTIONAL_ASSETS = false;
  if (ENABLE_OPTIONAL_ASSETS) {
    Assets.loadImage('player', 'assets/player.png');
    Assets.loadImage('enemy', 'assets/enemy.png');
    Assets.loadAudio('jump', 'assets/jump.wav', { volume: 0.35 });
    Assets.loadAudio('stomp', 'assets/stomp.wav', { volume: 0.4 });
    Assets.loadAudio('hit', 'assets/hit.wav', { volume: 0.4 });
    Assets.loadAudio('fire', 'assets/fire.wav', { volume: 0.5 });
    Assets.loadAudio('collect', 'assets/collect.wav', { volume: 0.3 });
  }

  // Collectibles and projectiles
  let collectibles = [];
  let fireballs = [];

  function handleInput(dt) {
    let move = 0;
    if (Input.isDown('left')) move -= 1;
    if (Input.isDown('right')) move += 1;
    player.facing = move !== 0 ? Math.sign(move) : player.facing;

    const isRunning = Input.isDown('run');
    const groundAccel = isRunning ? 8000 : 6000;
    const airAccel = isRunning ? 3500 : 2500;
    const maxGroundSpeed = isRunning ? player.runSpeed : player.speed;
    const maxAirSpeed = isRunning ? player.maxAirSpeed : 400;

    const targetVx = move * (player.onGround ? maxGroundSpeed : maxAirSpeed);
    
    // More responsive movement with immediate response
    if (move !== 0) {
      // Direct movement for immediate response
      const accel = player.onGround ? groundAccel : airAccel;
      if (Math.abs(player.vx - targetVx) > 50) {
        // Quick acceleration to target speed
        player.vx += Math.sign(targetVx - player.vx) * accel * dt;
      } else {
        // Snap to target for smooth constant movement
        player.vx = targetVx;
      }
    } else {
      // Improved friction - gradual but not too sticky
      if (player.onGround) {
        const friction = 3500;
        if (Math.abs(player.vx) < 20) {
          player.vx = 0; // snap to stop for small velocities
        } else {
          player.vx *= Math.max(0, 1 - friction * dt / Math.abs(player.vx));
        }
      }
    }

    // Jump - more powerful when running
    if (Input.pressed('jump')) {
      player.jumpBuffer = 0.15; // buffer jump up to 150ms
      player.isRunJump = isRunning; // remember if this jump was while running
    }

    // Reset
    if (Input.pressed('reset')) {
      if (gameComplete) {
        // Restart from level 1
        gameComplete = false;
        switchLevel(1);
      } else {
        // Reset everything in current level
        const s = currentLevelData.spawnPoint();
        player.x = s.x; player.y = s.y; player.vx = 0; player.vy = 0; player.invuln = 0;
        player.stuckTimer = 0;
        player.fireAmmo = 1; // restore initial ammo
        player.flyTime = 0; // restore flight
        fireballs = []; // clear all fireballs
        resetEnemies();
        createLevelCollectibles(); // respawn all collectibles
      }
    }
    
    // Debug teleport (T key) - move forward 500px
    if (Input.pressed('teleport')) {
      player.x += 500;
      player.y -= 50; // lift up a bit
      player.vx = 0; player.vy = 0;
      player.stuckTimer = 0;
    }
    
    // Emergency unstuck (G key) - force free from any situation
    if (Input.pressed('unstuck')) {
      player.y -= 64; // move up 2 tiles
      player.x += player.facing * 64; // move 2 tiles horizontally
      player.vx = 0; player.vy = 0;
      player.stuckTimer = 0;
      player.fallTime = 0;
      
      // Create dramatic unstuck effect
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        trickParticles.push({
          x: player.x + player.w/2,
          y: player.y + player.h/2,
          vx: Math.cos(angle) * 200,
          vy: Math.sin(angle) * 200,
          life: 1.5,
          color: '#ff9800',
          size: 4
        });
      }
      Assets.play('jump');
    }
    
    // Chimuelo's flight ability (F key) - limited flight time
    if (Input.isDown('fly') && player.flyTime < player.maxFlyTime) {
      player.vy = Math.max(player.vy - 1800 * dt, -600); // upward thrust
      player.flyTime += dt;
    } else if (player.onGround) {
      player.flyTime = 0; // recharge when on ground
    }
    
    // Fire plasma blast (X key)
    if (Input.pressed('fire') && player.fireAmmo > 0) {
      createFireball();
      player.fireAmmo--;
      Assets.play('fire');
    }
    
    // Chimuelo's tricks and payasadas
    if (player.trickCooldown <= 0) {
      if (Input.pressed('trick1')) {
        startTrick('spin', 2.0);
      } else if (Input.pressed('trick2')) {
        startTrick('backflip', 1.5);
      } else if (Input.pressed('roar')) {
        startTrick('roar', 1.0);
      } else if (Input.pressed('dance')) {
        startTrick('dance', 3.0);
      } else if (Input.pressed('multijump')) {
        startTrick('multijump', 2.5);
      }
    }
    
    // Super jump for mobile - combines run + jump automatically
    if (Input.pressed('superjump')) {
      player.vy = -player.runJumpSpeed; // use run jump power
      player.jumpBuffer = 0;
      player.coyote = 0;
      Assets.play('jump');
    }
    
    // Toggle level menu
    if (Input.pressed('menu')) {
      showLevelMenu = !showLevelMenu;
    }
  }

  function drawBackground() {
    // Different backgrounds per level
    if (currentLevel === 1 || currentLevel === 2) {
      // Sky levels
      const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      sky.addColorStop(0, '#6db3f2');
      sky.addColorStop(1, '#1e3c72');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      // Mountains
      ctx.save();
      ctx.translate(-cam.x * 0.3, -cam.y * 0.1);
      ctx.fillStyle = '#27496d';
      for (let i = 0; i < 20; i++) {
        const x = i * 300;
        ctx.beginPath();
        ctx.moveTo(x, 400);
        ctx.lineTo(x + 150, 260);
        ctx.lineTo(x + 300, 400);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if (currentLevel === 3) {
      // Cave background
      const cave = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      cave.addColorStop(0, '#2c1810');
      cave.addColorStop(1, '#1a0f08');
      ctx.fillStyle = cave;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      
      // Cave ambient lighting
      ctx.save();
      ctx.translate(-cam.x * 0.2, -cam.y * 0.05);
      ctx.fillStyle = 'rgba(255, 140, 0, 0.1)';
      for (let i = 0; i < 15; i++) {
        const x = i * 400 + 100;
        ctx.beginPath();
        ctx.arc(x, 200, 50, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (currentLevel === 4) {
      // Berk village sky
      const berk = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      berk.addColorStop(0, '#87ceeb');
      berk.addColorStop(1, '#4682b4');
      ctx.fillStyle = berk;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      
      // Village smoke from chimneys
      ctx.save();
      ctx.translate(-cam.x * 0.4, -cam.y * 0.2);
      ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
      for (let i = 0; i < 10; i++) {
        const x = i * 500 + 200;
        const smoke = Math.sin(Date.now() * 0.002 + i) * 20;
        ctx.beginPath();
        ctx.arc(x + smoke, 100 - i * 5, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (currentLevel === 5) {
      // Ice world
      const ice = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      ice.addColorStop(0, '#e1f5fe');
      ice.addColorStop(1, '#b3e5fc');
      ctx.fillStyle = ice;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 6) {
      // Volcano world
      const volcano = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      volcano.addColorStop(0, '#ff6f00');
      volcano.addColorStop(1, '#bf360c');
      ctx.fillStyle = volcano;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 7) {
      // Sky islands
      const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      sky.addColorStop(0, '#e8eaf6');
      sky.addColorStop(1, '#9fa8da');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 8) {
      // Storm clouds
      const storm = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      storm.addColorStop(0, '#455a64');
      storm.addColorStop(1, '#263238');
      ctx.fillStyle = storm;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 9) {
      // Night
      const night = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      night.addColorStop(0, '#1a237e');
      night.addColorStop(1, '#000051');
      ctx.fillStyle = night;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 10) {
      // Epic castle finale
      const finale = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      finale.addColorStop(0, '#ffd54f');
      finale.addColorStop(1, '#ff8f00');
      ctx.fillStyle = finale;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 11) {
      // Space
      const space = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      space.addColorStop(0, '#1a0033');
      space.addColorStop(1, '#000000');
      ctx.fillStyle = space;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 137) % VIEW_W;
        const y = (i * 211) % VIEW_H;
        ctx.fillRect(x, y, 1, 1);
      }
    } else if (currentLevel === 12) {
      // Crystal caves
      const crystal = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      crystal.addColorStop(0, '#e1f5fe');
      crystal.addColorStop(1, '#0277bd');
      ctx.fillStyle = crystal;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 13) {
      // Underwater
      const water = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      water.addColorStop(0, '#1565c0');
      water.addColorStop(1, '#0d47a1');
      ctx.fillStyle = water;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 14) {
      // Desert
      const desert = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      desert.addColorStop(0, '#fff3e0');
      desert.addColorStop(1, '#ff8f00');
      ctx.fillStyle = desert;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 15) {
      // Fortress
      const fortress = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      fortress.addColorStop(0, '#cfd8dc');
      fortress.addColorStop(1, '#455a64');
      ctx.fillStyle = fortress;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel >= 16 && currentLevel <= 19) {
      // Advanced levels
      const advanced = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      advanced.addColorStop(0, '#f8bbd9');
      advanced.addColorStop(1, '#e91e63');
      ctx.fillStyle = advanced;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (currentLevel === 20) {
      // Final boss
      const boss = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      boss.addColorStop(0, '#fff59d');
      boss.addColorStop(1, '#ff6f00');
      ctx.fillStyle = boss;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  function drawTiles() {
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    const size = Tiles.TILE_SIZE;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let y = 0; y < tiles.rows; y++) {
      for (let x = 0; x < tiles.cols; x++) {
        if (tiles.grid[y][x] === 1) {
          // Tile colors based on level theme
          const wx = x * size; const wy = y * size;
          const g = ctx.createLinearGradient(wx, wy, wx, wy + size);
          
          if (currentLevel === 1 || currentLevel === 2) {
            // Grass/nature theme
            g.addColorStop(0, '#3b5e2b');
            g.addColorStop(1, '#274e13');
          } else if (currentLevel === 3) {
            // Cave stone theme
            g.addColorStop(0, '#5d4037');
            g.addColorStop(1, '#3e2723');
          } else if (currentLevel === 4) {
            // Viking wood/stone theme
            g.addColorStop(0, '#8d6e63');
            g.addColorStop(1, '#5d4037');
          } else if (currentLevel === 5) {
            // Ice theme
            g.addColorStop(0, '#e1f5fe');
            g.addColorStop(1, '#81d4fa');
          } else if (currentLevel === 6) {
            // Volcano theme
            g.addColorStop(0, '#d84315');
            g.addColorStop(1, '#bf360c');
          } else if (currentLevel === 7) {
            // Sky theme
            g.addColorStop(0, '#f3e5f5');
            g.addColorStop(1, '#ce93d8');
          } else if (currentLevel === 8) {
            // Storm theme
            g.addColorStop(0, '#607d8b');
            g.addColorStop(1, '#455a64');
          } else if (currentLevel === 9) {
            // Night theme
            g.addColorStop(0, '#3f51b5');
            g.addColorStop(1, '#1a237e');
          } else if (currentLevel === 10) {
            // Castle theme
            g.addColorStop(0, '#ffb74d');
            g.addColorStop(1, '#f57c00');
          } else if (currentLevel === 11) {
            // Space theme
            g.addColorStop(0, '#9c27b0');
            g.addColorStop(1, '#673ab7');
          } else if (currentLevel === 12) {
            // Crystal theme
            g.addColorStop(0, '#00bcd4');
            g.addColorStop(1, '#0097a7');
          } else if (currentLevel === 13) {
            // Underwater theme
            g.addColorStop(0, '#2196f3');
            g.addColorStop(1, '#1976d2');
          } else if (currentLevel === 14) {
            // Desert theme
            g.addColorStop(0, '#ffc107');
            g.addColorStop(1, '#f57c00');
          } else if (currentLevel === 15) {
            // Fortress theme
            g.addColorStop(0, '#607d8b');
            g.addColorStop(1, '#455a64');
          } else if (currentLevel >= 16 && currentLevel <= 19) {
            // Advanced themes
            g.addColorStop(0, '#e91e63');
            g.addColorStop(1, '#c2185b');
          } else if (currentLevel === 20) {
            // Final boss theme
            g.addColorStop(0, '#ff9800');
            g.addColorStop(1, '#e65100');
          }
          
          ctx.fillStyle = g;
          ctx.fillRect(wx, wy, size, size);
          ctx.strokeRect(wx + 0.5, wy + 0.5, size - 1, size - 1);
        }
      }
    }
    // Draw spikes
    if (tiles.spikes) {
      ctx.fillStyle = '#a71d31';
      for (const s of tiles.spikes) {
        const wx = s.x * size; const wy = s.y * size;
        ctx.beginPath();
        ctx.moveTo(wx, wy + size);
        ctx.lineTo(wx + size / 2, wy);
        ctx.lineTo(wx + size, wy + size);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    
    // Running effect - slight glow when running
    const isRunning = Input.isDown('run');
    if (isRunning && player.onGround && Math.abs(player.vx) > 100) {
      ctx.save();
      ctx.shadowColor = '#41b3ff';
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#41b3ff';
      ctx.fillRect(player.x - 2, player.y - 2, player.w + 4, player.h + 4);
      ctx.restore();
    }
    
    // High-speed fall effect
    if (player.fallTime > 0.3 && player.vy > 600) {
      ctx.save();
      ctx.translate(-cam.x, -cam.y);
      const intensity = Math.min(1, player.fallTime / 1.0);
      ctx.shadowColor = '#ff5722';
      ctx.shadowBlur = 12 * intensity;
      ctx.globalAlpha = 0.4 * intensity;
      ctx.fillStyle = '#ff5722';
      ctx.fillRect(player.x - 3, player.y - 5, player.w + 6, player.h + 10);
      
      // Speed lines
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * intensity})`;
        ctx.fillRect(player.x - 10, player.y - i * 15, 2, 10);
        ctx.fillRect(player.x + player.w + 8, player.y - i * 15, 2, 10);
      }
      ctx.restore();
    }
    
    // If a sprite is available, draw it; fallback to detailed Chimuelo
    const sprite = Assets.images['player'];
    if (Assets.hasImage('player')) {
      ctx.save();
      if (player.facing < 0) {
        ctx.translate(player.x + player.w, player.y);
        ctx.scale(-1, 1);
        if (player.invuln > 0) ctx.globalAlpha = 0.6;
        ctx.drawImage(sprite, 0, 0, 32, 24, 0, 0, player.w, player.h);
      } else {
        if (player.invuln > 0) ctx.globalAlpha = 0.6;
        ctx.drawImage(sprite, 0, 0, 32, 24, player.x, player.y, player.w, player.h);
      }
      ctx.restore();
    } else {
      // Draw detailed Chimuelo sprite
      drawChimueloSprite(player.x, player.y, player.w, player.h, player.facing, isRunning, player.invuln > 0);
    }
    ctx.restore();
  }
  
  function drawChimueloSprite(x, y, w, h, facing, isRunning, isInvuln) {
    ctx.save();
    if (isInvuln) ctx.globalAlpha = 0.6;
    
    // Apply trick transformations
    const centerX = x + w/2;
    const centerY = y + h/2;
    
    // Move to center for transformations
    ctx.translate(centerX, centerY + player.bounceHeight);
    
    // Apply trick rotations
    if (player.currentTrick && player.spinAngle !== 0) {
      ctx.rotate(player.spinAngle * Math.PI / 180);
    }
    
    // Flip horizontally if facing left
    if (facing < 0) {
      ctx.scale(-1, 1);
    }
    
    // Adjust coordinates to draw from center
    const drawX = -w/2;
    const drawY = -h/2;
    
    // Special trick effects
    if (player.currentTrick === 'roar') {
      const scale = 1 + Math.sin(player.trickTimer * 15) * 0.2;
      ctx.scale(scale, scale);
    } else if (player.currentTrick === 'dance') {
      const squish = 1 + Math.sin(player.trickTimer * 12) * 0.1;
      ctx.scale(squish, 1/squish);
    }
    
    // Body - black dragon body
    const bodyColor = isRunning ? '#1a1a2e' : '#0a0a0a';
    ctx.fillStyle = bodyColor;
    ctx.fillRect(drawX + 2, drawY + 4, w - 4, h - 8);
    
    // Wings - animated when flying
    const isFlying = Input.isDown('fly') && player.flyTime < player.maxFlyTime;
    const wingFlap = isFlying ? Math.sin(Date.now() * 0.02) * 0.5 : 0;
    
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(drawX + 8, drawY + 3 + wingFlap, 4, 3, -0.3 + wingFlap * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    if (isFlying) {
      ctx.beginPath();
      ctx.ellipse(drawX + 12, drawY + 2 - wingFlap, 5, 4, 0.2 - wingFlap * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Tail
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(drawX + 2, drawY + h/2);
    ctx.lineTo(drawX - 3, drawY + h/2 - 2);
    ctx.lineTo(drawX - 3, drawY + h/2 + 2);
    ctx.closePath();
    ctx.fill();
    
    // Head - with dynamic positioning and visibility
    if (player.headVisible) {
      ctx.fillStyle = bodyColor;
      
      let headX, headY;
      if (player.currentTrick === 'multijump') {
        // Head moves toward center during multijump
        headX = player.headX; // offset from center
        headY = player.headY; // offset from center
      } else {
        // Normal head position
        headX = drawX + w - 8 + player.headX;
        headY = drawY + 6 + player.headY;
      }
      
      ctx.save();
      ctx.translate(headX, headY);
      ctx.rotate(player.headTilt * Math.PI / 180);
      
      // Head size varies with tricks
      let headSizeW = 6, headSizeH = 5;
      if (player.currentTrick === 'multijump') {
        const sizeVar = 1 + Math.sin(Date.now() * 0.02) * 0.3;
        headSizeW *= sizeVar;
        headSizeH *= sizeVar;
      }
      
      ctx.beginPath();
      ctx.ellipse(0, 0, headSizeW, headSizeH, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      const eyeColor = isRunning ? '#64b5f6' : '#4caf50';
      ctx.fillStyle = eyeColor;
      
      ctx.beginPath();
      ctx.ellipse(-2, -1, 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(2, -1, 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils
      ctx.fillStyle = '#000';
      if (player.currentTrick === 'multijump') {
        const spinEyes = Math.sin(Date.now() * 0.03) * 1;
        ctx.fillRect(-2 + spinEyes, -1, 1, 1);
        ctx.fillRect(2 - spinEyes, -1, 1, 1);
      } else {
        ctx.fillRect(-2, -1, 1, 1);
        ctx.fillRect(2, -1, 1, 1);
      }
      
      ctx.restore();
    }
    
    // Legs
    ctx.fillStyle = bodyColor;
    ctx.fillRect(drawX + 6, drawY + h - 4, 3, 4);
    ctx.fillRect(drawX + w - 12, drawY + h - 4, 3, 4);
    
    // Ear fins (follow head if visible)
    if (player.headVisible) {
      ctx.fillStyle = '#2a2a2a';
      const finX = (player.currentTrick === 'multijump') ? player.headX - 2 : drawX + w - 10;
      const finY = (player.currentTrick === 'multijump') ? player.headY - 4 : drawY + 2;
      
      ctx.beginPath();
      ctx.moveTo(finX, finY);
      ctx.lineTo(finX + 2, finY - 3);
      ctx.lineTo(finX + 4, finY);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(finX + 4, finY);
      ctx.lineTo(finX + 6, finY - 3);
      ctx.lineTo(finX + 8, finY);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Chimuelo's tricks system
  function startTrick(trickType, duration) {
    if (player.currentTrick) return; // already doing a trick
    
    player.currentTrick = trickType;
    player.trickTimer = duration;
    player.trickCooldown = duration + 0.5; // cooldown after trick
    player.spinAngle = 0;
    player.bounceHeight = 0;
    
    // Special effects based on trick type
    switch(trickType) {
      case 'spin':
        if (player.onGround) player.vy = -300; // small hop
        createTrickParticles('spin');
        Assets.play('jump');
        break;
      case 'backflip':
        if (player.onGround) player.vy = -500; // higher jump
        player.vx += player.facing * 100; // momentum
        createTrickParticles('spin'); // reuse spin particles
        Assets.play('jump');
        break;
      case 'roar':
        // Roar scares nearby enemies
        scareEnemies();
        createTrickParticles('roar');
        Assets.play('fire'); // use fire sound as roar
        break;
      case 'dance':
        // Dance on the spot
        createTrickParticles('dance');
        break;
      case 'multijump':
        // Start multi-jump sequence
        player.multiJumpCount = 0;
        break;
    }
  }
  
  function updateTricks(dt) {
    if (player.currentTrick) {
      player.trickTimer -= dt;
      
      // Update trick animations
      switch(player.currentTrick) {
        case 'spin':
          player.spinAngle += dt * 720; // 2 full rotations per second
          break;
        case 'backflip':
          player.spinAngle += dt * 360; // 1 rotation per second
          break;
        case 'roar':
          player.bounceHeight = Math.sin(player.trickTimer * 10) * 5;
          break;
        case 'dance':
          player.bounceHeight = Math.sin(player.trickTimer * 8) * 8;
          player.spinAngle = Math.sin(player.trickTimer * 6) * 15;
          break;
        case 'multijump':
          // Auto-jump every 0.5 seconds
          const jumpInterval = 0.5;
          const elapsed = 2.5 - player.trickTimer;
          const shouldJump = Math.floor(elapsed / jumpInterval) > player.multiJumpCount;
          
          // Dramatic head movement - move toward center and hide/show
          const cycle = elapsed * 8;
          const jumpPhase = (elapsed % jumpInterval) / jumpInterval; // 0-1 per jump
          
          // Move head toward center of body during sequence
          const centerOffset = Math.sin(cycle) * 8; // moves toward center
          player.headX = centerOffset; // horizontal movement toward center
          
          // Vertical movement - up, down, and hide
          if (jumpPhase < 0.2) {
            // Hiding phase - head goes down into body
            player.headY = 8 + Math.sin(cycle * 2) * 4; // head down
            player.headVisible = Math.sin(cycle * 4) > -0.5; // flickering visibility
          } else if (jumpPhase < 0.4) {
            // Rising phase - head comes up high
            player.headY = -12 + Math.sin(cycle * 3) * 6; // head way up
            player.headVisible = true;
          } else if (jumpPhase < 0.8) {
            // Peak phase - head at normal height but moving
            player.headY = Math.sin(cycle * 4) * 8; // oscillating
            player.headVisible = true;
          } else {
            // Preparing next jump - head retracts slightly
            player.headY = 4 + Math.sin(cycle * 6) * 3;
            player.headVisible = Math.sin(cycle * 8) > -0.7; // occasional hide
          }
          
          // Each jump changes the pattern
          const jumpMod = player.multiJumpCount % 3;
          switch(jumpMod) {
            case 0: 
              player.headX += 6; // move more to center-right
              break;
            case 1: 
              player.headX -= 6; // move more to center-left
              break;
            case 2: 
              player.headY -= 8; // extra high
              break;
          }
          
          if (shouldJump && player.onGround && player.multiJumpCount < player.maxMultiJumps) {
            player.vy = -player.jumpSpeed * 0.8;
            player.multiJumpCount++;
            Assets.play('jump');
            
            // Extreme head movement on jump
            player.headX = (Math.random() - 0.5) * 12; // random center position
            player.headY = -15 + Math.random() * 10; // high with variation
            player.headVisible = Math.random() > 0.3; // 70% chance visible
            
            // Create jump particles
            for (let i = 0; i < 10; i++) {
              const angle = (i / 10) * Math.PI * 2;
              trickParticles.push({
                x: player.x + player.w/2,
                y: player.y + player.h,
                vx: Math.cos(angle) * 140,
                vy: Math.sin(angle) * 140 - 180,
                life: 1.5,
                color: player.multiJumpCount % 2 === 0 ? '#4caf50' : '#ffeb3b',
                size: 4
              });
            }
          }
          break;
      }
      
      // End trick
      if (player.trickTimer <= 0) {
        player.currentTrick = null;
        player.spinAngle = 0;
        player.bounceHeight = 0;
        player.multiJumpCount = 0;
        player.headBob = 0;
        player.headTilt = 0;
        player.headX = 0;
        player.headY = 0;
        player.headVisible = true;
      }
    }
    
    // Update cooldown
    if (player.trickCooldown > 0) {
      player.trickCooldown -= dt;
    }
  }
  
  function scareEnemies() {
    const scareRadius = 200;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < scareRadius) {
        // Make enemy run away faster
        e.patrolSpeed = Math.max(e.patrolSpeed, 200);
        e.vx = Math.sign(dx) * e.patrolSpeed * 1.5;
        
        // Reset to normal after 3 seconds
        setTimeout(() => {
          if (e.alive) {
            e.patrolSpeed = Math.min(e.patrolSpeed, 150);
          }
        }, 3000);
      }
    }
  }
  
  // Collectibles system
  function createCollectible(x, y, type = 'plasma') {
    return {
      x, y, w: 16, h: 16,
      type,
      collected: false,
      animFrame: 0,
      bobOffset: Math.random() * Math.PI * 2
    };
  }
  
  function updateCollectibles(dt) {
    for (const c of collectibles) {
      if (c.collected) continue;
      c.animFrame += dt * 6;
      
      // Check collection with expanded hitbox for easier pickup
      const expandedCollectible = {
        x: c.x - 8,
        y: c.y - 8,
        w: c.w + 16,
        h: c.h + 16
      };
      
      if (Enemies.aabb(player, expandedCollectible)) {
        c.collected = true;
        if (c.type === 'plasma') {
          player.fireAmmo = Math.min(player.maxFireAmmo, player.fireAmmo + 1); // 1 plasma = 1 fuego
          Assets.play('collect');
        }
      }
    }
    // Remove collected items
    collectibles = collectibles.filter(c => !c.collected);
  }
  
  function drawCollectibles() {
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    for (const c of collectibles) {
      if (c.collected) continue;
      
      const bob = Math.sin(c.animFrame + c.bobOffset) * 3;
      const glow = Math.sin(c.animFrame * 2) * 0.3 + 0.7;
      
      // Plasma orb
      if (c.type === 'plasma') {
        // Glow effect
        ctx.fillStyle = `rgba(64, 179, 255, ${glow * 0.4})`;
        ctx.fillRect(c.x - 4, c.y + bob - 4, c.w + 8, c.h + 8);
        
        // Core
        ctx.fillStyle = '#41b3ff';
        ctx.beginPath();
        ctx.ellipse(c.x + c.w/2, c.y + c.h/2 + bob, c.w/2, c.h/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        ctx.fillStyle = '#e3f2fd';
        ctx.beginPath();
        ctx.ellipse(c.x + c.w/2, c.y + c.h/2 + bob, c.w/4, c.h/4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  
  // Fireball system
  function createFireball() {
    const fireball = {
      x: player.x + (player.facing > 0 ? player.w : -8),
      y: player.y + player.h/2,
      vx: player.facing * 600,
      vy: 0,
      w: 8,
      h: 8,
      life: 3.0,
      trail: []
    };
    fireballs.push(fireball);
  }
  
  function updateFireballs(dt) {
    for (let i = fireballs.length - 1; i >= 0; i--) {
      const f = fireballs[i];
      
      // Update position
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.life -= dt;
      
      // Add trail
      f.trail.push({ x: f.x, y: f.y, life: 0.3 });
      f.trail = f.trail.filter(t => (t.life -= dt) > 0);
      
      // Check collision with tiles
      const rect = { x: f.x, y: f.y, w: f.w, h: f.h };
      const hits = Tiles.rectVsTiles(rect, tiles);
      
      // Check collision with enemies
      for (const e of enemies) {
        if (e.alive && Enemies.aabb(f, e)) {
          e.alive = false;
          fireballs.splice(i, 1);
          Assets.play('stomp');
          break;
        }
      }
      
      // Remove if hit wall or expired
      if (hits.length > 0 || f.life <= 0) {
        fireballs.splice(i, 1);
      }
    }
  }
  
  function drawFireballs() {
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    for (const f of fireballs) {
      // Draw trail
      for (let i = 0; i < f.trail.length; i++) {
        const t = f.trail[i];
        const alpha = t.life / 0.3;
        ctx.fillStyle = `rgba(255, 193, 7, ${alpha * 0.6})`;
        ctx.fillRect(t.x, t.y, 6, 6);
      }
      
      // Draw fireball
      const pulse = Math.sin(Date.now() * 0.02) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(255, 87, 34, ${pulse})`;
      ctx.fillRect(f.x - 1, f.y - 1, f.w + 2, f.h + 2);
      
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      
      ctx.fillStyle = '#fff';
      ctx.fillRect(f.x + 2, f.y + 2, 4, 4);
    }
    ctx.restore();
  }
  
  // Trick effects system
  let trickParticles = [];
  
  function createTrickParticles(trickType) {
    const centerX = player.x + player.w/2;
    const centerY = player.y + player.h/2;
    
    switch(trickType) {
      case 'spin':
        // Sparkles around spinning Chimuelo
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          trickParticles.push({
            x: centerX + Math.cos(angle) * 30,
            y: centerY + Math.sin(angle) * 30,
            vx: Math.cos(angle) * 50,
            vy: Math.sin(angle) * 50,
            life: 1.0,
            color: '#41b3ff',
            size: 3
          });
        }
        break;
      case 'roar':
        // Sound waves from roar
        for (let i = 0; i < 12; i++) {
          const angle = (Math.random() - 0.5) * Math.PI;
          trickParticles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * (100 + Math.random() * 100),
            vy: Math.sin(angle) * (50 + Math.random() * 50),
            life: 0.8,
            color: '#ffeb3b',
            size: 2 + Math.random() * 3
          });
        }
        break;
      case 'dance':
        // Musical notes
        for (let i = 0; i < 6; i++) {
          trickParticles.push({
            x: centerX + (Math.random() - 0.5) * 40,
            y: centerY - 20,
            vx: (Math.random() - 0.5) * 30,
            vy: -50 - Math.random() * 30,
            life: 2.0,
            color: '#e91e63',
            size: 4,
            type: 'note'
          });
        }
        break;
    }
  }
  
  function updateTrickParticles(dt) {
    for (let i = trickParticles.length - 1; i >= 0; i--) {
      const p = trickParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      
      if (p.life <= 0) {
        trickParticles.splice(i, 1);
      }
    }
  }
  
  function drawTrickParticles() {
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    
    for (const p of trickParticles) {
      const alpha = p.life / 2.0;
      ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      
      if (p.type === 'note') {
        // Draw musical note
        ctx.fillRect(p.x, p.y, p.size, p.size * 2);
        ctx.fillRect(p.x + p.size, p.y, p.size/2, p.size);
      } else {
        // Draw sparkle/particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }
  
  function drawLevelMenu() {
    if (!showLevelMenu) return;
    
    ctx.save();
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    
    // Menu title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SELECTOR DE NIVELES', VIEW_W/2, 50);
    
    // Instructions
    ctx.font = '14px Arial';
    ctx.fillText('Haz clic en un nivel o presiona M para cerrar', VIEW_W/2, 80);
    
    // Level grid
    const cols = 5;
    const rows = 4;
    const buttonW = 80;
    const buttonH = 60;
    const startX = (VIEW_W - cols * (buttonW + 10)) / 2;
    const startY = 120;
    
    for (let level = 1; level <= 20; level++) {
      const col = (level - 1) % cols;
      const row = Math.floor((level - 1) / cols);
      const x = startX + col * (buttonW + 10);
      const y = startY + row * (buttonH + 15);
      
      // Button background
      if (level === currentLevel) {
        ctx.fillStyle = '#4caf50'; // current level
      } else {
        ctx.fillStyle = '#2196f3'; // all levels accessible
      }
      
      ctx.fillRect(x, y, buttonW, buttonH);
      
      // Button border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, buttonW, buttonH);
      
      // Level number
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(level.toString(), x + buttonW/2, y + buttonH/2 - 5);
      
      // Level theme name
      const themes = [
        'Tutorial', 'Montañas', 'Cuevas', 'Berk', 'Hielo',
        'Volcán', 'Cielo', 'Tormenta', 'Noche', 'Castillo',
        'Espacio', 'Cristal', 'Submarino', 'Desierto', 'Fortaleza',
        'Espacio+', 'Cristal+', 'Submarino+', 'Desierto+', 'FINAL'
      ];
      
      ctx.font = '10px Arial';
      ctx.fillText(themes[level - 1], x + buttonW/2, y + buttonH/2 + 15);
    }
    
    ctx.textAlign = 'left';
    ctx.restore();
  }
  
  function handleLevelMenuClick(e) {
    if (!showLevelMenu) return false;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Scale click coordinates to canvas coordinates
    const scaleX = VIEW_W / rect.width;
    const scaleY = VIEW_H / rect.height;
    const canvasX = clickX * scaleX;
    const canvasY = clickY * scaleY;
    
    // Check level buttons
    const cols = 5;
    const buttonW = 80;
    const buttonH = 60;
    const startX = (VIEW_W - cols * (buttonW + 10)) / 2;
    const startY = 120;
    
    for (let level = 1; level <= 20; level++) {
      const col = (level - 1) % cols;
      const row = Math.floor((level - 1) / cols);
      const x = startX + col * (buttonW + 10);
      const y = startY + row * (buttonH + 15);
      
      if (canvasX >= x && canvasX <= x + buttonW && canvasY >= y && canvasY <= y + buttonH) {
        // Level clicked
        switchLevel(level);
        showLevelMenu = false;
        return true;
      }
    }
    
    return false;
  }

  let last = performance.now();
  // Level-specific enemy configurations with different dragon types
  const levelEnemies = {
    1: [
      { x: 600, y: (tiles.rows - 10) * Tiles.TILE_SIZE, speed: 90, range: 800, type: 'gronckle' },
      { x: 1300, y: (tiles.rows - 12) * Tiles.TILE_SIZE, speed: 120, range: 1000, type: 'viking' },
      { x: 2200, y: (tiles.rows - 14) * Tiles.TILE_SIZE, speed: 80, range: 900, type: 'zippleback' },
    ],
    2: [
      { x: 600, y: (tiles.rows - 14) * Tiles.TILE_SIZE, speed: 110, range: 600, type: 'gronckle' },   // easier access
      { x: 1200, y: (tiles.rows - 16) * Tiles.TILE_SIZE, speed: 100, range: 800, type: 'viking' },   // ground viking
      { x: 1800, y: (tiles.rows - 12) * Tiles.TILE_SIZE, speed: 120, range: 500, type: 'zippleback' }, // before castle
    ],
    3: [
      { x: 800, y: (tiles.rows - 18) * Tiles.TILE_SIZE, speed: 80, range: 600, type: 'nightmare' },   // cave fire dragon
      { x: 1400, y: (tiles.rows - 20) * Tiles.TILE_SIZE, speed: 90, range: 700, type: 'gronckle' },   // cave dweller
      { x: 2000, y: (tiles.rows - 16) * Tiles.TILE_SIZE, speed: 110, range: 500, type: 'zippleback' }, // cave guardian
    ],
    4: [
      { x: 800, y: (tiles.rows - 15) * Tiles.TILE_SIZE, speed: 120, range: 800, type: 'viking' },     // berk warrior
      { x: 1400, y: (tiles.rows - 22) * Tiles.TILE_SIZE, speed: 100, range: 600, type: 'nadder' },    // flying guard
      { x: 2000, y: (tiles.rows - 18) * Tiles.TILE_SIZE, speed: 140, range: 700, type: 'nightmare' }, // castle guard
      { x: 2600, y: (tiles.rows - 12) * Tiles.TILE_SIZE, speed: 80, range: 400, type: 'gronckle' },   // final guardian
    ],
    5: [
      { x: 600, y: (tiles.rows - 14) * Tiles.TILE_SIZE, speed: 60, range: 600, type: 'nadder' },      // ice flyer
      { x: 1200, y: (tiles.rows - 18) * Tiles.TILE_SIZE, speed: 80, range: 700, type: 'gronckle' },   // ice crawler
      { x: 1800, y: (tiles.rows - 16) * Tiles.TILE_SIZE, speed: 90, range: 500, type: 'zippleback' }, // ice guardian
    ],
    6: [
      { x: 800, y: (tiles.rows - 17) * Tiles.TILE_SIZE, speed: 110, range: 600, type: 'nightmare' },  // lava dragon
      { x: 1400, y: (tiles.rows - 22) * Tiles.TILE_SIZE, speed: 120, range: 800, type: 'nightmare' }, // fire flyer
      { x: 2200, y: (tiles.rows - 16) * Tiles.TILE_SIZE, speed: 100, range: 500, type: 'gronckle' },  // lava walker
    ],
    7: [
      { x: 1000, y: (tiles.rows - 22) * Tiles.TILE_SIZE, speed: 90, range: 800, type: 'nadder' },     // sky patrol
      { x: 1800, y: (tiles.rows - 30) * Tiles.TILE_SIZE, speed: 110, range: 600, type: 'nadder' },   // high flyer
      { x: 2600, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 95, range: 700, type: 'nightmare' }, // sky guardian
    ],
    8: [
      { x: 1200, y: (tiles.rows - 18) * Tiles.TILE_SIZE, speed: 130, range: 700, type: 'nightmare' }, // storm dragon
      { x: 2000, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 100, range: 600, type: 'nadder' },   // lightning flyer
      { x: 2800, y: (tiles.rows - 22) * Tiles.TILE_SIZE, speed: 120, range: 500, type: 'zippleback' }, // storm guardian
    ],
    9: [
      { x: 1000, y: (tiles.rows - 20) * Tiles.TILE_SIZE, speed: 80, range: 800, type: 'nightmare' },  // night hunter
      { x: 1800, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 90, range: 600, type: 'nadder' },    // night flyer
      { x: 2600, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 110, range: 700, type: 'zippleback' }, // shadow guardian
      { x: 3200, y: (tiles.rows - 18) * Tiles.TILE_SIZE, speed: 100, range: 400, type: 'viking' },   // night warrior
    ],
    10: [
      { x: 1200, y: (tiles.rows - 22) * Tiles.TILE_SIZE, speed: 140, range: 600, type: 'nightmare' }, // castle fire dragon
      { x: 2000, y: (tiles.rows - 30) * Tiles.TILE_SIZE, speed: 120, range: 800, type: 'nadder' },   // castle flyer
      { x: 2800, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 130, range: 500, type: 'nightmare' }, // tower guardian
      { x: 3400, y: (tiles.rows - 20) * Tiles.TILE_SIZE, speed: 110, range: 400, type: 'viking' },   // final boss area
      { x: 3600, y: (tiles.rows - 14) * Tiles.TILE_SIZE, speed: 150, range: 300, type: 'zippleback' }, // final guardian
    ],
    11: [
      { x: 800, y: (tiles.rows - 18) * Tiles.TILE_SIZE, speed: 100, range: 600, type: 'nadder' },     // space patrol
      { x: 1400, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 90, range: 700, type: 'nightmare' },  // asteroid guardian
      { x: 2200, y: (tiles.rows - 20) * Tiles.TILE_SIZE, speed: 110, range: 500, type: 'nadder' },    // space flyer
      { x: 2800, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 120, range: 600, type: 'zippleback' }, // space hunter
    ],
    12: [
      { x: 900, y: (tiles.rows - 22) * Tiles.TILE_SIZE, speed: 80, range: 600, type: 'gronckle' },    // crystal crawler
      { x: 1500, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 100, range: 700, type: 'nadder' },   // crystal flyer
      { x: 2100, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 90, range: 500, type: 'nightmare' }, // crystal guardian
      { x: 2700, y: (tiles.rows - 28) * Tiles.TILE_SIZE, speed: 110, range: 600, type: 'zippleback' }, // crystal hunter
    ],
    13: [
      { x: 1000, y: (tiles.rows - 20) * Tiles.TILE_SIZE, speed: 70, range: 800, type: 'zippleback' }, // underwater lurker
      { x: 1600, y: (tiles.rows - 28) * Tiles.TILE_SIZE, speed: 90, range: 600, type: 'nadder' },    // water flyer
      { x: 2200, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 100, range: 700, type: 'nightmare' }, // deep guardian
      { x: 2900, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 85, range: 500, type: 'gronckle' },  // ruin walker
    ],
    14: [
      { x: 1100, y: (tiles.rows - 17) * Tiles.TILE_SIZE, speed: 120, range: 700, type: 'nightmare' }, // desert fire
      { x: 1700, y: (tiles.rows - 23) * Tiles.TILE_SIZE, speed: 100, range: 600, type: 'nadder' },   // sand flyer
      { x: 2300, y: (tiles.rows - 25) * Tiles.TILE_SIZE, speed: 90, range: 800, type: 'zippleback' }, // temple guardian
      { x: 3000, y: (tiles.rows - 20) * Tiles.TILE_SIZE, speed: 110, range: 500, type: 'viking' },   // desert warrior
    ],
    15: [
      { x: 1200, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 130, range: 600, type: 'nightmare' }, // fortress dragon
      { x: 1800, y: (tiles.rows - 30) * Tiles.TILE_SIZE, speed: 110, range: 700, type: 'nadder' },   // high patrol
      { x: 2400, y: (tiles.rows - 28) * Tiles.TILE_SIZE, speed: 120, range: 500, type: 'zippleback' }, // fortress guard
      { x: 3000, y: (tiles.rows - 22) * Tiles.TILE_SIZE, speed: 100, range: 600, type: 'viking' },   // fortress soldier
      { x: 3300, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 140, range: 400, type: 'nightmare' }, // elite guard
    ],
    16: [
      { x: 1000, y: (tiles.rows - 18) * Tiles.TILE_SIZE, speed: 140, range: 700, type: 'nightmare' }, // advanced enemy 1
      { x: 1700, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 120, range: 600, type: 'nadder' },   // advanced enemy 2
      { x: 2400, y: (tiles.rows - 22) * Tiles.TILE_SIZE, speed: 130, range: 800, type: 'zippleback' }, // advanced enemy 3
      { x: 3100, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 110, range: 500, type: 'viking' },   // advanced enemy 4
    ],
    17: [
      { x: 1100, y: (tiles.rows - 20) * Tiles.TILE_SIZE, speed: 150, range: 600, type: 'nightmare' }, // elite dragon
      { x: 1800, y: (tiles.rows - 28) * Tiles.TILE_SIZE, speed: 130, range: 700, type: 'nadder' },   // elite flyer
      { x: 2500, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 140, range: 500, type: 'zippleback' }, // elite guard
      { x: 3200, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 120, range: 600, type: 'viking' },   // elite warrior
    ],
    18: [
      { x: 1200, y: (tiles.rows - 22) * Tiles.TILE_SIZE, speed: 160, range: 800, type: 'nightmare' }, // master dragon
      { x: 1900, y: (tiles.rows - 30) * Tiles.TILE_SIZE, speed: 140, range: 600, type: 'nadder' },   // master flyer
      { x: 2600, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 150, range: 700, type: 'zippleback' }, // master guard
      { x: 3300, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 130, range: 500, type: 'viking' },   // master warrior
      { x: 3600, y: (tiles.rows - 28) * Tiles.TILE_SIZE, speed: 170, range: 400, type: 'nightmare' }, // master elite
    ],
    19: [
      { x: 1300, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 180, range: 700, type: 'nightmare' }, // legendary dragon
      { x: 2000, y: (tiles.rows - 32) * Tiles.TILE_SIZE, speed: 160, range: 600, type: 'nadder' },   // legendary flyer
      { x: 2700, y: (tiles.rows - 28) * Tiles.TILE_SIZE, speed: 170, range: 800, type: 'zippleback' }, // legendary guard
      { x: 3400, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 150, range: 500, type: 'viking' },   // legendary warrior
      { x: 3700, y: (tiles.rows - 30) * Tiles.TILE_SIZE, speed: 190, range: 400, type: 'nightmare' }, // legendary boss
    ],
    20: [
      { x: 1500, y: (tiles.rows - 26) * Tiles.TILE_SIZE, speed: 200, range: 800, type: 'nightmare' }, // final boss dragon 1
      { x: 2200, y: (tiles.rows - 34) * Tiles.TILE_SIZE, speed: 180, range: 600, type: 'nadder' },   // final boss flyer 1
      { x: 2900, y: (tiles.rows - 30) * Tiles.TILE_SIZE, speed: 190, range: 700, type: 'zippleback' }, // final boss guard 1
      { x: 3600, y: (tiles.rows - 28) * Tiles.TILE_SIZE, speed: 170, range: 500, type: 'viking' },   // final boss warrior
      { x: 4000, y: (tiles.rows - 32) * Tiles.TILE_SIZE, speed: 210, range: 400, type: 'nightmare' }, // final boss dragon 2
      { x: 4200, y: (tiles.rows - 24) * Tiles.TILE_SIZE, speed: 160, range: 600, type: 'nadder' },   // final boss flyer 2
    ]
  };
  
  let enemies = [];
  
  function resetEnemies() {
    const spawns = levelEnemies[currentLevel] || [];
    enemies = spawns.map(spawn => 
      Enemies.createEnemy(spawn.x, spawn.y, { 
        speed: spawn.speed, 
        range: spawn.range, 
        type: spawn.type || 'gronckle' 
      })
    );
  }
  resetEnemies();
  createLevelCollectibles();
  
  // Add click listener for level menu
  canvas.addEventListener('click', handleLevelMenuClick);

  function drawEnemies() {
    for (const e of enemies) {
      if (!e.alive) continue;
      if (Assets.hasImage('enemy')) {
        ctx.save();
        ctx.translate(-cam.x, -cam.y);
        ctx.drawImage(Assets.images['enemy'], e.x, e.y, e.w, e.h);
        ctx.restore();
      } else {
        // Use detailed enemy sprites
        Enemies.drawEnemySprite(ctx, e, cam.x, cam.y);
      }
    }
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      Enemies.updateEnemy(e, dt, tiles);
      
      // Check if enemies hit spikes
      if (e.alive && tiles.spikes) {
        const size = Tiles.TILE_SIZE;
        for (const s of tiles.spikes) {
          const spikeRect = { x: s.x * size, y: s.y * size, w: size, h: size };
          if (Enemies.aabb(e, spikeRect)) {
            e.alive = false;
            Assets.play('hit');
            
            // Create death particles for enemy
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2;
              trickParticles.push({
                x: e.x + e.w/2,
                y: e.y + e.h/2,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100 - 50,
                life: 1.0,
                color: e.color || '#666',
                size: 3
              });
            }
            break;
          }
        }
      }
    }
  }

  function playerEnemyInteractions() {
    for (const e of enemies) {
      if (!e.alive) continue;
      if (!Enemies.aabb(player, e)) continue;
      // Determine if stomping (player falling and feet above enemy top)
      const playerBottom = player.y + player.h;
      const enemyTop = e.y;
      const verticalOverlap = playerBottom - enemyTop;
      const isStomp = player.vy > 120 && verticalOverlap > 0 && verticalOverlap < player.h;
      if (isStomp) {
        e.alive = false;
        player.vy = -player.jumpSpeed * 0.6;
        Assets.play('stomp');
      } else {
        // Damage: reset everything like spikes
        if (player.invuln <= 0) {
          const spawn = currentLevelData.spawnPoint();
          player.x = spawn.x; player.y = spawn.y; player.vx = 0; player.vy = 0; player.invuln = 0;
          player.stuckTimer = 0;
          player.fireAmmo = 1; // restore initial ammo
          player.flyTime = 0; // restore flight
          fireballs = []; // clear all fireballs
          resetEnemies();
          createLevelCollectibles(); // respawn all collectibles
          Assets.play('hit');
        }
      }
    }
  }

  function playerHazardInteractions() {
    if (!tiles.spikes) return;
    const size = Tiles.TILE_SIZE;
    for (const s of tiles.spikes) {
      const spikeRect = { x: s.x * size, y: s.y * size, w: size, h: size };
      if (Enemies.aabb(player, spikeRect)) {
        // Reset everything when hit by spikes
        const spawn = currentLevelData.spawnPoint();
        player.x = spawn.x; player.y = spawn.y; player.vx = 0; player.vy = 0; player.invuln = 0;
        player.stuckTimer = 0;
        player.fireAmmo = 1; // restore initial ammo
        player.flyTime = 0; // restore flight
        fireballs = []; // clear all fireballs
        resetEnemies();
        createLevelCollectibles(); // respawn all collectibles
        Assets.play('hit');
        break;
      }
    }
  }

  function switchLevel(newLevel) {
    currentLevel = newLevel;
    switch(newLevel) {
      case 1: currentLevelData = Level1; break;
      case 2: currentLevelData = Level2; break;
      case 3: currentLevelData = Level3; break;
      case 4: currentLevelData = Level4; break;
      case 5: currentLevelData = Level5; break;
      case 6: currentLevelData = Level6; break;
      case 7: currentLevelData = Level7; break;
      case 8: currentLevelData = Level8; break;
      case 9: currentLevelData = Level9; break;
      case 10: currentLevelData = Level10; break;
      case 11: currentLevelData = Level11; break;
      case 12: currentLevelData = Level12; break;
      case 13: currentLevelData = Level13; break;
      case 14: currentLevelData = Level14; break;
      case 15: currentLevelData = Level15; break;
      case 16: currentLevelData = Level16; break;
      case 17: currentLevelData = Level17; break;
      case 18: currentLevelData = Level18; break;
      case 19: currentLevelData = Level19; break;
      case 20: currentLevelData = Level20; break;
      default: currentLevelData = Level1; currentLevel = 1;
    }
    tiles = currentLevelData.tiles;
    window.currentTiles = tiles; // update global reference
    const spawn = currentLevelData.spawnPoint();
    player.x = spawn.x; player.y = spawn.y; player.vx = 0; player.vy = 0; player.invuln = 0;
    resetEnemies();
    createLevelCollectibles();
  }
  
  function createLevelCollectibles() {
    collectibles = [];
    const size = Tiles.TILE_SIZE;
    
    if (currentLevel === 1) {
      // Level 1 collectibles - más accesibles
      collectibles.push(createCollectible(3 * size, (tiles.rows - 10) * size, 'plasma')); // cerca del spawn
      collectibles.push(createCollectible(12 * size, (tiles.rows - 14) * size, 'plasma')); // en primera plataforma
      collectibles.push(createCollectible(30 * size, (tiles.rows - 12) * size, 'plasma')); // segunda plataforma
      collectibles.push(createCollectible(65 * size, (tiles.rows - 10) * size, 'plasma')); // tercera plataforma
      collectibles.push(createCollectible(75 * size, (tiles.rows - 16) * size, 'plasma')); // cuarta plataforma
      collectibles.push(createCollectible(50 * size, (tiles.rows - 10) * size, 'plasma')); // en el suelo
    } else if (currentLevel === 2) {
      // Level 2 collectibles - más accesibles
      collectibles.push(createCollectible(3 * size, (tiles.rows - 10) * size, 'plasma')); // spawn
      collectibles.push(createCollectible(15 * size, (tiles.rows - 14) * size, 'plasma')); // primera plataforma
      collectibles.push(createCollectible(42 * size, (tiles.rows - 16) * size, 'plasma')); // segunda plataforma
      collectibles.push(createCollectible(77 * size, (tiles.rows - 18) * size, 'plasma')); // tercera plataforma
      collectibles.push(createCollectible(115 * size, (tiles.rows - 20) * size, 'plasma')); // cuarta plataforma
      collectibles.push(createCollectible(155 * size, (tiles.rows - 22) * size, 'plasma')); // quinta plataforma
      collectibles.push(createCollectible(197 * size, (tiles.rows - 18) * size, 'plasma')); // sexta plataforma
      collectibles.push(createCollectible(237 * size, (tiles.rows - 14) * size, 'plasma')); // séptima plataforma
      collectibles.push(createCollectible(255 * size, (tiles.rows - 12) * size, 'plasma')); // cerca del castillo
    } else if (currentLevel === 3) {
      // Level 3 collectibles - cave theme
      collectibles.push(createCollectible(3 * size, (tiles.rows - 10) * size, 'plasma')); // spawn
      collectibles.push(createCollectible(22 * size, (tiles.rows - 17) * size, 'plasma')); // first cave platform
      collectibles.push(createCollectible(55 * size, (tiles.rows - 22) * size, 'plasma')); // high cave platform
      collectibles.push(createCollectible(90 * size, (tiles.rows - 18) * size, 'plasma')); // third platform
      collectibles.push(createCollectible(130 * size, (tiles.rows - 24) * size, 'plasma')); // highest cave
      collectibles.push(createCollectible(170 * size, (tiles.rows - 20) * size, 'plasma')); // fifth platform
      collectibles.push(createCollectible(210 * size, (tiles.rows - 16) * size, 'plasma')); // sixth platform
      collectibles.push(createCollectible(250 * size, (tiles.rows - 14) * size, 'plasma')); // cave exit
    } else if (currentLevel === 4) {
      // Level 4 collectibles - Berk village theme
      collectibles.push(createCollectible(3 * size, (tiles.rows - 10) * size, 'plasma')); // spawn
      collectibles.push(createCollectible(27 * size, (tiles.rows - 20) * size, 'plasma')); // house 1 roof
      collectibles.push(createCollectible(60 * size, (tiles.rows - 28) * size, 'plasma')); // house 2 roof
      collectibles.push(createCollectible(100 * size, (tiles.rows - 22) * size, 'plasma')); // house 3 roof
      collectibles.push(createCollectible(140 * size, (tiles.rows - 17) * size, 'plasma')); // bridge
      collectibles.push(createCollectible(180 * size, (tiles.rows - 20) * size, 'plasma')); // second bridge
      collectibles.push(createCollectible(220 * size, (tiles.rows - 24) * size, 'plasma')); // third bridge
      collectibles.push(createCollectible(260 * size, (tiles.rows - 14) * size, 'plasma')); // castle approach
      collectibles.push(createCollectible(295 * size, (tiles.rows - 27) * size, 'plasma')); // castle tower
    } else if (currentLevel === 5) {
      // Level 5 - Ice world
      for (let i = 0; i < 8; i++) {
        const x = (30 + i * 35) * size;
        const y = (tiles.rows - 14 - i % 3 * 2) * size;
        collectibles.push(createCollectible(x, y, 'plasma'));
      }
    } else if (currentLevel === 6) {
      // Level 6 - Volcano world
      for (let i = 0; i < 9; i++) {
        const x = (40 + i * 35) * size;
        const y = (tiles.rows - 16 - i % 4 * 2) * size;
        collectibles.push(createCollectible(x, y, 'plasma'));
      }
    } else if (currentLevel === 7) {
      // Level 7 - Sky islands
      for (let i = 0; i < 10; i++) {
        const x = (50 + i * 35) * size;
        const y = (tiles.rows - 18 - i % 5 * 3) * size;
        collectibles.push(createCollectible(x, y, 'plasma'));
      }
    } else if (currentLevel === 8) {
      // Level 8 - Storm clouds
      for (let i = 0; i < 11; i++) {
        const x = (40 + i * 35) * size;
        const y = (tiles.rows - 16 - i % 4 * 3) * size;
        collectibles.push(createCollectible(x, y, 'plasma'));
      }
    } else if (currentLevel === 9) {
      // Level 9 - Night flight
      for (let i = 0; i < 12; i++) {
        const x = (50 + i * 35) * size;
        const y = (tiles.rows - 18 - i % 5 * 3) * size;
        collectibles.push(createCollectible(x, y, 'plasma'));
      }
    } else if (currentLevel === 10) {
      // Level 10 - Final castle (más orbes para el jefe final)
      for (let i = 0; i < 15; i++) {
        const x = (50 + i * 25) * size;
        const y = (tiles.rows - 16 - i % 6 * 3) * size;
        collectibles.push(createCollectible(x, y, 'plasma'));
      }
    } else if (currentLevel >= 11 && currentLevel <= 20) {
      // Levels 11-20 - progressive difficulty with more orbs
      const orbCount = 8 + currentLevel - 11; // 8-17 orbs
      for (let i = 0; i < orbCount; i++) {
        const x = (40 + i * 30) * size;
        const y = (tiles.rows - 14 - i % 6 * 3) * size;
        collectibles.push(createCollectible(x, y, 'plasma'));
      }
    }
  }

  function checkLevelGoals() {
    if (gameComplete) return;
    
    const worldW = tiles.cols * Tiles.TILE_SIZE;
    
    if (currentLevel >= 1 && currentLevel <= 19) {
      // Levels 1-19: reach right edge to advance
      if (player.x + player.w >= worldW - 100) {
        switchLevel(currentLevel + 1);
      }
    } else if (currentLevel === 20) {
      // Level 20: reach final castle to complete game
      if (currentLevelData.getCastleGoal) {
        const goal = currentLevelData.getCastleGoal();
        if (Enemies.aabb(player, goal)) {
          gameComplete = true;
        }
      }
    }
  }

  function drawCastle() {
    if (currentLevel !== 20) return;
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    const goal = currentLevelData.getCastleGoal();
    
    // Draw castle structure more visibly
    ctx.fillStyle = '#8d6e63'; // brown castle walls
    ctx.fillRect(goal.x - 20, goal.y - 30, goal.w + 40, goal.h + 30);
    
    // Castle towers
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(goal.x - 15, goal.y - 45, 10, 15);
    ctx.fillRect(goal.x + goal.w + 5, goal.y - 45, 10, 15);
    
    // Castle gate
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(goal.x, goal.y + 10, goal.w, goal.h - 10);
    
    // Draw castle flag/banner
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(goal.x + goal.w/2 - 2, goal.y - 50, 4, 25);
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(goal.x + goal.w/2 + 2, goal.y - 40, 15, 10);
    
    // Draw goal indicator - always visible pulsing effect
    const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.4})`;
    ctx.fillRect(goal.x - 10, goal.y - 10, goal.w + 20, goal.h + 20);
    
    // Victory text above castle
    ctx.fillStyle = '#ffeb3b';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('¡META!', goal.x + goal.w/2, goal.y - 55);
    ctx.textAlign = 'left';
    
    ctx.restore();
  }

  function drawUI() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 10, 250, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(`Nivel ${currentLevel}`, 20, 30);
    
    // Fire ammo display
    ctx.fillStyle = '#ff5722';
    ctx.fillText(`🔥 Fuego: ${player.fireAmmo}/${player.maxFireAmmo}`, 20, 50);
    
    // Flight meter
    const flyPercent = Math.max(0, (player.maxFlyTime - player.flyTime) / player.maxFlyTime);
    ctx.fillStyle = '#2196f3';
    ctx.fillText(`✈️ Vuelo: ${Math.round(flyPercent * 100)}%`, 20, 70);
    
    if (gameComplete) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = '#ffeb3b';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('¡FELICIDADES!', VIEW_W/2, VIEW_H/2 - 20);
      ctx.fillText('¡Llegaste al castillo!', VIEW_W/2, VIEW_H/2 + 20);
      ctx.font = '16px Arial';
      ctx.fillText('Presiona R para jugar de nuevo', VIEW_W/2, VIEW_H/2 + 50);
      ctx.textAlign = 'left';
    }
    
    ctx.restore();
  }
  function frame(now) {
    const dt = Math.min(1/30, (now - last) / 1000);
    last = now;

    handleInput(dt);
    // variable jump height: if jump is released while ascending, add extra gravity
    if (!Input.isDown('jump') && player.vy < 0) {
      player.vy += Physics.GRAVITY * 1.2 * dt;
    }
    // coyote/jump buffer - use run jump if flagged
    if (player.jumpBuffer > 0 && (player.onGround || player.coyote > 0)) {
      const jumpPower = player.isRunJump ? player.runJumpSpeed : player.jumpSpeed;
      player.vy = -jumpPower;
      Assets.play('jump');
      player.jumpBuffer = 0;
      player.coyote = 0;
      player.isRunJump = false; // reset flag
    }
    // Track fall time for high-speed collision detection
    if (player.vy > 100 && !player.onGround) {
      player.fallTime += dt;
      
      // Predictive ground detection for fast falls
      if (player.vy > 600) {
        const lookAhead = 64; // look 2 tiles ahead
        const futureY = player.y + lookAhead;
        const groundCheckRect = { x: player.x, y: futureY, w: player.w, h: 4 };
        const groundHits = Tiles.rectVsTiles(groundCheckRect, tiles);
        
        if (groundHits.length > 0) {
          // Ground detected ahead - start slowing down
          player.vy *= 0.95; // gradual slowdown
        }
      }
    } else {
      player.fallTime = 0;
    }
    
    Physics.applyGravity(player, dt);
    
    // Predictive collision system for large jumps/falls
    const oldX = player.x, oldY = player.y;
    const predictedX = player.x + player.vx * dt;
    const predictedY = player.y + player.vy * dt;
    const moveDistance = Math.sqrt((predictedX - oldX)**2 + (predictedY - oldY)**2);
    
    // For large movements, use trajectory prediction
    if (moveDistance > 24) { // moving more than 3/4 of a tile
      // Sample multiple points along the trajectory
      const samples = Math.ceil(moveDistance / 8); // sample every 8px
      let collisionFound = false;
      let safeX = player.x, safeY = player.y;
      
      for (let i = 1; i <= samples; i++) {
        const t = i / samples;
        const sampleX = oldX + (predictedX - oldX) * t;
        const sampleY = oldY + (predictedY - oldY) * t;
        const sampleRect = { x: sampleX, y: sampleY, w: player.w, h: player.h };
        const sampleHits = Tiles.rectVsTiles(sampleRect, tiles);
        
        if (sampleHits.length > 0) {
          // Collision found - stop at previous safe position
          player.x = safeX;
          player.y = safeY;
          collisionFound = true;
          break;
        }
        safeX = sampleX;
        safeY = sampleY;
      }
      
      if (!collisionFound) {
        // No collision predicted - safe to move to final position
        player.x = predictedX;
        player.y = predictedY;
      }
    } else {
      // Small movement - use normal integration
      Physics.integrate(player, dt);
    }
    
    // Always resolve any remaining collisions
    let { onGround } = Physics.resolveTileCollisions(player, tiles);
    
    // Double-check for any remaining penetration
    const finalRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    const finalHits = Tiles.rectVsTiles(finalRect, tiles);
    if (finalHits.length > 0) {
      // Force resolve any remaining collision
      const { onGround: finalGround } = Physics.resolveTileCollisions(player, tiles);
      onGround = onGround || finalGround;
    }
    
    player.onGround = onGround;
    
    player.wasOnGround = player.onGround;
    // update coyote and jump buffer timers
    if (player.onGround) player.coyote = 0.12; else player.coyote = Math.max(0, player.coyote - dt);
    if (player.jumpBuffer > 0) player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    updateEnemies(dt);
    updateCollectibles(dt);
    updateFireballs(dt);
    updateTricks(dt);
    updateTrickParticles(dt);
    
    // Subtle head movement during normal gameplay
    if (!player.currentTrick) {
      if (player.onGround && Math.abs(player.vx) > 50) {
        // Walking head bob - subtle
        player.headBob = Math.sin(Date.now() * 0.01) * 1;
        player.headTilt = Math.sin(Date.now() * 0.008) * 2;
        player.headX = 0;
        player.headY = 0;
        player.headVisible = true;
      } else {
        // Gradually return to neutral
        player.headBob *= 0.95;
        player.headTilt *= 0.95;
        player.headX *= 0.95;
        player.headY *= 0.95;
        player.headVisible = true;
      }
    }
    playerEnemyInteractions();
    playerHazardInteractions();
    checkLevelGoals();
    
    // Anti-stuck system - super aggressive
    const isStuck = Math.abs(player.x - player.lastX) < 1 && (Math.abs(player.vx) > 10 || Input.isDown('left') || Input.isDown('right'));
    
    if (isStuck) {
      player.stuckTimer += dt;
      if (player.stuckTimer > 0.2) { // very quick activation
        // Extremely aggressive unstuck
        const power = currentLevel === 3 ? 3.0 : 2.0; // extra power in caves
        player.y -= 40 * power; // much higher jump
        player.x += player.facing * 50 * power; // much further push
        player.vy = -800 * power; // powerful upward thrust
        player.vx = player.facing * 400 * power; // strong horizontal push
        player.stuckTimer = 0;
        player.fallTime = 0;
        
        // Clear any lingering collision state
        player.onGround = false;
        
        // Create dramatic unstuck effect
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          trickParticles.push({
            x: player.x + player.w/2,
            y: player.y + player.h/2,
            vx: Math.cos(angle) * 200,
            vy: Math.sin(angle) * 200,
            life: 1.2,
            color: '#ff9800',
            size: 4
          });
        }
        Assets.play('jump');
      }
    } else {
      player.stuckTimer = 0;
    }
    player.lastX = player.x;
    
    // Kill plane: if fallen beyond world
    const worldH = tiles.rows * Tiles.TILE_SIZE;
    if (player.y > worldH + 200) {
      // Reset everything when falling off world
      const spawn = currentLevelData.spawnPoint();
      player.x = spawn.x; player.y = spawn.y; player.vx = 0; player.vy = 0; player.invuln = 0;
      player.stuckTimer = 0;
      player.fireAmmo = 3; // restore initial ammo
      player.flyTime = 0; // restore flight
      fireballs = []; // clear all fireballs
      resetEnemies();
      createLevelCollectibles(); // respawn all collectibles
    }
    if (player.invuln > 0) player.invuln -= dt;
    cam.follow(player.x + player.w / 2, player.y + player.h / 2);

    drawBackground();
    drawTiles();
    drawCastle();
    drawCollectibles();
    drawEnemies();
    drawFireballs();
    drawTrickParticles();
    drawPlayer();
    drawUI();
    drawLevelMenu();

    Input.endFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();


