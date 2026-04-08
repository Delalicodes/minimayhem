import Player from './Player.js';
import TargetManager from './TargetManager.js';
import Renderer from './Renderer.js';
import InputManager from './InputManager.js';
import {
  TOTAL_PLAYERS, ARENA_PADDING,
  PLAYER_COLORS, PLAYER_NAMES
} from './constants.js';
import {
  playPass, playTick, playExplosion, playPowerUp,
  playRoundStart, playVictory, playCountdownBeep, initAudio
} from '../utils/sounds.js';

const STATE = {
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
};

const GAME_DURATION = 60; // seconds
const SHOOT_RANGE = 200;  // max arrow auto-aim range
const SHOOT_COOLDOWN = 0.5; // seconds between shots
const STUN_DURATION = 2000; // ms

export default class TargetShootEngine {
  constructor(canvas, humanCount, onGameOver, powerUpsEnabled = true) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.humanCount = Math.max(1, Math.min(4, humanCount));
    this.onGameOver = onGameOver;

    this.players = [];
    this.targetManager = new TargetManager();
    this.obstacles = [];
    this.arrows = [];

    this.state = STATE.COUNTDOWN;
    this.gameTimer = GAME_DURATION;
    this.countdownValue = 3;
    this.countdownTimer = 0;

    this.animFrameId = null;
    this.lastTime = 0;
    this.running = false;

