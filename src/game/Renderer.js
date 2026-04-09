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
  }

  _roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }

  clear() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    // Background — Solid vibrant blue (Stickman Party style)
    ctx.fillStyle = '#55B8FF';
    ctx.fillRect(0, 0, this.width, this.height);

    // Arena floor
    const ax = ARENA_PADDING;
    const ay = ARENA_PADDING;
    const aw = this.width - ARENA_PADDING * 2;
    const ah = this.height - ARENA_PADDING * 2;

    ctx.save();
    this._roundRect(ctx, ax, ay, aw, ah, 20);
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

    // Inner shadow — simplified to semi-transparent overlay
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(ax, ay, aw, 30);

    ctx.restore();

    // Arena border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    this._roundRect(ctx, ax, ay, aw, ah, 20);
    ctx.stroke();

    // Corner bumpers
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

  // ── Player Drawing (Hot Potato Style) ──
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

    // Shadow
    ctx.beginPath();
    ctx.arc(2, 6, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Holding aura — simplified to a solid pulse
    if (isHolding) {
      const dangerPulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.35;
      ctx.fillStyle = `rgba(255, 69, 0, ${dangerPulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.rotate(angle);

    const runCycle = isMoving ? animFrame * 8 : 0;
    const armSwing = Math.sin(runCycle) * 10;
    const legSwing = Math.sin(runCycle + Math.PI) * 10;

    // Feet
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(-6 + legSwing, -13, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-6 - legSwing, 13, 6.5, 0, Math.PI * 2); ctx.fill();

    // Hands
    ctx.beginPath(); ctx.arc(6 - armSwing, -16, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6 + armSwing, 16, 7.5, 0, Math.PI * 2); ctx.fill();

    // Body
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(10, -6, 5, 0, Math.PI * 2); ctx.fill(); 
    ctx.beginPath(); ctx.arc(10, 6, 5, 0, Math.PI * 2); ctx.fill(); 
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(12, -5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, 5, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.rotate(-angle);
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.7;
    ctx.fillText(player.name, 0, 32);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Player Drawing (Target Shoot Style + Stun) ──
  drawTargetShootPlayer(player) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX + player.x, this.shakeY + player.y);

    const { color, animFrame, angle, stunTimer } = player;
    const isMoving = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1;
    const isStunned = stunTimer > 0;

    // Stun birds/stars
    if (isStunned) {
      const cycle = Date.now() * 0.01;
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < 3; i++) {
        const ang = cycle + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 22, Math.sin(ang) * 8 - 25, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Shadow
    ctx.beginPath();
    ctx.arc(2, 6, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    ctx.rotate(angle);

    const runCycle = isMoving ? animFrame * 8 : 0;
    const legSwing = Math.sin(runCycle + Math.PI) * 10;
    const armSwing = Math.sin(runCycle) * 10;

    // Feet
    ctx.fillStyle = isStunned ? '#666' : color;
    ctx.beginPath(); ctx.arc(-6 + legSwing, -13, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-6 - legSwing, 13, 6.5, 0, Math.PI * 2); ctx.fill();

    // Hands
    ctx.beginPath(); ctx.arc(6 - armSwing, -16, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6 + armSwing, 16, 7.5, 0, Math.PI * 2); ctx.fill();

    // Bow
    if (!isStunned) {
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(12, 0, 15, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12 + Math.cos(-Math.PI * 0.4) * 15, Math.sin(-Math.PI * 0.4) * 15);
      ctx.lineTo(12 + Math.cos(Math.PI * 0.4) * 15, Math.sin(Math.PI * 0.4) * 15);
      ctx.stroke();
    }

    // Body
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fillStyle = isStunned ? '#999' : color; ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(10, -6, 5, 0, Math.PI * 2); ctx.fill(); 
    ctx.beginPath(); ctx.arc(10, 6, 5, 0, Math.PI * 2); ctx.fill(); 
    if (isStunned) {
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(7.5,-8.5); ctx.lineTo(12.5,-3.5); ctx.moveTo(12.5,-8.5); ctx.lineTo(7.5,-3.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(7.5,3.5); ctx.lineTo(12.5,8.5); ctx.moveTo(12.5,3.5); ctx.lineTo(7.5,8.5); ctx.stroke();
    } else {
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(12, -5, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(12, 5, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.rotate(-angle);
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
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = player.color;
    ctx.beginPath(); ctx.ellipse(0, 5, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(0, 3); ctx.moveTo(0, -3); ctx.lineTo(-6, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(12, 3); ctx.moveTo(12, -3); ctx.lineTo(6, 3); ctx.stroke();
    ctx.globalAlpha = 0.6; ctx.font = `bold 11px ${FONT_FAMILY}`; ctx.textAlign = 'center'; ctx.fillStyle = player.color;
    ctx.fillText('OUT', 0, 22);
    ctx.restore();
  }

  // ── Elements ──
  drawPotato(potato, holder) {
    if (!holder || potato.exploded) return;
    const ctx = this.ctx;
    ctx.save();
    const px = holder.x + Math.cos(holder.angle) * 28;
    const py = holder.y + Math.sin(holder.angle) * 28;
    ctx.translate(this.shakeX + px, this.shakeY + py);
    const urgency = potato.urgency;
    const pulse = Math.sin(Date.now() * 0.001 * potato.pulseSpeed) * 0.3 + 0.7;
    const size = 12 + urgency * 3;
    // Glow — simplified
    const alpha = (potato.glowIntensity * pulse * 0.5).toFixed(2);
    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
    ctx.beginPath(); ctx.arc(0, 0, 25 + urgency * 20, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.fillStyle = '#CD853F'; ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill();
    // Fuse & Spark
    ctx.strokeStyle = '#4E342E'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -size); ctx.quadraticCurveTo(5, -size - 5, 2, -size - 12); ctx.stroke();
    if (!potato.frozen) {
      ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(2, -size - 12, 4 + Math.sin(Date.now() * 0.03) * 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  drawPowerUp(pu) {
    if (!pu || !pu.active) return;
    const ctx = this.ctx;
    ctx.save();
    const pulse = Math.sin(pu.pulsePhase) * 0.2 + 1;
    const floatY = pu.y + Math.sin(pu.pulsePhase * 0.7) * 5;
    ctx.translate(this.shakeX + pu.x, this.shakeY + floatY);
    ctx.beginPath(); ctx.arc(0, 0, pu.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = pu.color + '40'; ctx.fill();
    ctx.strokeStyle = pu.color; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.font = `${18 * pulse}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.fillText(pu.icon, 0, 0);
    ctx.restore();
  }

  drawObstacles(obs) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    ctx.fillStyle = '#8B4513'; ctx.strokeStyle = '#4E342E'; ctx.lineWidth = 2;
    for (const o of obs) {
      this._roundRect(ctx, o.x - o.w/2, o.y - o.h/2, o.w, o.h, 4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x - o.w/2, o.y); ctx.lineTo(o.x + o.w/2, o.y); ctx.stroke();
    }
    ctx.restore();
  }

  drawTargets(targets) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(this.shakeX, this.shakeY);
    for (const t of targets) {
      const { x, y, radius, isMoving, isGolden } = t;
      
      // Shadow
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();

      if (isGolden) {
        // Glowing gold aura — simplified
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.beginPath(); ctx.arc(x, y, radius + 10, 0, Math.PI * 2); ctx.fill();

        // Target body
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#DAA520'; // GoldenRod
        ctx.beginPath(); ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2); ctx.fill();
      } else {
        // Outer ring
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner ring
        ctx.fillStyle = isMoving ? '#FF4757' : '#1E90FF';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawArrows(arrows) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(this.shakeX, this.shakeY);
    for (const a of arrows) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle);
      ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
      ctx.fillStyle = a.color; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-14, -4); ctx.lineTo(-14, 4); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  drawRangeRing(x, y, range) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(this.shakeX + x, this.shakeY + y);
    ctx.beginPath(); ctx.arc(0, 0, range, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.stroke();
    ctx.restore();
  }

  // ── Effects ──
  spawnExplosion(x, y) {
    this.particles = [];
    for (let i = 0; i < EXPLOSION_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 3, life: 1, color: ['#FF4500', '#FFD700', '#fff'][Math.floor(Math.random()*3)] });
    }
  }

  spawnHitEffect(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3;
      this.particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.8, color: color });
    }
  }

  drawExplosion(x, y, progress) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(this.shakeX, this.shakeY);
    if (progress < 0.5) {
      const alpha = (1 - progress * 2) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, 40 + progress * 250, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.02;
      if (p.life > 0) { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2); ctx.fill(); }
      else { this.particles.splice(i, 1); }
    }
    ctx.restore();
  }

  setShake(i) { this.shakeX = (Math.random()-0.5)*i*2; this.shakeY = (Math.random()-0.5)*i*2; }
  clearShake() { this.shakeX = 0; this.shakeY = 0; }

  // ── HUD ──
  drawTimer(timer, frozen) {
    const ctx = this.ctx; ctx.save();
    ctx.font = `bold 30px ${FONT_FAMILY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = frozen ? '#00D2FF' : '#F87171'; ctx.fillText(timer.toFixed(1) + 's', this.width/2, 28);
    ctx.restore();
  }

  drawScoreBoard(scores, colors, names, active, title = 'TARGET SHOOT') {
    const ctx = this.ctx; ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    this._roundRect(ctx, ARENA_PADDING + 4, 8, 120, 26, 13);
    ctx.fill();
    ctx.font = `bold 12px ${FONT_FAMILY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(title, ARENA_PADDING + 64, 25);
    const startX = this.width - ARENA_PADDING - 10;
    for (let i = 0; i < scores.length; i++) {
        const sy = 16 + i * 24;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        this._roundRect(ctx, startX - 90, sy - 8, 96, 20, 10);
        ctx.fill();
        ctx.beginPath(); ctx.arc(startX - 76, sy + 2, 4, 0, Math.PI * 2); ctx.fillStyle = active[i] ? colors[i] : '#555'; ctx.fill();
        ctx.textAlign = 'right'; ctx.fillStyle = active[i] ? colors[i] : '#888'; ctx.fillText(`${names[i]}: ${scores[i]}`, startX - 6, sy + 6);
    }
    ctx.restore();
  }

  drawRoundInfo(round, scores, colors, names, alive) {
    this.drawScoreBoard(scores, colors, names, alive, `ROUND ${round}`);
  }

  drawCountdown(text, alpha) {
    const ctx = this.ctx; ctx.save(); ctx.globalAlpha = alpha;
    ctx.font = `bold 90px ${FONT_FAMILY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.fillText(text, this.width/2, this.height/2); ctx.restore();
  }

  drawMessage(text, sub) {
    const ctx = this.ctx; ctx.save();
    const bw = 400, bh = 80;
    ctx.fillStyle = 'rgba(15, 15, 40, 0.85)';
    this._roundRect(ctx, this.width/2 - bw/2, this.height/2 - bh/2, bw, bh, 16);
    ctx.fill();
    ctx.font = `bold 32px ${FONT_FAMILY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(text, this.width/2, this.height/2 - 10);
    if (sub) { ctx.font = `15px ${FONT_FAMILY}`; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText(sub, this.width/2, this.height/2 + 20); }
    ctx.restore();
  }
}
