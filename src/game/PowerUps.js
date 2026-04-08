import { POWERUP_RADIUS, POWERUP_SPAWN_INTERVAL, POWERUP_FREEZE_DURATION, POWERUP_SPEED_DURATION } from './constants.js';

const TYPES = [
  { id: 'freeze', color: '#00D2FF', icon: '❄', label: 'FREEZE' },
  { id: 'speed', color: '#FFD700', icon: '⚡', label: 'SPEED' },
];

export default class PowerUpManager {
  constructor() {
    this.current = null;
    this.spawnTimer = POWERUP_SPAWN_INTERVAL;
    this.enabled = true;
  }

  reset() {
    this.current = null;
    this.spawnTimer = POWERUP_SPAWN_INTERVAL / 2; // first one comes quicker
  }

  update(dt, arenaWidth, arenaHeight, arenaPadding) {
    if (!this.enabled) return;

    this.spawnTimer -= dt * 1000;
    if (this.spawnTimer <= 0 && !this.current) {
      this.spawn(arenaWidth, arenaHeight, arenaPadding);
      this.spawnTimer = POWERUP_SPAWN_INTERVAL + Math.random() * 4000;
    }

    if (this.current) {
      this.current.pulsePhase += dt * 3;
    }
  }

  spawn(arenaWidth, arenaHeight, arenaPadding) {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const pad = arenaPadding + 50;
    this.current = {
      ...type,
      x: pad + Math.random() * (arenaWidth - pad * 2),
      y: pad + Math.random() * (arenaHeight - pad * 2),
      radius: POWERUP_RADIUS,
      active: true,
      pulsePhase: 0,
    };
  }

  collect(player, potato) {
    if (!this.current || !this.current.active) return null;

    const collected = this.current;
    this.current = null;

    if (collected.id === 'freeze') {
      potato.freeze(POWERUP_FREEZE_DURATION);
    } else if (collected.id === 'speed') {
      player.speedBoost = true;
      player.speedBoostTimer = POWERUP_SPEED_DURATION;
    }

    return collected;
  }
}
