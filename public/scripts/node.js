const DIM_ALPHA = 0.15;

const canvas = document.querySelector('#heroCanvas canvas');
const ctx = canvas.getContext('2d');

const PathCache = new Map();
const ColorCache = new Map();

function round(value, places) {
  const multiplier = Math.pow(10, places);
  return Math.round(value * multiplier) / multiplier;
}

function initRadius(isAmbient, alpha) {
  const MIN = 5;
  const MAX = 40;
  return (isAmbient ? MIN + Math.random() * (MAX - MIN) : MAX) * alpha;
}

function initVelocity(isAmbient, depth) {
  const BASE_SPEED = 0.0005;
  const velocity = (Math.random() - 0.5) * BASE_SPEED;
  let scale = 1;
  if (isAmbient) {
    const MIN = 0.3;
    const MAX = 1.0;
    scale = MIN + depth * (MAX - MIN);
  } return velocity * scale;
}

function initColor(isAmbient, depth) {
  if (isAmbient) {
    const MIN = 1;
    const MAX = 255;
    return Math.round(MIN + (1 - depth) * (MAX - MIN));
  } return 0;
}

function getPath(r) {
  if (!PathCache.has(r)) {
    const p = new Path2D();
    if (r < 0) r = 0;
    p.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
    PathCache.set(r, p);
  } return PathCache.get(r);
}

function drawImage(img, r) {
  const iw = img.width;
  const ih = img.height;
  const imgRatio = iw / ih;
  const targetRatio = 1;

  let sx, sy, sw, sh;
  if (imgRatio > targetRatio) {
    sh = ih;
    sw = ih * targetRatio;
    sx = (iw - sw) / 2;
    sy = 0;
  } else {
    sw = iw;
    sh = iw / targetRatio;
    sx = 0;
    sy = (ih - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, -r, -r, r * 2, r * 2);
}

const BIRTH = {
  grow: 0.05,
  fade: 0.05,
  cutoffR: 0.9999,
  cutoffA: 0.95,
};

const DEATH = {
  shrink: 0.05,
  fade: 0.05,
  cutoffR: 0.0001,
  cutoffA: 0.05,
};

export class Node {
  constructor(type = 'ambient', data) {
    this.order = data?.order ?? 0;
    this.isAmbient = type === 'ambient';
    this.isProject = type === 'project';
    this.isPublication = type === 'publication';
    this.dimmed = false;
    this.born = false;
    this.dead = false;
    this.dying = false;
    this.hovered = false;
    this.loaded = false;
    this.opacity = 0;
    this.connections = [];

    // depth & radius
    this.depth = this.isAmbient ? Math.random() * 0.95 : 1;
    this.depthAlpha = 0.2 + this.depth * 0.8;
    this.radius = 0;
    this.baseRadius = initRadius(this.isAmbient, this.depthAlpha);
    this.targetRadius = this.baseRadius;

    // position / motion
    this.nx = Math.random();
    this.ny = Math.random();
    this.vx = initVelocity(this.isAmbient, this.depth);
    this.vy = initVelocity(this.isAmbient, this.depth);

    // hover behavior
    this.expandSpeed = this.isAmbient ? 0.01 : 0.04;
    this.revealThreshold = this.isAmbient ? null : 1.2;

    // display and link properties
    this.color = initColor(this.isAmbient, this.depth);
    this.href = this.isAmbient ? null : data.href;
    this.img = this.isAmbient ? null : new Image();
    if (!this.isAmbient) {
      this.img.onload = () => (this.loaded = true);
      this.img.src = data.coverImage;
      this.img.alt = data.title;
    }
  }

  getCoordinates() {
    return [this.nx * canvas.width, this.ny * canvas.height];
  }

  getColor(alpha = this.dimmed ? DIM_ALPHA : 1) {
    const isDark = root.classList.contains('dark');
    const key = `${this.isAmbient}|${this.color}|${this.dimmed}|${isDark}|${alpha}`;
    if (ColorCache.has(key)) return ColorCache.get(key);

    const c = isDark ? 255 - this.color : this.color;
    const color = `rgba(${c},${c},${c},${alpha})`;
    ColorCache.set(key, color);
    return color;
  }

  addConnection(connection) {
    this.connections.push(connection);
  }

  updateHoverStatus(status, multiplier = 1) {
    this.hovered = status;
    this.targetRadius = this.baseRadius * multiplier;
  }

  update(dt) {
    // movement
    this.nx += this.vx * dt;
    this.ny += this.vy * dt;

    // bounce
    const [x, y] = this.getCoordinates();
    const r = this.radius;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    if (x - r < 0 || x + r > canvas.width) {
      this.vx *= -1;
      const minX = r / canvas.width;
      const maxX = 1 - minX;
      this.nx = clamp(this.nx, minX, maxX);
    }
    if (y - r < 0 || y + r > canvas.height) {
      this.vy *= -1;
      const minY = r / canvas.height;
      const maxY = 1 - minY;
      this.ny = clamp(this.ny, minY, maxY);
    }

    // birth animation
    if (!this.born) {
      this.radius += (this.baseRadius - this.radius) * BIRTH.grow * dt;
      this.opacity += (1 - this.opacity) * BIRTH.fade * dt;
      if (this.radius >= this.baseRadius * BIRTH.cutoffR && this.opacity >= BIRTH.cutoffA) {
        this.radius = this.baseRadius;
        this.opacity = 1;
        this.born = true;
      } return;
    }

    // radius easing
    this.radius += (this.targetRadius - this.radius) * this.expandSpeed * dt;

    // dying animation
    if (this.dying) {
      this.radius += (0 - this.radius) * Math.min(DEATH.shrink * dt, 1);
      this.opacity += (0 - this.opacity) * DEATH.fade * dt;
      if (this.radius < DEATH.cutoffR || this.opacity < DEATH.cutoffA) {
        this.dead = true;
        this.connections.forEach(c => c.dead = true);
      }
    }
  }

  draw() {
    ctx.save();

    let [x, y] = this.getCoordinates();
    let r = this.radius;
    x = round(x, 3);
    y = round(y, 3);
    r = round(r, 3);

    ctx.globalAlpha = this.opacity;

    const path = getPath(r);
    ctx.translate(x, y);
    ctx.clip(path);

    ctx.fillStyle = this.getColor();
    ctx.fill(path);

    const expanded = r > this.baseRadius * this.revealThreshold;
    if (!this.dimmed && this.hovered && expanded && this.img && this.loaded) {
      drawImage(this.img, r);
    }

    ctx.restore();
  }
}
