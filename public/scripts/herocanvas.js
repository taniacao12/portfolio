import { Node } from "./node.js";
import { Connection, maxDist } from "./connection.js";

const headerMenu = document.getElementById("headerMenu");
const filterBtn = document.getElementById("filterBtn");
const projectsBtn = document.getElementById("projectsBtn");
const galleryPanel = document.getElementById("galleryPanel");
const canvas = document.getElementById("heroCanvas");
const wrapper = canvas.parentElement;
const ctx = canvas.getContext("2d");

const ambientDensity = 15000;
const ambientPulseInterval = 1500;

const cellKey = (x, y) => `${x},${y}`;

export function InitHeroCanvas({ projects = [], publications = [] }) {
  let lastTime = performance.now();

  function resize() {
    const nav = document.querySelector("nav");
    const footer = document.querySelector("footer");
    const main = document.querySelector("main");
    const galleryPanel = document.getElementById("galleryPanel");
    const hScrollbar =
      (document.documentElement.scrollWidth > window.innerWidth) *
      window.scrollbarHeight;

    canvas.width = wrapper.clientWidth;
    canvas.height = window.innerHeight -
      nav.offsetHeight -
      footer.offsetHeight -
      parseFloat(getComputedStyle(main).gap) -
      galleryPanel.offsetHeight -
      hScrollbar;
    debug("canvas size:", canvas.width, canvas.height);
  }

  function resolveCollisions() {
    const grid = new Map();
    const dist = maxDist;

    for (const n of nodes) {
      const [x, y] = n.getCoordinates();
      const cx = Math.floor(x / dist);
      const cy = Math.floor(y / dist);
      const key = cellKey(cx, cy);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push({ node: n, p: { x, y, r: n.getRadius() } });
    }

    const offsets = [
      [0, 0], [1, 0], [0, 1], [1, 1],
      [-1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1]
    ];

    for (const [key, A] of grid) {
      const [cx, cy] = key.split(",").map(Number);

      for (const [ox, oy] of offsets) {
        const B = grid.get(cellKey(cx + ox, cy + oy));
        if (!B) continue;

        for (let i = 0; i < A.length; i++) {
          const a = A[i];
          const start = key === cellKey(cx + ox, cy + oy) ? i + 1 : 0;

          for (let j = start; j < B.length; j++) {
            const b = B[j];
            const na = a.node, nb = b.node;
            if (na.type === "ambient" || nb.type === "ambient") continue;

            const dx = b.p.x - a.p.x;
            const dy = b.p.y - a.p.y;
            const dist = Math.hypot(dx, dy);
            const minD = a.p.r + b.p.r;

            if (dist < minD && dist > 0) {
              const nx = dx / dist, ny = dy / dist;
              const push = (minD - dist) / 2;
              const px = (nx * push) / canvas.width;
              const py = (ny * push) / canvas.height;

              na.nx -= px; na.ny -= py;
              nb.nx += px; nb.ny += py;

              const rvx = nb.vx - na.vx;
              const rvy = nb.vy - na.vy;
              const dot = rvx * nx + rvy * ny;

              if (dot < 0) {
                const imp = (2 * dot) / 2;
                na.vx += imp * nx; na.vy += imp * ny;
                nb.vx -= imp * nx; nb.vy -= imp * ny;
              }
            }
          }
        }
      }
    }
  }

  function animate(now) {
    const dt = (now - lastTime) / 16.67;
    lastTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Depth sort (back to front)
    const geo = [...connections, ...nodes];
    geo.forEach((g) => g.update());
    geo.sort((a, b) => (a.depth || 0) - (b.depth || 0));
    geo.forEach((g) => g.draw());

    resolveCollisions();

    nodes = nodes.filter((n) => !n.dead);
    connections = connections.filter((c) => !c.dead);

    requestAnimationFrame(animate);
  }

  // initialize canvas
  resize();

  // initialize nodes
  let nodes = [];
  const ambientCount = Math.round((canvas.width * canvas.height) / ambientDensity);
  const maxAmbient = parseInt(ambientCount * 1.5);
  debug("max ambient node count:", maxAmbient);
  debug("initial ambient node count:", ambientCount);

  [...projects, ...publications].forEach((d, i) =>
    nodes.push(new Node(i < projects.length ? "project" : "publication", d))
  );
  for (let i = 0; i < ambientCount; i++) nodes.push(new Node("ambient"));

  // initialize connections
  let connections = [];
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      connections.push(new Connection(nodes[i], nodes[j]));

  // initiate animation
  requestAnimationFrame(animate);

  // event listeners
  const resizeObserver = new ResizeObserver(() => {
    resize();
  });
  resizeObserver.observe(wrapper.parentElement);

  setInterval(() => {
    const ambientNodes = nodes.filter(n => n.type === "ambient" && !n.dying);
    if (ambientNodes.length < maxAmbient) {
      if (Math.random() < 0.5) {
        const newNode = new Node("ambient");
        for (let i = 0; i < nodes.length - 1; i++) {
          connections.push(new Connection(nodes[i], newNode));
        } nodes.push(newNode);
      }
    } else {
      const amb = nodes.filter((n) => n.type === "ambient" && !n.dying);
      if (!amb.length) return;
      amb[Math.floor(Math.random() * amb.length)].dying = true;
    }
  }, ambientPulseInterval);

  document.querySelectorAll("#galleryPanel a").forEach(a => {
    a.addEventListener("mouseenter", () => {
      // clear canvas hover state
      nodes.forEach(n => {
        n.hovered = false;
        n.targetNR = n.baseNR;
      });
      
      const href = new URL(a.href).pathname;
      const node = nodes.find(n => n.href === href);
      if (node) {
        node.hovered = true;
        node.targetNR = node.baseNR * 3;
      }
    });

    a.addEventListener("mouseleave", () => {
      const href = new URL(a.href).pathname;
      const node = nodes.find(n => n.href === href);
      if (node) {
        node.hovered = false;
        node.targetNR = node.baseNR;
      }
    });
  });


  const linkOverlay = document.getElementById("linkOverlay");
  let active = null;

  canvas.addEventListener("mousemove", function (e) {
    let mx = e.offsetX, my = e.offsetY;

    let closest = null, closestDist = Infinity;
    for (const n of nodes) {
      const [x, y] = n.getCoordinates();
      const d = Math.hypot(mx - x, my - y);
      if (d < closestDist) (closestDist = d), (closest = n);
    }

    nodes.forEach((n) => {
      const h = n === closest && closestDist < n.getRadius();
      n.hovered = h;
      n.targetNR = h ? n.baseNR * 3 : n.baseNR;
    });

    active = closest && closest.href && closest.hovered ? closest : null;

    if (active) {
      const [x, y] = active.getCoordinates();
      const r = active.getRadius();
      linkOverlay.href = active.href;
      linkOverlay.style.display = "block";
      linkOverlay.style.left = `${x - r}px`;
      linkOverlay.style.top = `${y - r}px`;
      linkOverlay.style.width = linkOverlay.style.height = `${r * 2}px`;
      linkOverlay.style.pointerEvents = "auto";
      linkOverlay.style.cursor = "pointer";
    } else {
      linkOverlay.style.display = "none";
      linkOverlay.style.pointerEvents = "none";
    }
  });

  canvas.addEventListener("click", function (e) {
    const mx = e.offsetX, my = e.offsetY;
    for (const n of nodes) {
      if (n.href) {
        const [x, y] = n.getCoordinates();
        if (Math.hypot(mx - x, my - y) < n.getRadius()) {
          location.href = n.href;
          break;
        }
      }
    }
  });

  galleryPanel.addEventListener("transitionend", () => {
    wrapper.classList.toggle("active");
  });
}
