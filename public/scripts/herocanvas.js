import { Node } from './node.js';
import { Connection, MAXDIST } from './connection.js';

const AMBIENT_DENSITY = 15000;

const filterGroup = document.getElementById('filterGroup');
const projectsBtn = filterGroup.children[1];
const publicationsBtn = filterGroup.children[2];
const directory = document.querySelector('aside');
const heroCanvas = document.getElementById('heroCanvas');
const canvas = heroCanvas.querySelector('canvas');
const linkOverlay = heroCanvas.querySelector('a');
const ctx = canvas.getContext('2d');

let nodes = [];
let connections = [];
let paused = true;
let lastTime = null;

const cellKey = (x, y) => `${x},${y}`;

// -------------------------------------
// Canvas / layout
// -------------------------------------
function resizeCanvas() {
  if (canvas.width == heroCanvas.clientWidth &&
    canvas.height == heroCanvas.clientHeight) return;
  canvas.width = heroCanvas.clientWidth;
  canvas.height = heroCanvas.clientHeight;
  // console.log('canvas size:', canvas.width, canvas.height);
}

// -------------------------------------
// Collision resolution
// -------------------------------------
function resolveCollisions() {
  const grid = new Map();

  // bucket nodes into grid cells
  for (const n of nodes) {
    const [x, y] = n.getCoordinates();
    const r = n.getRadius();
    const cx = Math.floor(n.nx / MAXDIST);
    const cy = Math.floor(n.ny / MAXDIST);
    const key = cellKey(cx, cy);

    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push({ node: n, p: { x, y, r } });
  }

  const offsets = [
    [0, 0], [1, 0], [0, 1], [1, 1],
    [-1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1]
  ];

  for (const [key, A] of grid) {
    const [cx, cy] = key.split(',').map(Number);

    for (const [ox, oy] of offsets) {
      const B = grid.get(cellKey(cx + ox, cy + oy));
      if (!B) continue;

      for (let i = 0; i < A.length; i++) {
        const a = A[i];
        const start = key === cellKey(cx + ox, cy + oy) ? i + 1 : 0;

        for (let j = start; j < B.length; j++) {
          const b = B[j];
          const na = a.node, nb = b.node;
          if (na.nz != nb.nz) continue;

          const dx = b.p.x - a.p.x;
          const dy = b.p.y - a.p.y;
          const dist = Math.hypot(dx, dy);
          const minD = a.p.r + b.p.r;

          if (dist > 0 && dist < minD) {
            const nx = dx / dist, ny = dy / dist;
            const push = (minD - dist) / 2;

            na.nx -= (nx * push) / canvas.width;
            na.ny -= (ny * push) / canvas.height;
            nb.nx += (nx * push) / canvas.width;
            nb.ny += (ny * push) / canvas.height;

            const rvx = nb.vx - na.vx;
            const rvy = nb.vy - na.vy;
            const dot = rvx * nx + rvy * ny;

            if (dot < 0) {
              const imp = (2 * dot) / 2;
              na.vx += imp * nx;
              na.vy += imp * ny;
              nb.vx -= imp * nx;
              nb.vy -= imp * ny;
            }
          }
        }
      }
    }
  }
}

// -------------------------------------
// Update / draw pipeline
// -------------------------------------
function updateDimmedNodes() {
  let filterMode = JSON.parse(sessionStorage.getItem('filterMode'));
  nodes.forEach(node => {
    if (!filterMode.projects && !filterMode.publications) {
      node.dimmed = false;
    } else if (filterMode.projects && !filterMode.publications) {
      node.dimmed = !(node.type === "project");
    } else if (!filterMode.projects && filterMode.publications) {
      node.dimmed = !(node.type === "publication");
    } else node.dimmed = !(node.type === "project" || node.type === "publication");
  });
}

function updateGeometry(dt) {
  for (const g of nodes) g.update(dt);
  for (const g of connections) g.update(dt);
}

function sortGeometry() {
  const geo = [...nodes, ...connections];
  geo.sort((a, b) => {
    if (a.nz !== b.nz) return a.nz - b.nz;
    if (a instanceof Node && b instanceof Connection ||
      a instanceof Connection && b instanceof Node) {
      return a.nz === 1 ? a instanceof Node ? 1 : -1 : a instanceof Node ? -1 : 1;
    } return a.order - b.order;
  });
  return geo;
}

