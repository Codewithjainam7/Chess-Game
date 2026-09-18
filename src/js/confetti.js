/**
 * confetti.js
 * High-performance, mobile-optimized Canvas Confetti & Fireworks Particle Engine.
 * Pure Vanilla JavaScript ES Module (zero external dependencies).
 */

const GOLD_PALETTE = ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff', '#eab308'];
const VICTORY_PALETTE = [
  '#fbbf24', // Gold
  '#3b82f6', // Sapphire
  '#10b981', // Emerald
  '#ec4899', // Ruby Pink
  '#8b5cf6', // Royal Purple
  '#06b6d4', // Cyan
  '#f97316', // Vibrant Orange
  '#ffffff'  // Silver highlight
];

export class VictoryCelebration {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
    this.isRunning = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for mobile battery efficiency
    this.width = 0;
    this.height = 0;
    this._resizeHandler = () => this._resize();
  }

  _initCanvas() {
    if (!this.canvas) {
      this.canvas = document.getElementById('victory-canvas');
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'victory-canvas';
        this.canvas.className = 'victory-canvas';
        document.body.appendChild(this.canvas);
      }
      this.ctx = this.canvas.getContext('2d');
      window.addEventListener('resize', this._resizeHandler);
    }
    this._resize();
  }

  _resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    if (this.ctx) {
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  start(options = {}) {
    this.stop();
    this._initCanvas();
    this.isRunning = true;
    this.particles = [];

    const isMobile = window.innerWidth < 768;
    const isWinner = options.isWinner !== false;
    const palette = isWinner ? VICTORY_PALETTE : GOLD_PALETTE;

    // Phase 1: Left and right dual-cannon explosive volley
    const cannonCount = isMobile ? 45 : 85;
    this._fireCannon(0.08 * this.width, this.height * 0.95, 60, cannonCount, palette, 14, 26);
    this._fireCannon(0.92 * this.width, this.height * 0.95, 120, cannonCount, palette, 14, 26);

    // Phase 2: Center firework starburst
    setTimeout(() => {
      if (!this.isRunning) return;
      const centerBurstCount = isMobile ? 40 : 70;
      this._fireBurst(this.width * 0.5, this.height * 0.35, centerBurstCount, palette);
    }, 280);

    // Phase 3: Secondary cascading celebratory showers
    setTimeout(() => {
      if (!this.isRunning) return;
      const cascadeCount = isMobile ? 30 : 60;
      this._fireCannon(0.25 * this.width, this.height * 0.98, 70, cascadeCount, palette, 12, 22);
      this._fireCannon(0.75 * this.width, this.height * 0.98, 110, cascadeCount, palette, 12, 22);
    }, 650);

    // Phase 4: Gentle star & sparkle rain
    const rainInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(rainInterval);
        return;
      }
      this._spawnRain(isMobile ? 3 : 6, palette);
    }, 200);

    // Auto terminate rain after 4 seconds to let existing particles fade gracefully
    setTimeout(() => {
      clearInterval(rainInterval);
    }, 4000);

    this._animate();
  }

  startDefeat() {
    this.stop();
    this._initCanvas();
    this.isRunning = true;
    this.particles = [];

    const isMobile = window.innerWidth < 768;
    const defeatPalette = ['#f43f5e', '#e11d48', '#be123c', '#881337', '#475569', '#334155'];

    // Falling ember / spark rain
    const emberInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(emberInterval);
        return;
      }
      for (let i = 0; i < (isMobile ? 3 : 6); i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: -10,
          vx: (Math.random() - 0.5) * 1.8,
          vy: Math.random() * 2.2 + 1.4,
          size: Math.random() * 5 + 3,
          color: defeatPalette[Math.floor(Math.random() * defeatPalette.length)],
          type: 'circle',
          rotation: 0,
          rotSpeed: 0,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.05,
          gravity: 0.08,
          drag: 0.99,
          opacity: 0.85,
          fadeSpeed: 0.0035,
          scaleY: 1
        });
      }
    }, 140);

    setTimeout(() => {
      clearInterval(emberInterval);
    }, 4000);

    this._animate();
  }

  _fireCannon(x, y, baseAngleDeg, count, palette, minSpeed = 12, maxSpeed = 24) {
    const baseAngleRad = (baseAngleDeg * Math.PI) / 180;
    const spreadRad = (45 * Math.PI) / 180;

    for (let i = 0; i < count; i++) {
      const angle = baseAngleRad + (Math.random() - 0.5) * spreadRad;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const type = Math.random() < 0.2 ? 'star' : Math.random() < 0.35 ? 'circle' : 'ribbon';

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        size: Math.random() * 8 + 6,
        color,
        type,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.12 + 0.05,
        gravity: 0.28 + Math.random() * 0.08,
        drag: 0.985,
        opacity: 1,
        fadeSpeed: 0.003 + Math.random() * 0.004,
        scaleY: 1
      });
    }
  }

  _fireBurst(x, y, count, palette) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 16;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const type = Math.random() < 0.4 ? 'star' : 'circle';

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 7 + 5,
        color,
        type,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.1,
        gravity: 0.2,
        drag: 0.97,
        opacity: 1,
        fadeSpeed: 0.006 + Math.random() * 0.006,
        scaleY: 1
      });
    }
  }

  _spawnRain(count, palette) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.width;
      const y = -15;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const type = Math.random() < 0.3 ? 'star' : 'ribbon';

      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 6 + 5,
        color,
        type,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.06,
        gravity: 0.15,
        drag: 0.99,
        opacity: 1,
        fadeSpeed: 0.004 + Math.random() * 0.004,
        scaleY: 1
      });
    }
  }

  _animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Physics update
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.rotation += p.rotSpeed;
      p.wobble += p.wobbleSpeed;
      p.scaleY = Math.cos(p.wobble); // 3D flutter illusion
      p.opacity -= p.fadeSpeed;

      // Remove expired or off-screen particles
      if (p.opacity <= 0 || p.y > this.height + 40) {
        this.particles.splice(i, 1);
        continue;
      }

      // Render particle
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.scale(1, p.scaleY);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;

      if (p.type === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'star') {
        this._drawStar(this.ctx, 0, 0, 5, p.size, p.size * 0.45);
      } else {
        // Ribbon / Rectangle
        this.ctx.fillRect(-p.size * 0.5, -p.size, p.size, p.size * 1.8);
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this._animate());
    } else {
      this.stop();
    }
  }

  _drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.particles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  destroy() {
    this.stop();
    if (this.canvas) {
      window.removeEventListener('resize', this._resizeHandler);
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
  }
}