    this._initPlayers();
    this._initObstacles();
    initAudio();
  }

  _initPlayers() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const pad = ARENA_PADDING + 60;

    const positions = [
      { x: pad, y: pad },
      { x: w - pad, y: pad },
      { x: pad, y: h - pad },
      { x: w - pad, y: h - pad },
    ];

    this.players = [];
    for (let i = 0; i < TOTAL_PLAYERS; i++) {
      const isHuman = i < this.humanCount;
      const p = new Player(i, positions[i].x, positions[i].y, isHuman);
      p.score = 0;
      p.shootCooldown = 0;
      p.stunTimer = 0;
      this.players.push(p);
    }
  }

  _initObstacles() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const pad = ARENA_PADDING + 40;
    this.obstacles = [];

    // Place 4-6 random crate-like obstacles
    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      let ox, oy;
      let tries = 0;
      do {
        ox = pad + Math.random() * (w - pad * 2);
        oy = pad + Math.random() * (h - pad * 2);
        tries++;
      } while (this._tooCloseToPlayers(ox, oy, 80) && tries < 20);

      this.obstacles.push({
        x: ox, y: oy,
        w: 30 + Math.random() * 20,
        h: 30 + Math.random() * 20,
      });
    }
  }

  _tooCloseToPlayers(x, y, minDist) {
    for (const p of this.players) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDist) return true;
    }
    return false;
  }

  start() {
    this.running = true;
    this.input.bind();
    this.lastTime = performance.now();
    this._loop = this._loop.bind(this);
    this.animFrameId = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    this.input.unbind();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this._update(dt);
    this._render();
    this.animFrameId = requestAnimationFrame(this._loop);
  }

  _update(dt) {
    switch (this.state) {
      case STATE.COUNTDOWN:
        this._updateCountdown(dt);
        break;
      case STATE.PLAYING:
        this._updatePlaying(dt);
        break;
      case STATE.GAME_OVER:
        break;
    }
  }

  _updateCountdown(dt) {
    this.countdownTimer += dt;
    const newVal = 3 - Math.floor(this.countdownTimer);
    if (newVal !== this.countdownValue && newVal > 0) {
      this.countdownValue = newVal;
      playCountdownBeep();
    }
    if (this.countdownTimer >= 3) {
      this.state = STATE.PLAYING;
      playRoundStart();
    }
  }

  _updatePlaying(dt) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // ── Player Movement ──
    for (const p of this.players) {
      // Handle stun
      if (p.stunTimer > 0) {
        p.stunTimer -= dt * 1000;
        p.vx = 0;
        p.vy = 0;
        continue;
      }

      if (p.isHuman) {
        p.setDirection(this.input.direction.x, this.input.direction.y);
      } else {
        this._updateAI(p, dt);
      }

      p.update(w, h, ARENA_PADDING);

      // Collide with obstacles (push out)
      for (const obs of this.obstacles) {
        this._pushPlayerFromObstacle(p, obs);
      }
    }

    // ── Auto-Shoot / Manual Shoot ──
    for (const p of this.players) {
      if (p.stunTimer > 0) continue;

      p.shootCooldown -= dt;

      if (p.isHuman) {
        // Manual shoot on tap
        if (this.input.consumeShootRequest() && p.shootCooldown <= 0) {
          const nearest = this.targetManager.getNearestTarget(p.x, p.y);
          let shootAngle = p.angle; // Fallback: face direction

          if (nearest) {
            const dx = nearest.x - p.x;
            const dy = nearest.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // If near, snap to it
            if (dist <= SHOOT_RANGE) {
              shootAngle = Math.atan2(dy, dx);
              p.angle = shootAngle;
            }
          }

          this._fireArrow(p, shootAngle);
          p.shootCooldown = SHOOT_COOLDOWN;
          playPass();
        }
      } else {
        // AI Auto-Shoot
        const isMoving = Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1;
        if (!isMoving && p.shootCooldown <= 0) {
          const nearest = this.targetManager.getNearestTarget(p.x, p.y);
          if (nearest) {
            const dx = nearest.x - p.x;
            const dy = nearest.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= SHOOT_RANGE) {
              const angle = Math.atan2(dy, dx);
              p.angle = angle;
              this._fireArrow(p, angle);
              p.shootCooldown = SHOOT_COOLDOWN;
              playPass();
            }
          }
        }
      }
    }

    // ── Update Targets ──
    this.targetManager.update(dt, w, h, ARENA_PADDING);

    // ── Update Arrows ──
    this._updateArrows(dt, w, h);

    // ── Game Timer ──
    this.gameTimer -= dt;

    // Tick sound for last 5 seconds
    if (this.gameTimer <= 5 && this.gameTimer > 0) {
      const intNow = Math.ceil(this.gameTimer);
      if (intNow !== this._lastTickInt) {
        this._lastTickInt = intNow;
        playTick();
      }
    }

    if (this.gameTimer <= 0) {
      this.gameTimer = 0;
      this._endGame();
    }
  }

  _updateAI(player, dt) {
    // AI Strategy: find nearest target within range, run towards it, stop to shoot
    const nearest = this.targetManager.getNearestTarget(player.x, player.y);
    if (!nearest) {
      // Wander
      if (Math.random() < 0.02) {
        const angle = Math.random() * Math.PI * 2;
        player.setDirection(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5);
      }
      return;
    }

    const dx = nearest.x - player.x;
    const dy = nearest.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > SHOOT_RANGE * 0.8) {
      // Run towards target
      player.setDirection(dx * 0.85, dy * 0.85);
    } else {
      // Close enough — stop to shoot
      // Add some mistake chance: 15% chance to keep moving slightly
      if (Math.random() < 0.15) {
        const wangle = Math.random() * Math.PI * 2;
        player.setDirection(Math.cos(wangle) * 0.3, Math.sin(wangle) * 0.3);
      } else {
        player.setDirection(0, 0);
      }
    }
  }

  _fireArrow(player, angle) {
    const speed = 500;
    this.arrows.push({
      x: player.x + Math.cos(angle) * 22,
      y: player.y + Math.sin(angle) * 22,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      ownerIndex: player.index,
      color: player.color,
      life: 2, // max 2 seconds of flight
    });
  }

  _updateArrows(dt, w, h) {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.life -= dt;

      let destroy = false;

      // Out of bounds or expired
      if (a.x < 0 || a.x > w || a.y < 0 || a.y > h || a.life <= 0) {
        destroy = true;
      }

      // Hit obstacle?
      if (!destroy) {
        for (const obs of this.obstacles) {
          if (a.x >= obs.x - obs.w / 2 && a.x <= obs.x + obs.w / 2 &&
              a.y >= obs.y - obs.h / 2 && a.y <= obs.y + obs.h / 2) {
            destroy = true;
            // Small impact particles
            this.renderer.spawnHitEffect(a.x, a.y, '#A0522D');
            break;
          }
        }
      }

      // Hit target?
      if (!destroy) {
        for (let j = this.targetManager.targets.length - 1; j >= 0; j--) {
          const t = this.targetManager.targets[j];
          const tdx = a.x - t.x;
          const tdy = a.y - t.y;
          if (tdx * tdx + tdy * tdy <= (t.radius + 6) * (t.radius + 6)) {
            // Hit!
            const shooter = this.players.find(p => p.index === a.ownerIndex);
            if (shooter) shooter.score += t.points;
            this.renderer.spawnHitEffect(t.x, t.y, t.isMoving ? '#FF3B30' : '#FF9500');
            this.targetManager.targets.splice(j, 1);
            destroy = true;
            break;
          }
        }
      }

      // Hit another player?
      if (!destroy) {
        for (const p of this.players) {
          if (p.index === a.ownerIndex) continue; // can't hit yourself
          if (p.stunTimer > 0) continue; // already stunned

          const pdx = a.x - p.x;
          const pdy = a.y - p.y;
          if (pdx * pdx + pdy * pdy <= (p.radius + 4) * (p.radius + 4)) {
            // Stun the player!
            p.stunTimer = STUN_DURATION;
            p.vx = 0;
            p.vy = 0;
            this.renderer.spawnHitEffect(p.x, p.y, p.color);
            playExplosion();
            destroy = true;
            break;
          }
        }
      }

      if (destroy) {
        this.arrows.splice(i, 1);
      }
    }
  }

  _pushPlayerFromObstacle(player, obs) {
    // Simple AABB push-out
    const halfW = obs.w / 2 + player.radius;
    const halfH = obs.h / 2 + player.radius;
    const dx = player.x - obs.x;
    const dy = player.y - obs.y;

    if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
      // Overlap — push out on smallest axis
      const overlapX = halfW - Math.abs(dx);
      const overlapY = halfH - Math.abs(dy);

      if (overlapX < overlapY) {
        player.x += dx > 0 ? overlapX : -overlapX;
      } else {
        player.y += dy > 0 ? overlapY : -overlapY;
      }
    }
  }

  _endGame() {
    this.state = STATE.GAME_OVER;
    playVictory();

    const winner = this.players.reduce((a, b) => a.score > b.score ? a : b);

    setTimeout(() => {
      if (this.onGameOver) {
        this.onGameOver({
          winner,
          scores: this.players.map(p => ({ name: p.name, color: p.color, score: p.score })),
          rounds: 1,
        });
      }
    }, 2500);
  }

  _render() {
    this.renderer.clear();

    const aliveStatuses = this.players.map(() => true);

    // Draw obstacles
    this.renderer.drawObstacles(this.obstacles);

    // Draw targets
    this.renderer.drawTargets(this.targetManager.targets);

    // Draw arrows
    this.renderer.drawArrows(this.arrows);

    // Draw range indicator for human player when stopped
    const human = this.players.find(p => p.isHuman);
    if (human && human.stunTimer <= 0) {
      const isMoving = Math.abs(human.vx) > 0.1 || Math.abs(human.vy) > 0.1;
      if (!isMoving) {
        this.renderer.drawRangeRing(human.x, human.y, SHOOT_RANGE);
      }
    }

    // Draw players
    for (const p of this.players) {
      this.renderer.drawTargetShootPlayer(p);
    }

    // Draw joystick
    this.input.drawJoystick(this.renderer.ctx);

    // HUD
    if (this.state === STATE.PLAYING) {
      this.renderer.drawTimer(this.gameTimer, false);
    }

    this.renderer.drawScoreBoard(
      this.players.map(p => p.score),
      PLAYER_COLORS,
      PLAYER_NAMES,
      aliveStatuses,
      'TARGET SHOOT'
    );

    // Overlays
    switch (this.state) {
      case STATE.COUNTDOWN: {
        const val = Math.max(1, this.countdownValue);
        const frac = this.countdownTimer % 1;
        const alpha = 1 - frac * 0.5;
        this.renderer.drawCountdown(val.toString(), alpha);
        break;
      }
      case STATE.GAME_OVER: {
        const w = this.players.reduce((a, b) => a.score > b.score ? a : b);
        this.renderer.drawMessage(
          `🏆 ${w.name} wins!`,
          `Score: ${w.score} pts`
        );
        break;
      }
    }
  }
}
