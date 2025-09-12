(() => {
  // Mobile touch controls
  let touchControls = {
    left: false,
    right: false,
    jump: false,
    run: false,
    fly: false,
    fire: false,
    reset: false,
    teleport: false,
    trick1: false,
    roar: false,
    dance: false,
    multijump: false,
    unstuck: false,
    superjump: false,
    menu: false
  };

  // Map touch controls to input actions
  function getTouchInput(action) {
    switch(action) {
      case 'left': return touchControls.left;
      case 'right': return touchControls.right;
      case 'jump': return touchControls.jump;
      case 'run': return touchControls.run;
      case 'fly': return touchControls.fly;
      case 'fire': return touchControls.fire;
      case 'reset': return touchControls.reset;
      case 'teleport': return touchControls.teleport;
      case 'trick1': return touchControls.trick1;
      case 'roar': return touchControls.roar;
      case 'dance': return touchControls.dance;
      case 'multijump': return touchControls.multijump;
      case 'unstuck': return touchControls.unstuck;
      case 'superjump': return touchControls.superjump;
      case 'menu': return touchControls.menu;
      default: return false;
    }
  }

  // Button event handlers
  function setupTouchButton(id, action, isToggle = false) {
    const btn = document.getElementById(id);
    if (!btn) return;

    let justPressed = false;

    const startTouch = (e) => {
      e.preventDefault();
      touchControls[action] = true;
      if (isToggle) justPressed = true;
      btn.classList.add('active');
    };

    const endTouch = (e) => {
      e.preventDefault();
      if (!isToggle) {
        touchControls[action] = false;
      } else if (justPressed) {
        // For toggle buttons, turn off after a short delay
        setTimeout(() => {
          touchControls[action] = false;
          justPressed = false;
        }, 100);
      }
      btn.classList.remove('active');
    };

    // Touch events
    btn.addEventListener('touchstart', startTouch, { passive: false });
    btn.addEventListener('touchend', endTouch, { passive: false });
    btn.addEventListener('touchcancel', endTouch, { passive: false });

    // Mouse events for testing on desktop
    btn.addEventListener('mousedown', startTouch);
    btn.addEventListener('mouseup', endTouch);
    btn.addEventListener('mouseleave', endTouch);
  }

  // Initialize mobile controls when DOM is loaded
  function initMobileControls() {
    // Movement buttons (hold)
    setupTouchButton('btn-left', 'left');
    setupTouchButton('btn-right', 'right');
    setupTouchButton('btn-run', 'run');
    setupTouchButton('btn-fly', 'fly');

    // Action buttons (press)
    setupTouchButton('btn-jump', 'jump', true);
    setupTouchButton('btn-superjump', 'superjump', true);
    setupTouchButton('btn-fire', 'fire', true);
    setupTouchButton('btn-reset', 'reset', true);
    setupTouchButton('btn-teleport', 'teleport', true);
    setupTouchButton('btn-unstuck', 'unstuck', true);
    setupTouchButton('btn-menu', 'menu', true);
    
    // Trick buttons (press)
    setupTouchButton('btn-trick1', 'trick1', true);
    setupTouchButton('btn-roar', 'roar', true);
    setupTouchButton('btn-dance', 'dance', true);
    setupTouchButton('btn-multijump', 'multijump', true);

    // Prevent scrolling on mobile when touching controls
    document.getElementById('mobile-controls').addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  // Extend the existing Input system
  if (window.Input) {
    const originalIsDown = window.Input.isDown;
    const originalPressed = window.Input.pressed;

    window.Input.isDown = function(action) {
      return originalIsDown(action) || getTouchInput(action);
    };

    window.Input.pressed = function(action) {
      return originalPressed(action) || (getTouchInput(action) && !originalIsDown(action));
    };
  }

  // Initialize when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileControls);
  } else {
    initMobileControls();
  }

  // Expose for debugging
  window.MobileControls = {
    touchControls,
    getTouchInput
  };
})();
