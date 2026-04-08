export default class TargetManager {
  constructor() {
    this.targets = [];
    this.spawnTimer = 0;
    this.nextId = 1;
  }

  reset() {
    this.targets = [];
    this.spawnTimer = 0;
  }

  update(dt, w, h, pad) {
    // Spawn new targets
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1.0 + Math.random() * 1.5;
      if (this.targets.length < 8) {
        this._spawn(w, h, pad);
      }
    }

    // Update moving targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (t.isMoving) {
        t.x += t.vx * dt;
        t.y += t.vy * dt;

        // Bounce off walls
        if (t.x < pad + t.radius) { t.x = pad + t.radius; t.vx *= -1; }
        if (t.x > w - pad - t.radius) { t.x = w - pad - t.radius; t.vx *= -1; }
        if (t.y < pad + t.radius) { t.y = pad + t.radius; t.vy *= -1; }
        if (t.y > h - pad - t.radius) { t.y = h - pad - t.radius; t.vy *= -1; }
      }

      t.lifetime -= dt;
      if (t.lifetime <= 0) {
        this.targets.splice(i, 1);
      }
    }
  }

  _spawn(w, h, pad) {
    const rand = Math.random();
    let type = 'standard';
    if (rand < 0.15) type = 'golden';
    else if (rand < 0.4) type = 'moving';

    const isMoving = type !== 'standard';
    const isGolden = type === 'golden';

    this.targets.push({
      id: this.nextId++,
      x: pad + 30 + Math.random() * (w - pad * 2 - 60),
      y: pad + 30 + Math.random() * (h - pad * 2 - 60),
      radius: isGolden ? 12 : (isMoving ? 13 : 17),
      points: isGolden ? 5 : (isMoving ? 3 : 1),
      isMoving,
      isGolden,
      vx: isMoving ? (Math.random() - 0.5) * (isGolden ? 300 : 180) : 0,
      vy: isMoving ? (Math.random() - 0.5) * (isGolden ? 300 : 180) : 0,
      lifetime: isGolden ? 5 : (isMoving ? 7 : 10),
    });
  }

  getNearestTarget(x, y) {
    let nearest = null;
    let minDist = Infinity;
    for (const t of this.targets) {
      const dx = t.x - x;
      const dy = t.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = t;
      }
    }
    return nearest;
  }
}