function drawGeometry(sorted) {
  for (const g of sorted) g.draw();
}

// -------------------------------------
// Animation loop
// -------------------------------------
function resumeAnimation() {
  paused = false;
  lastTime = performance.now();
  requestAnimationFrame(animate);
}

function pauseAnimation() {
  paused = true;
}

function animate(now) {
  if (paused) return;

  let dt = (now - lastTime) / 16.67;
  dt = Math.min(Math.max(dt, 0), 10);
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateGeometry(dt);
  const geo = sortGeometry();
  drawGeometry(geo);
  resolveCollisions();

  requestAnimationFrame(animate);
}

// -------------------------------------
// Hover animations
// -------------------------------------
function handleDirectoryHover(el) {
  const href = new URL(el.href).pathname;
  const node = nodes.find(n => n.href === href);

  el.addEventListener('mouseenter', () => {
    nodes.forEach(n => n.updateHoverStatus(false));

    if (node) node.updateHoverStatus(true);
  });

  el.addEventListener('mouseleave', () => {
    if (node) node.updateHoverStatus(false);
  });
}

function handleCanvasHover(e) {
  nodes.forEach(n => n.updateHoverStatus(false));

  const mx = e.offsetX, my = e.offsetY;
  let closestNode = null, closestDist = Infinity;
  for (const n of nodes) {
    if (!n.visible) continue;

    const [x, y] = n.getCoordinates();
    const d = Math.hypot(mx - x, my - y);
    if (d < closestDist && d <= n.getRadius()) {
      closestDist = d;
      closestNode = n;
    }
  }

  if (closestNode) closestNode.updateHoverStatus(true);
  if (closestNode && closestNode.type != "ambient") {
    const [x, y] = closestNode.getCoordinates();
    const r = closestNode.getRadius();
    linkOverlay.classList.toggle('hide');
    linkOverlay.href = closestNode.href;
    linkOverlay.style.left = `${x - r}px`;
    linkOverlay.style.top = `${y - r}px`;
    linkOverlay.style.width = linkOverlay.style.height = `${r * 2}px`;
  } else if (!linkOverlay.classList.contains('hide')) {
    linkOverlay.classList.toggle('hide');
    linkOverlay.removeAttribute('href');
    linkOverlay.removeAttribute('style');
  }
}

// -----------------------------
// Node click handler
// -----------------------------
function handleCanvasClick(e) {
  const mx = e.offsetX, my = e.offsetY;

  for (const n of nodes) {
    if (!n.visible || n.type === "ambient") continue;

    const [x, y] = n.getCoordinates();
    const d = Math.hypot(mx - x, my - y);
    if (d < n.getRadius()) {
      location.href = n.href;
      break;
    }
  }
}

// -------------------------------------
// Initialization
// -------------------------------------
export function InitHeroCanvas({ works = [] }) {
  resizeCanvas();

  const ambientCount = Math.round((canvas.width * canvas.height) / AMBIENT_DENSITY);
  // console.log('initial ambient node count:', ambientCount);

  let filterMode = JSON.parse(sessionStorage.getItem('filterMode'));
  works.forEach(work => nodes.push(new Node(filterMode, nodes.length + 1, work)));
  for (let i = 0; i < ambientCount; i++) nodes.push(new Node(filterMode));

  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      connections.push(new Connection(connections.length + 1, nodes[i], nodes[j]));

  resumeAnimation();

  // -----------------------------
  // Window visibility handler
  // -----------------------------
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resumeAnimation();
    else pauseAnimation();
  });

  // -----------------------------
  // Window and layout resize handler
  // -----------------------------
  const ro = new ResizeObserver(() => {
    pauseAnimation();

    clearTimeout(window._resizeTimeout);
    window._resizeTimeout = setTimeout(() => {
      resizeCanvas();
      resumeAnimation();
    }, 10);
  });
  ro.observe(heroCanvas);

  // -----------------------------
  // Button click handlers
  // -----------------------------
  projectsBtn.addEventListener('click', updateDimmedNodes);
  publicationsBtn.addEventListener('click', updateDimmedNodes);
  directory.querySelectorAll('a').forEach(handleDirectoryHover);
  canvas.addEventListener('mousemove', handleCanvasHover);
  canvas.addEventListener('click', handleCanvasClick);
}
