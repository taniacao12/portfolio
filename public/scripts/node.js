const MIN_RADIUS = 5;
const MAX_RADIUS = 40;
const START_NR = 0.1;
const HOVER_NR = 3;
const SCALE_SPEED = 0.01;
const MOVE_SPEED = 0.00025;
const MIN_RBG = 0;
const MAX_RBG = 255;
const DIM_ALPHA = 0.15;

const canvas = document.querySelector('#heroCanvas canvas');
const ctx = canvas.getContext('2d');

const invCell = 1 / (MAX_RADIUS * HOVER_NR * 2);

function initDimmed(filterMode, type) {
  if (!filterMode.projects && !filterMode.publications) return false;
  return type === 'project'
    ? !filterMode.projects
    : type === 'publication'
      ? !filterMode.publications
      : true;
}

function getColor(nz) {
  const isDark = root.classList.contains('dark');
  const c = MIN_RBG + (isDark ? nz : 1 - nz) * (MAX_RBG - MIN_RBG);
  return (isDark ? Math.floor : Math.ceil)(c);
}

const round = v => Math.round(v * 1000) * 0.001; // to 3 decimal places
const rgb = (c, o) => `rgba(${c},${c},${c},${o})`;

export class Node {
  constructor(filterMode, order, data) {
    this.order = order;
    this.type = data ? data.type : 'ambient';
    this.dimmed = initDimmed(filterMode, this.type);

    // position
    this.nx = Math.random();
    this.ny = Math.random();
    this.nz = this.type === 'ambient' ? Math.random() * 2 - 1 : 1;
    this.x = this.nx * canvas.width;
    this.y = this.ny * canvas.height;

    // radius
    this.tr = this.type === 'ambient' ? MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS) : MAX_RADIUS;
    this.nr = START_NR;
    this.tnr = 1;
    this.r = this.tr * this.nr * this.nz;

    // velocity
    this.vx = Math.random() * MOVE_SPEED * 2 - MOVE_SPEED;
    this.vy = Math.random() * MOVE_SPEED * 2 - MOVE_SPEED;
    this.vz = this.type === 'ambient' ? Math.random() * MOVE_SPEED * 2 - MOVE_SPEED : 0;
    this.vr = SCALE_SPEED;

    // display
    this.visible = this.nz > 0;
    this.color = getColor(this.nz);
    this.opacity = this.dimmed ? DIM_ALPHA : 1
    this.hovered = false;

    // cell
    this.cx0 = null;
    this.cy0 = null;
    const inv = 1 / (MAX_RADIUS * HOVER_NR * 2);
    this.cx1 = (this.x * inv) | 0;
    this.cy1 = (this.y * inv) | 0;


    // link properties
    this.href = data ? data.href : null;
    this.img = data ? new Image() : null;
    this.loaded = false;
    if (data) {
      this.img.src = data.coverImage;
      this.img.alt = data.title;
      this.img.onload = () => (this.loaded = true);
    }
  }

  updateHoverStatus(hovered) {
    this.hovered = hovered;
    this.tnr = hovered ? HOVER_NR : 1;
  }

  update(dt) {
    const w = canvas.width;
    const h = canvas.height;

    // position
    this.nx += this.vx * dt;
    this.ny += this.vy * dt;
    this.nz += this.vz * dt;
    this.x = this.nx * w;
    this.y = this.ny * h;

    // bounce
    if (this.x - this.r <= 0 || this.x + this.r >= w) {
      this.vx = -this.vx;
      const minX = this.r / w;
      const maxX = 1 - minX;
      this.nx = this.nx < minX ? minX : this.nx > maxX ? maxX : this.nx;
      this.x = this.nx * w;
    } if (this.y - this.r <= 0 || this.y + this.r >= h) {
      this.vy = -this.vy;
      const minY = this.r / h;
      const maxY = 1 - minY;
      this.ny = this.ny < minY ? minY : this.ny > maxY ? maxY : this.ny;
      this.y = this.ny * h;
    } if (this.nz <= -1 || this.nz >= 1) {
      if (this.type === 'ambient') this.vz = -this.vz;
      else this.vz = 0;
      this.nz = this.nz < -1 ? -1 : this.nz > 1 ? 1 : this.nz;
    }

    // radius
    this.nr += (this.tnr - this.nr) * this.vr * dt;
    this.r = this.tr * this.nr * this.nz;

    // cell
    this.cx0 = this.cx1;
    this.cy0 = this.cy1;
    this.cx1 = (this.x * invCell) | 0;
    this.cy1 = (this.y * invCell) | 0;

    // display
    this.visible = this.nz > 0;
    this.color = getColor(this.nz);
    this.opacity = this.dimmed ? DIM_ALPHA : 1
  }

  draw() {
    if (!this.visible) return;

    ctx.save();

    ctx.translate(round(this.x), round(this.y));

    const r = round(this.r);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = rgb(this.color, this.opacity);
    ctx.fill();
    ctx.clip();

    if (!this.dimmed && this.hovered && this.img && this.loaded) {
      const s = Math.min(this.img.width, this.img.height);
      const sx = (this.img.width - s) / 2;
      const sy = (this.img.height - s) / 2;
      ctx.drawImage(this.img, sx, sy, s, s, -r, -r, r * 2, r * 2);
    }

    ctx.restore();
  }
}
