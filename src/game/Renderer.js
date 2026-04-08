import {
  ARENA_BG, ARENA_GRID_COLOR, ARENA_BORDER_COLOR, ARENA_PADDING,
  POTATO_COLOR, POTATO_GLOW_COLOR, POWERUP_RADIUS,
  EXPLOSION_PARTICLES, FONT_FAMILY, PLAYER_COLORS
} from './constants.js';

export default class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.shakeX = 0;
    this.shakeY = 0;
    this.particles = [];
    this.flashAlpha = 0;
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }

  clear() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    // Background — vibrant colorful gradient (Stickman Party style)
    const bgGrd = ctx.createLinearGradient(0, 0, this.width, this.height);
    bgGrd.addColorStop(0, '#55B8FF');
    bgGrd.addColorStop(1, '#8D52FF');
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, this.width, this.height);

    // Arena floor dimensions
    const ax = ARENA_PADDING;
    const ay = ARENA_PADDING;
    const aw = this.width - ARENA_PADDING * 2;
    const ah = this.height - ARENA_PADDING * 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(ax, ay, aw, ah, 20);
    ctx.clip(); 

    // Base floor color
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ax, ay, aw, ah);

    // Checkered pattern
    const tileSize = 60;
    ctx.fillStyle = '#f0f2f5'; 
    for (let gx = ax; gx < ax + aw; gx += tileSize) {
      for (let gy = ay; gy < ay + ah; gy += tileSize) {
        if ((Math.floor((gx - ax) / tileSize) + Math.floor((gy - ay) / tileSize)) % 2 === 0) {
          ctx.fillRect(gx, gy, tileSize, tileSize);
        }
      }
    }

    // Inner shadow at the top for some depth
    const innerShadowGrd = ctx.createLinearGradient(ax, ay, ax, ay + 30);
    innerShadowGrd.addColorStop(0, 'rgba(0,0,0,0.1)');
    innerShadowGrd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = innerShadowGrd;
    ctx.fillRect(ax, ay, aw, 30);

    ctx.restore();

    // Arena border — chunky white border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.roundRect(ax, ay, aw, ah, 20);
    ctx.stroke();

    // Add shadow to the border
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(ax - 2, ay - 2, aw + 4, ah + 4, 22);
    ctx.stroke();

    // Corner bouncy bumpers (cartoony corner pegs)
    this._drawCornerBumper(ax, ay, '#FF3B30');
    this._drawCornerBumper(ax + aw, ay, '#4CD964');
    this._drawCornerBumper(ax, ay + ah, '#007AFF');
    this._drawCornerBumper(ax + aw, ay + ah, '#FFCC00');

    ctx.restore();
  }

  _drawCornerBumper(x, y, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.stroke();
    // highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ═══════════════════════════════════════════════════════════════
  //  TOP-DOWN STICKMAN PARTY STYLE CHARACTER
  // ═══════════════════════════════════════════════════════════════
  drawPlayer(player, potatoHolderIndex) {
    if (!player.isAlive) {
      this._drawDeadPlayer(player);
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX + player.x, this.shakeY + player.y);

    const { color, animFrame, angle, isHolding, speedBoost } = player;
    const isMoving = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1;

    // ── Speed boost ring ──
    if (speedBoost) {
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Shadow ──
    ctx.beginPath();
    ctx.arc(2, 6, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Holding danger aura
    if (isHolding) {
      const dangerPulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.35;
      const auraGrd = ctx.createRadialGradient(0, 0, 15, 0, 0, 45);
      auraGrd.addColorStop(0, `rgba(255, 69, 0, ${dangerPulse})`);
      auraGrd.addColorStop(0.6, `rgba(255, 69, 0, ${dangerPulse * 0.3})`);
      auraGrd.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = auraGrd;
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rotate context so +X is forward!
    ctx.rotate(angle);

    // ── Animation ──
    const runCycle = isMoving ? animFrame * 8 : 0;
    const armSwing = Math.sin(runCycle) * 10;
    const legSwing = Math.sin(runCycle + Math.PI) * 10; // Opposite of arms

    // ─────── FEET (Underneath, sticking out back) ───────
    ctx.fillStyle = color;
    // Left foot (top in rotated space: -Y)
    ctx.beginPath();
    ctx.arc(-6 + legSwing, -13, 6.5, 0, Math.PI * 2);
    ctx.fill();
    // Right foot (bottom in rotated space: +Y)
    ctx.beginPath();
    ctx.arc(-6 - legSwing, 13, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // ─────── HANDS (Sticking out front) ───────
    // Left hand
    ctx.beginPath();
    ctx.arc(6 - armSwing, -16, 7.5, 0, Math.PI * 2);
    ctx.fill();
    // Right hand
    ctx.beginPath();
    ctx.arc(6 + armSwing, 16, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // ─────── HEAD/BODY MAIN CIRCLE ───────
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Head inner shadow/rim for 3D blob effect
    const headGrd = ctx.createRadialGradient(-4, -4, 2, 0, 0, 18);
    headGrd.addColorStop(0, 'rgba(255,255,255,0.2)');
    headGrd.addColorStop(0.7, 'rgba(0,0,0,0)');
    headGrd.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = headGrd;
    ctx.fill();

    // ─────── FACE (Eyes facing forward: +X) ───────
    // White eye backgrounds
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(10, -6, 5, 0, Math.PI * 2); ctx.fill(); // Left eye
    ctx.beginPath(); ctx.arc(10, 6, 5, 0, Math.PI * 2); ctx.fill(); // Right eye

    // Pupils (offset slightly more forward/inward)
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(12, -5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, 5, 2.5, 0, Math.PI * 2); ctx.fill();

    // Eye highlights
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(12.5, -5.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12.5, 4.5, 1, 0, Math.PI * 2); ctx.fill();

    // Undo rotation so the name tag stays upright
    ctx.rotate(-angle);

    // ── Name tag ──
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.7;
    ctx.fillText(player.name, 0, 32);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  _drawDeadPlayer(player) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX + player.x, this.shakeY + player.y);

    const { color } = player;
    ctx.globalAlpha = 0.3;

    // Ghost body puddle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 5, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // X eyes directly on the puddle
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(0, 3); ctx.moveTo(0, -3); ctx.lineTo(-6, 3); ctx.stroke(); // Left X
    ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(12, 3); ctx.moveTo(12, -3); ctx.lineTo(6, 3); ctx.stroke(); // Right X

    ctx.globalAlpha = 0.6;
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText('OUT', 0, 22);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  //  POTATO (TOP-DOWN)
  // ═══════════════════════════════════════════════════════════════
  drawPotato(potato, holder) {
    if (!holder || potato.exploded) return;
    const ctx = this.ctx;
    ctx.save();
    
    // Potato is held IN FRONT of the player based on their angle
    const px = holder.x + Math.cos(holder.angle) * 28;
    const py = holder.y + Math.sin(holder.angle) * 28;
    
    ctx.translate(this.shakeX + px, this.shakeY + py);

    const urgency = potato.urgency;
    const pulse = Math.sin(Date.now() * 0.001 * potato.pulseSpeed) * 0.3 + 0.7;
    const potatoSize = 12 + urgency * 3;

    // Glow
    const glowSize = 25 + urgency * 20;
    const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, glowSize);
    grd.addColorStop(0, `rgba(255, 100, 0, ${potato.glowIntensity * pulse})`);
    grd.addColorStop(0.4, `rgba(255, 50, 0, ${potato.glowIntensity * pulse * 0.4})`);
    grd.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Potato body — perfect circle from top down
    ctx.fillStyle = '#CD853F';
    ctx.beginPath();
    ctx.arc(0, 0, potatoSize, 0, Math.PI * 2);
    ctx.fill();

    // Potato highlight/texture
    const hlGrd = ctx.createRadialGradient(-3, -3, 1, 0, 0, potatoSize);
    hlGrd.addColorStop(0, 'rgba(255, 220, 150, 0.6)');
    hlGrd.addColorStop(0.5, 'rgba(205, 133, 63, 0.3)');
    hlGrd.addColorStop(1, 'rgba(139, 69, 19, 0.5)');
    ctx.fillStyle = hlGrd;
    ctx.beginPath();
    ctx.arc(0, 0, potatoSize, 0, Math.PI * 2);
    ctx.fill();

    // Spots (Top-down spots)
    ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
    ctx.beginPath(); ctx.arc(-4, 4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-2, -5, 1.5, 0, Math.PI * 2); ctx.fill();

    // Fuse sticking out
    ctx.strokeStyle = '#4E342E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0 - potatoSize * 0.8);
    ctx.quadraticCurveTo(5, -potatoSize - 5, 2, -potatoSize - 12);
    ctx.stroke();

    // Spark
    if (!potato.frozen) {
      const sp = Math.sin(Date.now() * 0.025) * 0.5 + 0.5;
      const sparkGrd = ctx.createRadialGradient(
        2, -potatoSize - 12, 0,
        2, -potatoSize - 12, 6 + sp * 4
      );
      sparkGrd.addColorStop(0, '#FFF');
      sparkGrd.addColorStop(0.2, '#FFD700');
      sparkGrd.addColorStop(0.5, '#FF6600');
      sparkGrd.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = sparkGrd;
      ctx.beginPath();
      ctx.arc(2, -potatoSize - 12, 6 + sp * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Frozen
    if (potato.frozen) {
      ctx.beginPath();
      ctx.arc(0, 0, potatoSize + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#00D2FF';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#00D2FF';
      ctx.font = 'bold 16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('❄', 0, 6);
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  //  POWER-UP
  // ═══════════════════════════════════════════════════════════════
  drawPowerUp(powerUp) {
    if (!powerUp || !powerUp.active) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    const { x, y, color, icon, pulsePhase, radius } = powerUp;
    const pulse = Math.sin(pulsePhase) * 0.2 + 1;
    const floatY = y + Math.sin(pulsePhase * 0.7) * 5;

    // Glow
    const grd = ctx.createRadialGradient(x, floatY, 2, x, floatY, radius * 3);
    grd.addColorStop(0, color + '50');
    grd.addColorStop(1, color + '00');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, floatY, radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(x, floatY, radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = color + '40';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Icon
    ctx.font = `${18 * pulse}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(icon, x, floatY);

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  //  EXPLOSION
  // ═══════════════════════════════════════════════════════════════
  drawExplosion(x, y, progress) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    // Screen flash
    if (progress < 0.3) {
      ctx.fillStyle = `rgba(255, 100, 0, ${(1 - progress / 0.3) * 0.5})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Fireball
    if (progress < 0.5) {
      const sz = 40 + progress * 250;
      const alpha = 1 - progress * 2;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, sz);
      grd.addColorStop(0, `rgba(255, 255, 220, ${alpha})`);
      grd.addColorStop(0.2, `rgba(255, 200, 50, ${alpha * 0.8})`);
      grd.addColorStop(0.5, `rgba(255, 80, 0, ${alpha * 0.5})`);
      grd.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.02;
      if (p.life > 0) {
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }

  spawnExplosion(x, y) {
    this.particles = [];
    const colors = ['#FF4500', '#FF6B35', '#FFD700', '#FF1744', '#FFC107', '#fff', '#FF9800'];
    for (let i = 0; i < EXPLOSION_PARTICLES; i++) {
      const angle = (Math.PI * 2 * i) / EXPLOSION_PARTICLES + Math.random() * 0.5;
      const speed = 2 + Math.random() * 8;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 3 + Math.random() * 7,
        life: 0.8 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  setShake(intensity) {
    this.shakeX = (Math.random() - 0.5) * intensity * 2;
    this.shakeY = (Math.random() - 0.5) * intensity * 2;
  }

  clearShake() {
    this.shakeX = 0;
    this.shakeY = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  //  HUD
  // ═══════════════════════════════════════════════════════════════
  drawTimer(timer, frozen) {
    const ctx = this.ctx;
    const text = timer.toFixed(1);
    const x = this.width / 2;
    const y = 28;

    ctx.save();
    ctx.font = `bold 30px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let color = '#4ADE80';
    if (timer < 5) color = '#FBBF24';
    if (timer < 3) color = '#F87171';
    if (timer < 1.5) color = '#EF4444';
    if (frozen) color = '#00D2FF';

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillText(text + 's', x, y);

    if (frozen) {
      ctx.font = `bold 13px ${FONT_FAMILY}`;
      ctx.fillStyle = '#00D2FF';
      ctx.fillText('❄ FROZEN', x, y + 22);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawRoundInfo(round, scores, playerColors, playerNames, aliveStatuses) {
    const ctx = this.ctx;
    ctx.save();

    // Round pill
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.roundRect(ARENA_PADDING + 4, 8, 80, 26, 13);
    ctx.fill();
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(`ROUND ${round}`, ARENA_PADDING + 44, 25);

    // Score pills — top right
    ctx.textAlign = 'right';
    const startX = this.width - ARENA_PADDING - 10;
    let sy = 16;
    for (let i = 0; i < scores.length; i++) {
      const alive = aliveStatuses[i];
      ctx.font = `bold 12px ${FONT_FAMILY}`;

      // Pill background
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.roundRect(startX - 90, sy - 8, 96, 20, 10);
      ctx.fill();

      // Colored dot
      ctx.beginPath();
      ctx.arc(startX - 76, sy + 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = alive ? playerColors[i] : 'rgba(255,255,255,0.3)';
      ctx.fill();

      ctx.fillStyle = alive ? playerColors[i] : 'rgba(255,255,255,0.5)';
      ctx.fillText(`${playerNames[i]}: ${scores[i]}`, startX - 6, sy + 6);
      sy += 24;
    }

    ctx.restore();
  }

  drawCountdown(text, alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold 90px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 40;
    ctx.fillText(text, this.width / 2, this.height / 2);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawMessage(text, sub) {
    const ctx = this.ctx;
    ctx.save();

    // Semi-transparent backdrop pill
    const bw = Math.min(500, this.width * 0.6);
    const bh = 80;
    ctx.fillStyle = 'rgba(15, 15, 40, 0.75)';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - bw / 2, this.height / 2 - bh / 2 - 5, bw, bh, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `bold 32px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(text, this.width / 2, this.height / 2 - 12);

    if (sub) {
      ctx.font = `15px ${FONT_FAMILY}`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(sub, this.width / 2, this.height / 2 + 18);
    }
    ctx.restore();
  }
}
