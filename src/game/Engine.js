import Player from './Player.js';
import Potato from './Potato.js';
import AIController from './AIController.js';
import Renderer from './Renderer.js';
import InputManager from './InputManager.js';
import PowerUpManager from './PowerUps.js';
import { checkCollisions, checkPowerUpCollision } from './Collision.js';
import {
  TOTAL_PLAYERS, ARENA_PADDING, ROUNDS_TO_WIN,
  ROUND_START_DELAY, SHAKE_DURATION, SHAKE_INTENSITY,
  PLAYER_COLORS, PLAYER_NAMES
} from './constants.js';
import {
  playPass, playTick, playExplosion, playPowerUp,
  playRoundStart, playVictory, playCountdownBeep, initAudio
} from '../utils/sounds.js';

const STATE = {
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  EXPLODING: 'exploding',
  ROUND_OVER: 'round_over',
  GAME_OVER: 'game_over',
};

export default class Engine {
  constructor(canvas, humanCount, onGameOver, powerUpsEnabled = true) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.humanCount = Math.max(1, Math.min(4, humanCount));
    this.onGameOver = onGameOver;
    this.powerUpsEnabled = powerUpsEnabled;

    this.players = [];
    this.potato = new Potato();
    this.aiControllers = [];
    this.powerUpManager = new PowerUpManager();
    this.powerUpManager.enabled = powerUpsEnabled;

    this.state = STATE.COUNTDOWN;
    this.round = 1;
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.explosionTimer = 0;
    this.explosionPos = { x: 0, y: 0 };
    this.shakeTimer = 0;
    this.roundOverTimer = 0;
    this.tickTimer = 0;
    this.lastTickThreshold = 999;

    this.animFrameId = null;
    this.lastTime = 0;
    this.running = false;

    this._initPlayers();
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
    this.aiControllers = [];

