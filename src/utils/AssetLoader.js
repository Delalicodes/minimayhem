const assets = {
  stickman_red: '/images/stickman_red.png',
  stickman_green: '/images/stickman_green.png',
  stickman_blue: '/images/stickman_blue.png',
  stickman_orange: '/images/stickman_orange.png',
  hot_potato: '/images/hot_potato.png',
  explosion: '/images/explosion_effect.png',
};

const images = {};
let loaded = 0;
const total = Object.keys(assets).length;

export function loadAssets(onComplete) {
  for (const [key, src] of Object.entries(assets)) {
    const img = new Image();
    img.onload = () => {
      loaded++;
      images[key] = img;
      if (loaded === total && onComplete) {
        onComplete();
      }
    };
    img.onerror = () => {
      console.warn(`Failed to load asset: ${src}`);
      loaded++; // avoid getting stuck
      if (loaded === total && onComplete) onComplete();
    };
    img.src = src;
  }
}

export function getImage(key) {
  return images[key] || null;
}
