const canvas = document.getElementById("heroCanvas");
const wrapper = canvas.parentElement;
const ctx = canvas.getContext("2d");

const minR = 10;
const maxR = 30;
const baseSpeed = 0.0005;
const ambientSpeedMin = 0.3;
const ambientSpeedMax = 1.0;
const ambientGrayMin = 50;
const ambientGrayMax = 200;
const dimAlpha = 0.15;
const blurMax = 1.5;
const expandSpeedData = 0.08;
const expandSpeedAmbient = 0.02;
const revealThresholdData = 1.2;
const revealThresholdAmbient = 1.4;
const deathShrink = 0.9;
const deathFade = 0.7;
const deathCutoffR = 0.0001;
const deathCutoffA = 0.05;

const PathCache = new Map(), BlurCache = new Map(), FillCache = new Map();

function getEllipsePath(r) {
  if (!PathCache.has(r)) {
    const p = new Path2D();
    p.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
    PathCache.set(r, p);
  }
  return PathCache.get(r);
}

function getBlur(depth) {
  if (!BlurCache.has(depth)) {
    BlurCache.set(depth, `blur(${Math.pow(1 - depth, 2) * blurMax}px)`);
  }
  return BlurCache.get(depth);
}

function getFill(type, gray, dimmed, isDark) {
  const key = `${type}|${gray}|${dimmed}|${isDark}`;
  if (FillCache.has(key)) return FillCache.get(key);

  let fill;
  if (type === "ambient") {
    const g = isDark ? 250 - gray : gray;
    fill = dimmed ? `rgba(${g},${g},${g},${dimAlpha})` : `rgb(${g},${g},${g})`;
  } else {
    fill = isDark
      ? dimmed ? `rgba(255,255,255,${dimAlpha})` : "white"
      : dimmed ? `rgba(0,0,0,${dimAlpha})` : "black";
  }

  FillCache.set(key, fill);
  return fill;
}

export class Node {
  constructor(type = "ambient", data) {
    this.type = type;
    this.nx = Math.random();
    this.ny = Math.random();
    this.vx = (Math.random() - 0.5) * baseSpeed;
    this.vy = (Math.random() - 0.5) * baseSpeed;
    this.connections = [];
    this.dead = false;

    const isAmbient = type === "ambient";
    this.depth = isAmbient ? Math.random() : 1;

    const rawR = isAmbient ? minR + Math.random() * (maxR - minR) : maxR;
    this.nr = (rawR * this.getLineAlpha()) / 1000;
    this.baseNR = this.nr;
    this.targetNR = this.nr;

    if (isAmbient) {
      const speedScale = ambientSpeedMin + this.depth * (ambientSpeedMax - ambientSpeedMin);
      this.vx *= speedScale;
      this.vy *= speedScale;
      this.lineGray = ambientGrayMin + this.depth * (ambientGrayMax - ambientGrayMin);
    } else {
      this.lineGray = 0;
    }

    this.expandSpeed = data ? expandSpeedData : expandSpeedAmbient;
    this.revealThreshold = data ? revealThresholdData : revealThresholdAmbient;
    this.hovered = false;
    this.dying = false;
    this.opacity = 1;

    this.loaded = false;
    if (data) {
      this.href = data.href;
      this.img = new Image();
      this.img.onload = () => (this.loaded = true);
      this.img.src = data.coverImage;
      this.img.alt = data.title;
    } else {
      this.href = null;
      this.img = null;
    }
  }

  addConnection(connection) {
    this.connections.push(connection);
  }

  getCoordinates() {
    return [this.nx * canvas.width, this.ny * canvas.height];
  }

  getRadius() {
    return this.nr * Math.min(canvas.width, canvas.height);
  }

  getLineAlpha() {
    return 0.2 + this.depth * 0.8;
  }

  update() {
    this.nx += this.vx;
    this.ny += this.vy;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    if (this.nx < this.nr || this.nx > 1 - this.nr) {
      this.vx *= -1;
      this.nx = clamp(this.nx, this.nr, 1 - this.nr);
    }
    if (this.ny < this.nr || this.ny > 1 - this.nr) {
      this.vy *= -1;
      this.ny = clamp(this.ny, this.nr, 1 - this.nr);
    }

    this.nr += (this.targetNR - this.nr) * this.expandSpeed;

    if (this.dying) {
      this.nr *= deathShrink;
      this.opacity *= deathFade;
      if (this.nr < deathCutoffR || this.opacity < deathCutoffA) {
        this.dead = true;
        this.connections.forEach((c) => (c.dead = true));

      }
    }
  }

  draw() {
    const fm = filterMode || { projects: false, publications: false };
    const isProject = this.type === "project";
    const isPublication = this.type === "publication";

    const dimmed =
      fm.projects || fm.publications
        ? fm.projects && !fm.publications
          ? !isProject
          : !fm.projects && fm.publications
            ? !isPublication
            : !(isProject || isPublication)
        : false;

    const [x, y] = this.getCoordinates();
    const r = this.getRadius();

    ctx.save();
    ctx.filter = this.type === "ambient" ? getBlur(this.depth) : "none";
    ctx.globalAlpha = this.opacity;

    const path = getEllipsePath(r, r);
    ctx.translate(x, y);
    ctx.clip(path);

    const isDark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = getFill(this.type, this.lineGray, dimmed, isDark);
    ctx.fill(path);

    const expanded = r > this.baseNR * Math.min(canvas.width, canvas.height) * this.revealThreshold;
    if (!dimmed && this.hovered && expanded && this.img && this.loaded) {
      ctx.drawImage(this.img, -r, -r, r * 2, r * 2);
    }

    ctx.restore();
  }
}