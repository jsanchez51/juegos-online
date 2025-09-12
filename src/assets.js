(() => {
  const images = Object.create(null);
  const audio = Object.create(null);

  function loadImage(name, src) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    images[name] = img;
    img.onerror = () => { /* ignore missing asset */ };
    return img;
  }

  function hasImage(name) {
    const img = images[name];
    return !!(img && img.complete && img.naturalWidth > 0);
  }

  function loadAudio(name, src, { volume = 1 } = {}) {
    const el = new Audio();
    el.src = src;
    el.preload = 'auto';
    el.volume = volume;
    audio[name] = el;
    el.onerror = () => { /* ignore missing asset */ };
    return el;
  }

  function play(name) {
    const el = audio[name];
    if (!el) return;
    try {
      el.currentTime = 0;
      el.play().catch(() => {});
    } catch (_) {}
  }

  window.Assets = {
    images,
    audio,
    loadImage,
    hasImage,
    loadAudio,
    play,
  };
})();


