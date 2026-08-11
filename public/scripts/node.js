const DIM_ALPHA = 0.15;

const canvas = document.querySelector('#heroCanvas canvas');
const ctx = canvas.getContext('2d');

const PathCache = new Map();

function round(value, places) {
  const multiplier = Math.pow(10, places);
  return Math.round(value * multiplier) / multiplier;
}

function initRadius(isAmbient) {
  const MIN_RADIUS = 5;
  const MAX_RADIUS = 40;
  return isAmbient ? MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS) : MAX_RADIUS;
}

function initVelocity() {
  const BASE_SPEED = 0.00025;
  return Math.random() * BASE_SPEED * 2 - BASE_SPEED;
}

export class Node {
  constructor(order, type = 'ambient', data = null) {
    this.order = data?.order ?? order;
    this.isAmbient = type === 'ambient';
    this.isProject = type === 'project';
    this.isPublication = type === 'publication';
    this.loaded = false;
    this.dimmed = false;
    this.hovered = false;
    this.connections = [];

    // position
    this.nx = Math.random();
    this.ny = Math.random();
    this.nz = this.isAmbient ? Math.random() * 2 - 1 : 1;
    this.visible = this.nz > 0;

    // radius
    this.pr = 0;
    this.baseRadius = initRadius(this.isAmbient);
    this.targetRadius = this.baseRadius;

    // velocity
    this.vx = initVelocity();
    this.vy = initVelocity();
    this.vz = this.isAmbient ? initVelocity() : Math.abs(initVelocity());
    this.vr = this.isAmbient ? 0.01 : 0.04;

    // display and link properties
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

  getPath(r) {
    if (PathCache.has(r)) return PathCache.get(r);

    const p = new Path2D();
    p.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
    PathCache.set(r, p);
    return p;
  }

  getColor(alpha = this.dimmed ? DIM_ALPHA : 1) {
    let color = (1 - (this.visible ? this.nz : 0)) * 255;
    color = root.classList.contains('dark') ? 255 - color : color;
    return `rgba(${color},${color},${color},${alpha})`;
  }

  addConnection(connection) {
    this.connections.push(connection);
  }

  updateHoverStatus(hovered) {
    this.hovered = hovered;
    this.targetRadius = this.baseRadius * (hovered ? 3 : 1);
  }

  update(dt) {
    this.nx += this.vx * dt;
    this.ny += this.vy * dt;
    this.nz += this.vz * dt;
    this.pr += (this.targetRadius - this.pr) * this.vr * dt;
    this.visible = this.nz > 0;

    // bounce
    const [x, y] = this.getCoordinates();
    const r = this.pr;
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
  }

  draw() {
    if (!this.visible) return;

    ctx.save();

    const [x, y] = this.getCoordinates();
    ctx.translate(round(x, 3), round(y, 3));

    const r = round(this.pr, 3);
    const path = this.getPath(r);
    ctx.clip(path);

    ctx.fillStyle = this.getColor();
    ctx.fill(path);

    if (!this.dimmed && this.hovered && this.img && this.loaded) {
      const sw = this.img.width > this.img.height ? this.img.height : this.img.width;
      const sh = this.img.width > this.img.height ? this.img.height : this.img.width;
      const sx = this.img.width > this.img.height ? (this.img.width - sw) / 2 : 0;
      const sy = this.img.width > this.img.height ? 0 : (this.img.height - sh) / 2;
      ctx.drawImage(this.img, sx, sy, sw, sh, -r, -r, r * 2, r * 2);
    }

    ctx.restore();
  }
}
