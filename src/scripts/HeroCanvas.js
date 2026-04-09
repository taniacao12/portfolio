export function initHeroCanvas({ projects, publications }) {
  console.log("Initializing HeroCanvas with data:", { projects, publications });
  /* -------------------------------------------------------
   * 1. DOM + Canvas Setup
   * ----------------------------------------------------- */
  const canvas = document.getElementById("heroCanvas");
  const linkOverlay = document.getElementById("linkOverlay");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  /* -------------------------------------------------------
   * 2. State & Constants
   * ----------------------------------------------------- */
  const projectData = projects || [];
  const publicationData = publications || [];
  const NODE_COUNT = 50;

  let nodes = [];
  let activeProject = null;

  /* -------------------------------------------------------
   * 3. Utility: Ambient Node Management
   * ----------------------------------------------------- */
  function createAmbientNode() {
    nodes.push(new Node(null, "ambient"));
  }

  function removeRandomAmbientNode() {
    const ambientNodes = nodes.filter(n => n.type === "ambient" && !n.dying);
    if (ambientNodes.length === 0) return;

    const victim = ambientNodes[Math.floor(Math.random() * ambientNodes.length)];
    victim.dying = true; // fade-out instead of instant removal
  }

  /* -------------------------------------------------------
   * 4. Node Class
   * ----------------------------------------------------- */
  class Node {
    constructor(data, type = "ambient") {
      this.type = type;

      // position & size
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.r = data ? 50 : 4 + Math.random() * 10;
      this.baseR = this.r;
      this.targetR = this.r;

      // animation tuning
      this.expandSpeed = data ? 0.08 : 0.015;
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
        this.img.onload = () => (this.loaded = true);
        this.img.src = data.coverImage;
      } else {
        this.img = null;
      }

      // clamp inside canvas
      this.x = Math.max(this.r, Math.min(canvas.width - this.r, this.x));
      this.y = Math.max(this.r, Math.min(canvas.height - this.r, this.y));
    }

    update() {
      /* movement */
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

      /* smooth radius animation */
      this.r += (this.targetR - this.r) * this.expandSpeed;

      /* keep hovered nodes from clipping edges */
      if (this.hovered) {
        const push = 0.5;
        if (this.x - this.r < 0) this.x = this.r + push;
        if (this.x + this.r > canvas.width) this.x = canvas.width - this.r - push;
        if (this.y - this.r < 0) this.y = this.r + push;
        if (this.y + this.r > canvas.height) this.y = canvas.height - this.r - push;
      }

      /* fade-out animation */
      if (this.dying) {
        this.r *= 0.9;
        this.opacity *= 0.85;
        if (this.r < 0.5 || this.opacity < 0.05) this.dead = true;
      }
    }

    draw() {
      ctx.save();

      /* filtering logic */
      const fm = window.filterMode || { projects: false, publications: false };
      const isProject = this.type === "project";
      const isPublication = this.type === "publication";

      let dimmed = false;

      if (!fm.projects && !fm.publications) dimmed = false;
      else if (fm.projects && !fm.publications) dimmed = !isProject;
      else if (!fm.projects && fm.publications) dimmed = !isPublication;
      else if (fm.projects && fm.publications) dimmed = !(isProject || isPublication);

      /* draw base circle */
      ctx.globalAlpha = this.opacity;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = dimmed ? "rgba(0,0,0,0.1)" : "black";
      ctx.fill();

      /* reveal image */
      const expandedEnough = this.r > this.baseR * this.revealThreshold;
      if (!dimmed && this.hovered && expandedEnough && this.img && this.loaded) {
        ctx.drawImage(this.img, this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
      }

      ctx.restore();
    }
  }

  /* -------------------------------------------------------
   * 5. Initialization: Create Nodes
   * ----------------------------------------------------- */
  projectData.forEach(p => nodes.push(new Node(p, "project")));
  publicationData.forEach(p => nodes.push(new Node(p, "publication")));
  for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Node(null, "ambient"));

  /* -------------------------------------------------------
   * 6. Event Listeners
   * ----------------------------------------------------- */
  canvas.addEventListener("mousemove", e => {
    activeProject = null;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    nodes.forEach(n => {
      const dist = Math.hypot(mx - n.x, my - n.y);
      n.hovered = dist < n.baseR * 2;
      n.targetR = n.hovered ? n.baseR * 3 : n.baseR;

      if (n.hovered && n.href) activeProject = n;
    });

    if (activeProject) {
      const size = activeProject.r * 2;
      linkOverlay.href = activeProject.href;
      linkOverlay.style.left = `${activeProject.x - activeProject.r}px`;
      linkOverlay.style.top = `${activeProject.y - activeProject.r}px`;
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

  /* -------------------------------------------------------
   * 7. Draw Connections
   * ----------------------------------------------------- */
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

  /* -------------------------------------------------------
   * 8. Animation Loop
   * ----------------------------------------------------- */
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    nodes.forEach(n => {
      n.update();
      n.draw();
    });

    nodes = nodes.filter(n => !n.dead);

    drawConnections();
    requestAnimationFrame(animate);
  }

  animate();

  /* -------------------------------------------------------
   * 9. Ambient Randomizer
   * ----------------------------------------------------- */
  setInterval(() => {
    Math.random() < 0.5 ? createAmbientNode() : removeRandomAmbientNode();
  }, 2000);
}