const BASE_Z = 1;
const MIN_NR = 0;
const BASE_NR = 1;
const DIM_ALPHA = 0.15;
const RADIUS_SPEED = 0.01;

const canvas = document.querySelector('#heroCanvas canvas');
const ctx = canvas.getContext('2d');

const PathCache = new Map();

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function round(value, places) {
  const multiplier = Math.pow(10, places);
  return Math.round(value * multiplier) / multiplier;
}

function initDimmed(filterMode, type) {
  if (!filterMode.projects && !filterMode.publications) {
    return false;
  } if (type === "project") {
    return !filterMode.projects;
  } if (type === "publication") {
    return !filterMode.publications;
  } return true;
}

function initRadius(isAmbient) {
  const MIN_RADIUS = 5;
  const MAX_RADIUS = 40;
  return isAmbient ? MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS) : MAX_RADIUS;
}

function initVelocity() {
  const BASE_SPEED = 0.00025;
  const velocity = Math.random() * BASE_SPEED * 2 - BASE_SPEED;
  return velocity !== 0 ? velocity : initVelocity();
}

export class Node {
  constructor(filterMode, order = 0, data = null) {
    this.order = order;
    this.type = data ? data.type : "ambient";
    this.dimmed = initDimmed(filterMode, this.type);
    this.loaded = false;
    this.hovered = false;
    this.connections = [];

    // position
    this.nx = Math.random();
    this.ny = Math.random();
    this.nz = this.type === "ambient" ? Math.random() * BASE_Z * 2 - BASE_Z : BASE_Z;
    this.visible = this.nz > 0;

    // radius
    this.pr = initRadius(this.type === "ambient");
    this.nr = MIN_NR;
    this.tr = BASE_NR;
    this.vr = RADIUS_SPEED;

    // velocity
    this.vx = initVelocity();
    this.vy = initVelocity();
    this.vz = this.type === "ambient" ? initVelocity() : Math.abs(initVelocity());

    // display and link properties
    this.href = data ? data.href : null;
    this.img = data ? new Image() : null;
    if (data) {
      this.img.src = data.coverImage;
      this.img.alt = data.title;
      this.img.onload = () => (this.loaded = true);
    }
  }

  getCoordinates() {
    return [this.nx * canvas.width, this.ny * canvas.height];
  }

  getRadius() {
    return this.pr * this.nr * this.nz;
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
    color = root.classList.contains('dark') ? Math.floor(255 - color) : Math.ceil(color);
    return `rgba(${color},${color},${color},${round(alpha, 3)})`;
  }

  addConnection(connection) {
    this.connections.push(connection);
  }

  updateHoverStatus(hovered) {
    const MAX_NR = 3;

    this.hovered = hovered;
    this.tr = hovered ? MAX_NR : BASE_NR;
  }

  update(dt) {
    // position
    this.nx += this.vx * dt;
    this.ny += this.vy * dt;
    this.nz += this.vz * dt;
    this.visible = this.nz > 0;

    // radius
    this.nr += (this.tr - this.nr) * this.vr * dt;

    // bounce
    const [x, y] = this.getCoordinates();
    const r = this.getRadius();
    if (x - r <= 0 || x + r >= canvas.width) {
      this.vx *= -1;
      const minX = r / canvas.width;
      const maxX = 1 - minX;
      this.nx = clamp(this.nx, minX, maxX);
    } if (y - r <= 0 || y + r >= canvas.height) {
      this.vy *= -1;
      const minY = r / canvas.height;
      const maxY = 1 - minY;
      this.ny = clamp(this.ny, minY, maxY);
    } if (this.nz <= -1 || this.nz >= 1) {
      if (this.type === "ambient") {
        this.vz *= -1;
      } else this.vz = 0;
      this.nz = clamp(this.nz, -1, 1);
    }
  }

  draw() {
    if (!this.visible) return;

    ctx.save();

    const [x, y] = this.getCoordinates();
    ctx.translate(round(x, 3), round(y, 3));

    const r = round(this.getRadius(), 3);
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
