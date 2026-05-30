export class Node {
  constructor(data, type = "ambient", canvas, config) {
    this.type = type;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.config = config; // { minR, maxR, lineAlpha }

    /* --- Normalized position (0 to 1) --- */
    this.nx = Math.random();
    this.ny = Math.random();

    /* --- Normalized velocity --- */
    const baseSpeed = 0.0005;
    this.vx = (Math.random() - 0.5) * baseSpeed;
    this.vy = (Math.random() - 0.5) * baseSpeed;

    /* --- Depth + radius (normalized) --- */
    if (type === "ambient") {
      this.depth = Math.random();

      // radius in pixels to convert to normalized
      const rawR =
        this.config.minR +
        Math.random() * (this.config.maxR - this.config.minR);

      this.nr = (rawR * this.config.lineAlpha(this.depth)) / 1000;

      // depth affects speed
      const speedScale = 0.3 + this.depth * 0.7;
      this.vx *= speedScale;
      this.vy *= speedScale;

      const gray = Math.floor(40 + this.depth * 160);
      this.lineGray = gray;
      this.baseFill = `rgb(${gray},${gray},${gray})`;
      this.dimmedFill = `rgba(${gray},${gray},${gray},0.15)`;
    } else {
      this.depth = 1;

      // project/publication nodes always maxR
      this.nr = this.config.maxR / 1000;

      this.lineGray = 0;
      this.baseFill = "black";
      this.dimmedFill = "rgba(0,0,0,0.1)";
    }

    this.baseNR = this.nr;
    this.targetNR = this.nr;

    /* --- Animation tuning --- */
    this.expandSpeed = data ? 0.08 : 0.02;
    this.revealThreshold = data ? 1.2 : 1.4;

    /* --- Interaction + fade --- */
    this.hovered = false;
    this.dying = false;
    this.opacity = 1;

    /* --- Image loading --- */
    this.img = null;
    if (data) {
      this.href = data.href;
      this.loaded = false;
      this.img = new Image();
      this.img.onload = () => (this.loaded = true);
      this.img.src = data.coverImage;
      this.img.alt = data.title;
    }
  }

  /* --- Update in normalized space --- */
  update() {
    // movement
    this.nx += this.vx;
    this.ny += this.vy;

    // bounce in normalized space
    if (this.nx < this.nr) {
      this.nx = this.nr;
      this.vx = Math.abs(this.vx);
    } else if (this.nx > 1 - this.nr) {
      this.nx = 1 - this.nr;
      this.vx = -Math.abs(this.vx);
    }

    if (this.ny < this.nr) {
      this.ny = this.nr;
      this.vy = Math.abs(this.vy);
    } else if (this.ny > 1 - this.nr) {
      this.ny = 1 - this.nr;
      this.vy = -Math.abs(this.vy);
    }

    // smooth radius animation
    this.nr += (this.targetNR - this.nr) * this.expandSpeed;

    // fade-out animation
    if (this.dying) {
      this.nr *= 0.9;
      this.opacity *= 0.85;
      if (this.nr < 0.0001 || this.opacity < 0.05) this.dead = true;
    }
  }

  /* --- Draw in pixel space --- */
  draw(mapX = 1, mapY = 1) {
    const ctx = this.ctx;
    const canvas = this.canvas;

    const fm = window.filterMode || { projects: false, publications: false };
    const isProject = this.type === "project";
    const isPublication = this.type === "publication";

    // filtering logic
    const dimmed =
      fm.projects || fm.publications
        ? fm.projects && !fm.publications
          ? !isProject
          : !fm.projects && fm.publications
            ? !isPublication
            : !(isProject || isPublication)
        : false;

    // convert normalized to pixel
    const x = this.nx * canvas.width;
    const y = this.ny * canvas.height;
    const r = this.nr * Math.min(canvas.width, canvas.height);
    const rx = r / Math.max(mapX, mapY);
    const ry = r / Math.max(mapX, mapY);

    ctx.save();

    // depth blur
    if (this.type === "ambient") {
      const blurAmount = Math.pow(1 - this.depth, 2) * 1.5;
      ctx.filter = `blur(${blurAmount}px)`;
    } else {
      ctx.filter = "none";
    }

    ctx.globalAlpha = this.opacity;

    // clip circle
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // fill
    ctx.fillStyle = dimmed ? this.dimmedFill : this.baseFill;
    ctx.fill();

    // image reveal
    const expandedEnough =
      r >
      this.baseNR *
      Math.min(canvas.width, canvas.height) *
      this.revealThreshold;

    if (!dimmed && this.hovered && expandedEnough && this.img && this.loaded) {
      ctx.drawImage(this.img, x - rx, y - ry, rx * 2, ry * 2);
    }

    ctx.restore();
  }
}
