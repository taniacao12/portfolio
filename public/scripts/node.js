const canvas = document.querySelector(".canvasContainer canvas");
const ctx = canvas.getContext("2d");

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
    const MIN = 50;
    const MAX = 200;
    return Math.round(MIN + depth * (MAX - MIN));
  } return 0;
}

const BlurCache = new Map();
function getBlur(depth) {
  const BLUR_MAX = 1.5;
  if (!BlurCache.has(depth)) {
    const blur = Math.pow(1 - depth, 2) * BLUR_MAX;
    BlurCache.set(depth, `blur(${blur}px)`);
  } return BlurCache.get(depth);
}

const PathCache = new Map();
function getPath(r) {
  if (!PathCache.has(r)) {
    const p = new Path2D();
    if (r < 0) r = 0;
    p.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
    PathCache.set(r, p);
  } return PathCache.get(r);
}

const FillCache = new Map();
function getFill(isAmbient, color, dimmed, isDark) {
  const DIM_ALPHA = 0.15;
  const key = `${isAmbient}|${color}|${dimmed}|${isDark}`;
  if (FillCache.has(key)) return FillCache.get(key);

  let c;
  if (isAmbient) {
    c = isDark
      ? (dimmed ? 280 - color : 250 - color)
      : color;
  } else c = isDark ? 255 : 0;
  const fill = dimmed
    ? `rgba(${c},${c},${c},${DIM_ALPHA})`
    : `rgba(${c},${c},${c},1)`;
  FillCache.set(key, fill);
  return fill;
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
  constructor(type = "ambient", data) {
    this.order = data?.order ?? 0;
    this.isAmbient = type === "ambient";
    this.isProject = type === "project";
    this.isPublication = type === "publication";
    this.born = false;
    this.isDead = false;
    this.dying = false;
    this.hovered = false;
    this.loaded = false;
    this.opacity = this.born ? 1 : 0;
    this.connections = [];

    // depth & radius
    this.depth = this.isAmbient ? Math.random() : 1;
    this.depthAlpha = 0.2 + this.depth * 0.8;
    this.radius = this.born ? this.baseRadius : 0;
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

  addConnection(connection) {
    this.connections.push(connection);
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
        this.isDead = true;
        this.connections.forEach(c => c.isDead = true);
      }
    }
  }

  draw() {
    ctx.save();

    const isDark = document.documentElement.classList.contains("dark");
    const filterMode = JSON.parse(sessionStorage.getItem("filterMode"));
    const dimmed =
      filterMode.projects || filterMode.publications
        ? filterMode.projects && !filterMode.publications
          ? !this.isProject
          : !filterMode.projects && filterMode.publications
            ? !this.isPublication
            : !(this.isProject || this.isPublication)
        : false;
    const [x, y] = this.getCoordinates();
    const r = this.radius;

    ctx.filter = this.isAmbient ? getBlur(this.depth) : "none";
    ctx.globalAlpha = this.opacity;

    const path = getPath(r);
    ctx.translate(x, y);
    ctx.clip(path);

    ctx.fillStyle = getFill(this.isAmbient, this.color, dimmed, isDark);
    ctx.fill(path);

    const expanded = r > this.baseRadius * this.revealThreshold;
    if (!dimmed && this.hovered && expanded && this.img && this.loaded) {
      drawImage(this.img, r);
    }

    ctx.restore();
  }
}
