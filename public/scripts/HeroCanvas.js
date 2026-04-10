export function InitHeroCanvas({ projects = [], publications = [] }) {
  const canvas = document.getElementById("heroCanvas");
  const invertMaskCanvas = document.getElementById("invertMaskCanvas");
  const linkOverlay = document.getElementById("linkOverlay");
  const ctx = canvas.getContext("2d");
  const offscreen = document.createElement("canvas");
  const offctx = offscreen.getContext("2d", { willReadFrequently: true });
  const minR = 10;
  const maxR = 30;
  const ambientNodeCount = Math.round(window.innerWidth * window.innerHeight / 15000);
  console.log(ambientNodeCount)
  let nodes = [];
  let active = null;

  const queryInvertTargets = () => [...document.querySelectorAll(".invert-target")];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  class Node {
    constructor(data, type = "ambient") {
      this.type = type;

      // position & size
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.r = minR + Math.random() * (maxR - minR);
      if (data) {
        this.r *= 1.4;
      }
      this.baseR = this.r;
      this.targetR = this.r;

      // animation tuning
      this.expandSpeed = data ? 0.08 : 0.02;
      this.revealThreshold = data ? 1.2 : 1.4;

      // movement
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;

      // interaction
      this.hovered = false;

      // fade-out
      this.dying = false;
      this.opacity = 1;

      // images for project/publication nodes
      if (data) {
        this.href = data.href;
        this.img = new Image();
        this.loaded = false;
        this.img.onload = () => (this.loaded = true);
        this.img.src = data.coverImage;
        this.img.alt = data.title;
      } else {
        this.img = null;
      }

      this.invertedImg = null;
      this.x = Math.max(this.r, Math.min(canvas.width - this.r, this.x));
      this.y = Math.max(this.r, Math.min(canvas.height - this.r, this.y));
    }

    generateInvertedImage() {
      if (!this.img || !this.loaded) return;
      const size = this.r * 2;
      offscreen.width = size;
      offscreen.height = size;
      offctx.clearRect(0, 0, size, size);
      offctx.drawImage(this.img, 0, 0, size, size);

      const imgData = offctx.getImageData(0, 0, size, size);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      offctx.putImageData(imgData, 0, 0);
      this.invertedImg = new Image();
      this.invertedImg.src = offscreen.toDataURL();
    }

    update() {
      // movement
      this.x += this.vx;
      this.y += this.vy;

      // bounce
      if (this.x - this.r <= 0) {
        this.x = this.r;
        this.vx = Math.abs(this.vx);
      } else if (this.x + this.r >= canvas.width) {
        this.x = canvas.width - this.r;
        this.vx = -Math.abs(this.vx);
      }

      if (this.y - this.r <= 0) {
        this.y = this.r;
        this.vy = Math.abs(this.vy);
      } else if (this.y + this.r >= canvas.height) {
        this.y = canvas.height - this.r;
        this.vy = -Math.abs(this.vy);
      }

      // smooth radius animation
      this.r += (this.targetR - this.r) * this.expandSpeed;

      // keep hovered nodes from clipping edges
      if (this.hovered) {
        const push = 0.5;
        if (this.x - this.r < 0) this.x = this.r + push;
        if (this.x + this.r > canvas.width) this.x = canvas.width - this.r - push;
        if (this.y - this.r < 0) this.y = this.r + push;
        if (this.y + this.r > canvas.height) this.y = canvas.height - this.r - push;
      }

      // fade-out animation
      if (this.dying) {
        this.r *= 0.9;
        this.opacity *= 0.85;
        if (this.r < 0.5 || this.opacity < 0.05) this.dead = true;
      }
    }

    draw() {
      const fm = window.filterMode || { projects: false, publications: false };
      const isProject = this.type === "project";
      const isPublication = this.type === "publication";
      const dimmed = fm.projects || fm.publications
        ? fm.projects && !fm.publications ? !isProject
          : !fm.projects && fm.publications ? !isPublication
            : !(isProject || isPublication)
        : false;

      const overlapping = queryInvertTargets().some(t => circleIntersectsRect(this.x, this.y, this.r, t.getBoundingClientRect()));
      if (overlapping && !this.invertedImg) this.generateInvertedImage();

      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      let fill;
      if (overlapping && dimmed) {
        fill = "rgba(255,255,255,0.1)";
      } else if (dimmed) {
        fill = "rgba(0,0,0,0.1)";
      } else if (overlapping) {
        fill = "white";
      } else {
        fill = "black";
      }
      ctx.fillStyle = fill;
      ctx.fill();

      const expandedEnough = this.r > this.baseR * this.revealThreshold;
      if (!dimmed && this.hovered && expandedEnough && this.img && this.loaded) {
        ctx.drawImage(overlapping ? this.invertedImg : this.img, this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
      }
      ctx.restore();
    }
  }

  function createAmbientNode() {
    nodes.push(new Node(null, "ambient"));
  }

  function removeRandomAmbientNode() {
    const ambientNodes = nodes.filter(n => n.type === "ambient" && !n.dying);
    if (ambientNodes.length === 0) return;

    const victim = ambientNodes[Math.floor(Math.random() * ambientNodes.length)];
    victim.dying = true; // fade-out instead of instant removal
  }

  function resolveCollisions() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        // only repel project/publication nodes
        const isAContent = a.type === "project" || a.type === "publication";
        const isBContent = b.type === "project" || b.type === "publication";
        if (!isAContent || !isBContent) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.r + b.r;

        if (dist < minDist && dist > 0) {
          // normalize collision normal
          const nx = dx / dist;
          const ny = dy / dist;

          // push them apart equally
          const overlap = minDist - dist;
          const push = overlap / 2;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;

          // bounce velocities (like screen edges)
          const relVx = b.vx - a.vx;
          const relVy = b.vy - a.vy;

          const dot = relVx * nx + relVy * ny;

          if (dot < 0) {
            const bounce = 1.0; // elasticity
            const impulse = (2 * dot) / 2; // equal mass

            a.vx += impulse * nx * bounce;
            a.vy += impulse * ny * bounce;
            b.vx -= impulse * nx * bounce;
            b.vy -= impulse * ny * bounce;
          }
        }
      }
    }
  }

  projects.forEach(p => nodes.push(new Node(p, "project")));
  publications.forEach(p => nodes.push(new Node(p, "publication")));
  for (let i = 0; i < ambientNodeCount; i++) nodes.push(new Node(null, "ambient"));

  canvas.addEventListener("mousemove", e => {
    active = null;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    nodes.forEach(n => {
      const dist = Math.hypot(mx - n.x, my - n.y);
      n.hovered = dist < n.baseR * 2;
      n.targetR = n.hovered ? n.baseR * 3 : n.baseR;

      if (n.hovered && n.href) active = n;
    });

    if (active) {
      const size = active.r * 2;
      linkOverlay.href = active.href;
      linkOverlay.style.left = `${active.x - active.r}px`;
      linkOverlay.style.top = `${active.y - active.r}px`;
      linkOverlay.style.width = `${size}px`;
      linkOverlay.style.height = `${size}px`;
      linkOverlay.style.display = "block";
      canvas.style.cursor = "pointer";
    } else {
      linkOverlay.style.display = "none";
      canvas.style.cursor = "default";
    }
  });

  canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    nodes.forEach(n => {
      if (n.href) {
        const dist = Math.hypot(mx - n.x, my - n.y);
        if (dist < n.r) window.location.href = n.href;
      }
    });
  });

  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);

        if (dist < 150) {
          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  function circleIntersectsRect(cx, cy, r, rect) {
    // find the closest point on the rectangle to the circle center
    const closestX = Math.max(rect.left, Math.min(cx, rect.right));
    const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));

    // compute distance from circle center to that point
    const dx = cx - closestX;
    const dy = cy - closestY;

    // overlap if distance <= radius
    return (dx * dx + dy * dy) <= (r * r);
  }

  function drawInvertMask() {
    const mask = invertMaskCanvas;
    const mctx = mask.getContext("2d");
    mask.width = window.innerWidth;
    mask.height = window.innerHeight;
    mctx.clearRect(0, 0, mask.width, mask.height);

    const targetRects = queryInvertTargets().map(t => t.getBoundingClientRect());
    nodes.forEach(n => {
      if (targetRects.some(rect => circleIntersectsRect(n.x, n.y, n.r, rect))) {
        mctx.beginPath();
        mctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        mctx.fillStyle = "white";
        mctx.fill();
      }
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    nodes.forEach(n => {
      n.update();
      n.draw();
    });

    resolveCollisions();
    drawInvertMask();

    nodes = nodes.filter(n => !n.dead);

    drawConnections();
    requestAnimationFrame(animate);
  }

  animate();

  setInterval(() => {
    Math.random() < 0.5 ? createAmbientNode() : removeRandomAmbientNode();
  }, 1500);
}