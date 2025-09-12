(() => {
  function createCamera(viewW, viewH) {
    return {
      x: 0,
      y: 0,
      w: viewW,
      h: viewH,
      lerp: 0.15,
      follow(targetX, targetY) {
        const targetCamX = targetX - this.w / 2;
        const targetCamY = targetY - this.h / 2;
        this.x += (targetCamX - this.x) * this.lerp;
        this.y += (targetCamY - this.y) * this.lerp;
      }
    };
  }

  window.Camera = { createCamera };
})();


