import { PLAYER_RADIUS, PLAYER_SPEED, PLAYER_COLORS, PLAYER_NAMES } from './constants.js';

export default class Player {
  constructor(index, x, y, isHuman = false) {
    this.index = index;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.color = PLAYER_COLORS[index];
    this.name = PLAYER_NAMES[index];
    this.radius = PLAYER_RADIUS;
    this.speed = PLAYER_SPEED;
    this.isHuman = isHuman;
    this.isAlive = true;
    this.isHolding = false;
    this.score = 0;

    // Animation
    this.animFrame = 0;
    this.animSpeed = 0.15;
    this.angle = 0; // rotation angle in radians

    // Power-up & Immunity state
    this.speedBoost = false;
    this.speedBoostTimer = 0;
    this.immunityTimer = 0;
  }

  get currentSpeed() {
    return this.speedBoost ? this.speed * 2 : this.speed;
  }

  update(arenaWidth, arenaHeight, arenaPadding) {
    const spd = this.currentSpeed;
    this.x += this.vx * spd;
    this.y += this.vy * spd;

    // Clamp to arena
    this.x = Math.max(arenaPadding + this.radius, Math.min(arenaWidth - arenaPadding - this.radius, this.x));
    this.y = Math.max(arenaPadding + this.radius, Math.min(arenaHeight - arenaPadding - this.radius, this.y));

    // Animation and Rotation
    if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
      this.animFrame += this.animSpeed;
      // Calculate true angle from velocity
      this.angle = Math.atan2(this.vy, this.vx);
    }

    // Speed boost countdown
    if (this.speedBoost) {
      this.speedBoostTimer -= 16.67;
      if (this.speedBoostTimer <= 0) {
        this.speedBoost = false;
      }
    }
    
    // Immunity countdown
    if (this.immunityTimer > 0) {
      this.immunityTimer -= 16.67;
    }
  }

  setDirection(dx, dy) {
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0.1) {
      this.vx = dx / mag;
      this.vy = dy / mag;
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  }

  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isHolding = false;
    this.isAlive = true;
    this.speedBoost = false;
    this.speedBoostTimer = 0;
    this.immunityTimer = 0;
    this.animFrame = 0;
  }
}
