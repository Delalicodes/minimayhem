export default class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.direction = { x: 0, y: 0 };
    this.joystickActive = false;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickPos = { x: 0, y: 0 };
    this.joystickRadius = 50;
    this.knobRadius = 20;
    this.keys = {};

    // Touch
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    // Mouse (for desktop testing)
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    // Keyboard
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    this.touchId = null;
    this.shootRequested = false;
    this._bound = false;
  }

  bind() {
    if (this._bound) return;
    this._bound = true;
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this._onTouchEnd);
    this.canvas.addEventListener('touchcancel', this._onTouchEnd);

    this.canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  unbind() {
    this._bound = false;
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
    this.canvas.removeEventListener('touchcancel', this._onTouchEnd);

    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);

    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  _getCanvasPos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  _onTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const pos = this._getCanvasPos(touch.clientX, touch.clientY);
      
      // If no joystick yet, the first touch becomes the joystick
      if (this.touchId === null) {
        this.touchId = touch.identifier;
        this.joystickCenter = { ...pos };
        this.joystickPos = { ...pos };
        this.joystickActive = true;
      } else {
        // Any other touch is a shoot request
        this.shootRequested = true;
      }
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        const pos = this._getCanvasPos(touch.clientX, touch.clientY);
        this.joystickPos = pos;
        this._updateDirection();
      }
    }
  }

  _onTouchEnd(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        this.touchId = null;
        this.joystickActive = false;
        this.direction = { x: 0, y: 0 };
      }
    }
  }

  _onMouseDown(e) {
    const pos = this._getCanvasPos(e.clientX, e.clientY);
    // On desktop, right click or shift+click or just detecting it
    if (e.button === 0) { // Left click
        this.joystickCenter = { ...pos };
        this.joystickPos = { ...pos };
        this.joystickActive = true;
    }
    // Also trigger shoot on every click for easy testing
    this.shootRequested = true;
  }

  _onMouseMove(e) {
    if (!this.joystickActive) return;
    const pos = this._getCanvasPos(e.clientX, e.clientY);
    this.joystickPos = pos;
    this._updateDirection();
  }

  _onMouseUp() {
    this.joystickActive = false;
    this.direction = { x: 0, y: 0 };
  }

  _updateDirection() {
    const dx = this.joystickPos.x - this.joystickCenter.x;
    const dy = this.joystickPos.y - this.joystickCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this.joystickRadius;

    if (dist > 5) {
      this.direction = {
        x: Math.min(1, Math.max(-1, dx / maxDist)),
        y: Math.min(1, Math.max(-1, dy / maxDist)),
      };
    } else {
      this.direction = { x: 0, y: 0 };
    }
  }

  consumeShootRequest() {
    const req = this.shootRequested;
    this.shootRequested = false;
    return req;
  }

  _onKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
    this._updateKeyDirection();
  }

  _onKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
    this._updateKeyDirection();
  }

  _updateKeyDirection() {
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;
    this.direction = { x: dx, y: dy };
  }

  drawJoystick(ctx) {
    if (!this.joystickActive) return;

    const { joystickCenter: c, joystickPos: p, joystickRadius: r, knobRadius: kr } = this;

    // Outer ring
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Clamp knob to radius
    let dx = p.x - c.x;
    let dy = p.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let kx = p.x, ky = p.y;
    if (dist > r) {
      kx = c.x + (dx / dist) * r;
      ky = c.y + (dy / dist) * r;
    }

    // Knob
    ctx.beginPath();
    ctx.arc(kx, ky, kr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