    for (let i = 0; i < TOTAL_PLAYERS; i++) {
      const isHuman = i < this.humanCount;
      const p = new Player(i, positions[i].x, positions[i].y, isHuman);
      this.players.push(p);
      if (!isHuman) {
        this.aiControllers.push({ index: i, controller: new AIController() });
      }
    }
  }

  start() {
    this.running = true;
    this.input.bind();
    this._startRound();
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

  _startRound() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const pad = ARENA_PADDING + 60;
    const positions = [
      { x: pad, y: pad },
      { x: w - pad, y: pad },
      { x: pad, y: h - pad },
      { x: w - pad, y: h - pad },
    ];

    for (const p of this.players) {
      if (p.isAlive) {
        const pos = positions[p.index];
        p.reset(pos.x, pos.y);
      }
    }

    // Give potato to a random alive player
    const alive = this.players.filter(p => p.isAlive);
    const holder = alive[Math.floor(Math.random() * alive.length)];
    holder.isHolding = true;
    this.potato.startRound(holder.index);

    this.powerUpManager.reset();
    this.state = STATE.COUNTDOWN;
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.lastTickThreshold = 999;
  }

  _loop(now) {
    if (!this.running) return;

    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
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
      case STATE.EXPLODING:
        this._updateExploding(dt);
        break;
      case STATE.ROUND_OVER:
        this._updateRoundOver(dt);
        break;
      case STATE.GAME_OVER:
        // static
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

    // Human input
    const humanPlayers = this.players.filter(p => p.isHuman && p.isAlive);
    if (humanPlayers.length > 0) {
      humanPlayers[0].setDirection(this.input.direction.x, this.input.direction.y);
    }

    // AI
    for (const ai of this.aiControllers) {
      const p = this.players[ai.index];
      if (p.isAlive) {
        ai.controller.update(p, this.players, this.potato, dt);
      }
    }

    // Update players
    for (const p of this.players) {
      if (p.isAlive) {
        p.update(w, h, ARENA_PADDING);
      }
    }

    // Collisions — potato passing
    checkCollisions(this.players, this.potato, (from, to) => {
      playPass();
    });

    // Power-ups
    this.powerUpManager.update(dt, w, h, ARENA_PADDING);
    if (this.powerUpManager.current) {
      for (const p of this.players) {
        if (p.isAlive && checkPowerUpCollision(p, this.powerUpManager.current)) {
          const collected = this.powerUpManager.collect(p, this.potato);
          if (collected) playPowerUp();
        }
      }
    }

    // Tick sound
    const timer = this.potato.timer;
    if (timer < 3 && timer > 0) {
      this.tickTimer += dt;
      const tickInterval = Math.max(0.1, timer / 3 * 0.5);
      if (this.tickTimer >= tickInterval) {
        this.tickTimer = 0;
        playTick();
      }
    }

    // Potato countdown
    const exploded = this.potato.update(dt);
    if (exploded) {
      this._onExplosion();
    }
  }

  _onExplosion() {
    const holder = this.players[this.potato.holderIndex];
    if (holder) {
      holder.isAlive = false;
      holder.isHolding = false;
      this.explosionPos = { x: holder.x, y: holder.y - 4 };
      this.renderer.spawnExplosion(holder.x, holder.y - 4);
    }
    this.state = STATE.EXPLODING;
    this.explosionTimer = 0;
    this.shakeTimer = SHAKE_DURATION;
    playExplosion();
  }

  _updateExploding(dt) {
    this.explosionTimer += dt * 1000;
    this.shakeTimer -= dt * 1000;

    if (this.shakeTimer > 0) {
      const intensity = (this.shakeTimer / SHAKE_DURATION) * SHAKE_INTENSITY;
      this.renderer.setShake(intensity);
    } else {
      this.renderer.clearShake();
    }

    if (this.explosionTimer > 2000) {
      this.renderer.clearShake();
      const alive = this.players.filter(p => p.isAlive);

      // Award a point to all surviving players
      for (const p of alive) {
        p.score += 1;
      }

      if (alive.length <= 1) {
        this._checkGameOver();
      } else {
        // Continue to next round
        this.state = STATE.ROUND_OVER;
        this.roundOverTimer = 0;
      }
    }
  }

  _updateRoundOver(dt) {
    this.roundOverTimer += dt * 1000;
    if (this.roundOverTimer > 2000) {
      this.round++;
      this._startRound();
    }
  }

  _checkGameOver() {
    const alive = this.players.filter(p => p.isAlive);

    // Check if any player reached ROUNDS_TO_WIN
    const maxScore = Math.max(...this.players.map(p => p.score));
    const winner = this.players.find(p => p.score >= ROUNDS_TO_WIN);

    if (winner || alive.length <= 1) {
      this.state = STATE.GAME_OVER;
      playVictory();

      const finalWinner = winner || alive[0] || this.players.reduce((a, b) => a.score > b.score ? a : b);

      setTimeout(() => {
        if (this.onGameOver) {
          this.onGameOver({
            winner: finalWinner,
            scores: this.players.map(p => ({ name: p.name, color: p.color, score: p.score })),
            rounds: this.round,
          });
        }
      }, 2500);
    } else {
      this.state = STATE.ROUND_OVER;
      this.roundOverTimer = 0;
    }
  }

  _render() {
    this.renderer.clear();

    const aliveStatuses = this.players.map(p => p.isAlive);

    // Draw power-up
    if (this.state === STATE.PLAYING) {
      this.renderer.drawPowerUp(this.powerUpManager.current);
    }

    // Draw players
    for (const p of this.players) {
      this.renderer.drawPlayer(p, this.potato.holderIndex);
    }

    // Draw potato
    const holder = this.players.find(p => p.index === this.potato.holderIndex);
    if (this.state === STATE.PLAYING || this.state === STATE.COUNTDOWN) {
      this.renderer.drawPotato(this.potato, holder);
    }

    // Draw joystick
    this.input.drawJoystick(this.renderer.ctx);

    // HUD
    if (this.state === STATE.PLAYING) {
      this.renderer.drawTimer(this.potato.timer, this.potato.frozen);
    }

    this.renderer.drawRoundInfo(
      this.round,
      this.players.map(p => p.score),
      PLAYER_COLORS,
      PLAYER_NAMES,
      aliveStatuses
    );

    // State-specific overlays
    switch (this.state) {
      case STATE.COUNTDOWN: {
        const val = Math.max(1, this.countdownValue);
        const frac = this.countdownTimer % 1;
        const alpha = 1 - frac * 0.5;
        this.renderer.drawCountdown(val.toString(), alpha);
        break;
      }
      case STATE.EXPLODING: {
        const progress = this.explosionTimer / 2000;
        this.renderer.drawExplosion(this.explosionPos.x, this.explosionPos.y, progress);

        const eliminated = this.players.find(p => p.index === this.potato.holderIndex);
        if (eliminated && this.explosionTimer > 800) {
          this.renderer.drawMessage(
            `💥 ${eliminated.name} exploded!`,
            null
          );
        }
        break;
      }
      case STATE.ROUND_OVER: {
        const alive = this.players.filter(p => p.isAlive);
        this.renderer.drawMessage(
          `Round ${this.round} complete`,
          alive.length > 1 ? 'Next round starting...' : null
        );
        break;
      }
      case STATE.GAME_OVER: {
        const w = this.players.reduce((a, b) => a.score > b.score ? a : b);
        this.renderer.drawMessage(
          `🏆 ${w.name} wins!`,
          `Score: ${w.score}`
        );
        break;
      }
    }
  }
}
