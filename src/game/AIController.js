import { AI_SPEED_FACTOR, AI_MISTAKE_CHANCE } from './constants.js';

export default class AIController {
  constructor() {
    this.mistakeTimer = 0;
    this.mistakeDir = { x: 0, y: 0 };
  }

  update(player, allPlayers, potato, dt) {
    if (!player.isAlive) return;

    // Mistake logic: occasionally move in a random direction
    this.mistakeTimer -= dt * 1000;
    if (this.mistakeTimer <= 0) {
      this.mistakeTimer = 300 + Math.random() * 800;
      if (Math.random() < AI_MISTAKE_CHANCE) {
        const angle = Math.random() * Math.PI * 2;
        this.mistakeDir = { x: Math.cos(angle), y: Math.sin(angle) };
        // Apply mistake for a short burst
        player.setDirection(this.mistakeDir.x, this.mistakeDir.y);
        return;
      }
    }

    const alivePlayers = allPlayers.filter(p => p.isAlive && p.index !== player.index);
    if (alivePlayers.length === 0) return;

    if (player.isHolding) {
      // HOLDING: chase nearest other player to pass the potato
      let nearest = null;
      let nearestDist = Infinity;
      for (const other of alivePlayers) {
        if (other.immunityTimer > 0) continue; // Ignore immune players

        const dist = player.distanceTo(other);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = other;
        }
      }

      if (nearest) {
        const dx = nearest.x - player.x;
        const dy = nearest.y - player.y;
        player.setDirection(dx * AI_SPEED_FACTOR, dy * AI_SPEED_FACTOR);
      } else {
        // If everyone else is immune, just run away from the center to cause chaos, or stop
        player.setDirection(0, 0); 
      }
    } else {
      // NOT HOLDING: flee from whoever has the potato
      const holder = allPlayers.find(p => p.isHolding && p.isAlive);
      if (holder) {
        const dx = player.x - holder.x;
        const dy = player.y - holder.y;
        const dist = player.distanceTo(holder);

        if (dist < 150) {
          // Close to holder — run away fast
          player.setDirection(dx * AI_SPEED_FACTOR, dy * AI_SPEED_FACTOR);
        } else if (dist < 250) {
          // Medium distance — move away but less urgently
          player.setDirection(dx * AI_SPEED_FACTOR * 0.6, dy * AI_SPEED_FACTOR * 0.6);
        } else {
          // Far enough — wander a bit
          if (Math.random() < 0.02) {
            const angle = Math.random() * Math.PI * 2;
            player.setDirection(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5);
          }
        }
      } else {
        // No one holding? Wander
        if (Math.random() < 0.03) {
          const angle = Math.random() * Math.PI * 2;
          player.setDirection(Math.cos(angle) * 0.4, Math.sin(angle) * 0.4);
        }
      }
    }
  }
}
