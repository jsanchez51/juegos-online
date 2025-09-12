(() => {
  const pressed = new Set();
  const justPressed = new Set();
  const justReleased = new Set();

  const keymap = new Map([
    ['ArrowLeft', 'left'],
    ['ArrowRight', 'right'],
    ['ArrowUp', 'jump'],
    ['Space', 'jump'],
    ['KeyA', 'left'],
    ['KeyD', 'right'],
    ['KeyW', 'jump'],
    ['KeyR', 'reset'],
    ['ShiftLeft', 'run'],
    ['ShiftRight', 'run'],
    ['KeyT', 'teleport'],
    ['KeyF', 'fly'],
    ['KeyX', 'fire'],
    ['KeyZ', 'trick1'],
    ['KeyC', 'trick2'],
    ['KeyV', 'roar'],
    ['KeyB', 'dance'],
    ['KeyN', 'multijump'],
    ['KeyG', 'unstuck'],
    ['KeyH', 'superjump'],
    ['KeyM', 'menu'],
  ]);

  function handleDown(e) {
    const a = keymap.get(e.code);
    if (!a) return;
    if (!pressed.has(a)) justPressed.add(a);
    pressed.add(a);
  }
  function handleUp(e) {
    const a = keymap.get(e.code);
    if (!a) return;
    pressed.delete(a);
    justReleased.add(a);
  }

  addEventListener('keydown', handleDown);
  addEventListener('keyup', handleUp);

  window.Input = {
    isDown: action => pressed.has(action),
    pressed: action => justPressed.has(action),
    released: action => justReleased.has(action),
    endFrame() {
      justPressed.clear();
      justReleased.clear();
    }
  };
})();


