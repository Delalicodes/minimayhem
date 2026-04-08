import { COLLISION_DISTANCE } from './constants.js';

export function checkCollisions(players, potato, onPass) {
  const holder = players.find(p => p.index === potato.holderIndex && p.isAlive);
  if (!holder) return;

  for (const other of players) {
    if (other.index === holder.index || !other.isAlive || other.immunityTimer > 0) continue;

    const dist = holder.distanceTo(other);
    if (dist < COLLISION_DISTANCE) {
      // Transfer potato
      holder.isHolding = false;
      other.isHolding = true;
      potato.passTo(other.index);

      // Give the person who just passed the potato a brief immunity
      // so they don't instantly get it back if stuck in a corner.
      holder.immunityTimer = 800; // 0.8 seconds of immunity

      // Bump apart slightly
      const dx = other.x - holder.x;
      const dy = other.y - holder.y;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      const pushDist = 8;
      other.x += (dx / mag) * pushDist;
      other.y += (dy / mag) * pushDist;
      holder.x -= (dx / mag) * pushDist;
      holder.y -= (dy / mag) * pushDist;

      if (onPass) onPass(holder, other);
      break; // Only one pass per frame
    }
  }
}

export function checkPowerUpCollision(player, powerUp) {
  if (!powerUp || !powerUp.active || !player.isAlive) return false;
  const dx = player.x - powerUp.x;
  const dy = player.y - powerUp.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < player.radius + powerUp.radius;
}
