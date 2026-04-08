import { POTATO_TIMER_MIN, POTATO_TIMER_MAX } from './constants.js';

export default class Potato {
  constructor() {
    this.holderIndex = -1;
    this.timer = 0;
    this.maxTimer = 0;
    this.frozen = false;
    this.frozenTimer = 0;
    this.pulsePhase = 0;
    this.exploded = false;
  }

  startRound(holderIndex) {
    const duration = POTATO_TIMER_MIN + Math.random() * (POTATO_TIMER_MAX - POTATO_TIMER_MIN);
    this.timer = duration;
    this.maxTimer = duration;
    this.holderIndex = holderIndex;
    this.frozen = false;
    this.frozenTimer = 0;
    this.pulsePhase = 0;
    this.exploded = false;
  }

  update(dt) {
    this.pulsePhase += dt * 4;

    if (this.frozen) {
      this.frozenTimer -= dt * 1000;
      if (this.frozenTimer <= 0) {
        this.frozen = false;
      }
      return false;
    }

    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.exploded = true;
      return true; // exploded!
    }
    return false;
  }

  get urgency() {
    if (this.maxTimer <= 0) return 0;
    return 1 - (this.timer / this.maxTimer);
  }

  get pulseSpeed() {
    // Pulse faster as timer runs out
    return 2 + this.urgency * 12;
  }

  get glowIntensity() {
    return 0.3 + this.urgency * 0.7;
  }

  freeze(duration) {
    this.frozen = true;
    this.frozenTimer = duration;
  }

  passTo(newHolderIndex) {
    this.holderIndex = newHolderIndex;
  }
}
