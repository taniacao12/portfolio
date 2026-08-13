import { Node } from './node.js';
import { Connection } from './connection.js';

const AMBIENT_DENSITY = 15000;
const OVERLAP_DISTANCE = 1; // px

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

const grid = new Map();
const nbrs = [
  0, 0,
  1, 0,
  0, 1,
  1, 1,
  -1, 0,
  0, -1,
  -1, -1,
  1, -1,
  -1, 1
];

const packKey = (cx, cy) => (cx << 16) | (cy & 0xFFFF);
const unpackKey = key => [key >> 16, key & 0xFFFF];

const round = v => Math.round(v * 1000) * 0.001; // to 3 decimal places

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
// Update / draw pipeline
// -------------------------------------
function addToGrid(node) {
  const key = packKey(node.cx1, node.cy1);
  let array = grid.get(key);
  if (!array) {
    array = [];
    grid.set(key, array);
  } array.push(node);
}

function removeFromGrid(node) {
  const key = packKey(node.cx0, node.cy0);
  const array = grid.get(key);
  if (!array) return;

  const idx = array.indexOf(node);
  if (idx !== -1) array.splice(idx, 1);

  if (array.length === 0) grid.delete(key);
}

function createNode(filterMode, order = 0, data = null) {
  const node = new Node(filterMode, order, data)
  nodes.push(node);
  addToGrid(node);
}

function createConnections() {
  connections.length = 0;

  for (const [key, array] of grid) {
    for (let i = 0; i < array.length; i++) {
      const na = array[i];

      // check neighbors in adjacent cells
      for (let n = 0; n < nbrs.length; n += 2) {
        const nx = (key >> 16) + nbrs[n];
        const ny = (key & 0xFFFF) + nbrs[n + 1];
        const arrayB = grid.get(packKey(nx, ny));
        if (!arrayB) continue;

        for (const nb of arrayB) {
          if (na === nb) continue;
          connections.push(new Connection(connections.length + 1, na, nb));
        }
      }
    }
  }
}

function updateGeometry(dt) {
  for (const n of nodes) {
    n.update(dt);
    if (n.cx0 !== n.cx1 || n.cy0 !== n.cy1) {
      removeFromGrid(n);
      addToGrid(n);
    }
  } for (const c of connections) c.update(dt);
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
// Collision resolution
// -------------------------------------
function resolveCollisions(w, h) {
  for (const [keyA, arrayA] of grid) {
    const [cx, cy] = unpackKey(keyA);

    for (let n = 0; n < nbrs.length; n += 2) {
      const nx = cx + nbrs[n];
      const ny = cy + nbrs[n + 1];

      const keyB = packKey(nx, ny);
      const arrayB = grid.get(keyB);
      if (!arrayB) continue;

      const same = arrayA === arrayB;
      for (let i = 0; i < arrayA.length; i++) {
        const nodeA = arrayA[i];
        if (!nodeA.visible) continue;

        const ax = nodeA.x;
        const ay = nodeA.y;
        const ar = nodeA.r;

        const start = same ? i + 1 : 0;
        for (let j = start; j < arrayB.length; j++) {
          const nodeB = arrayB[j];
          if (!nodeB.visible || nodeA.nz !== nodeB.nz) continue;

          const dx = nodeB.x - ax;
          const dy = nodeB.y - ay;

          const distSq = dx * dx + dy * dy;
          const maxD = ar + nodeB.r;
          const maxDSq = maxD * maxD;

          if (distSq > 0 && distSq < maxDSq) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;

            const overlapDist = round(maxD - dist);
            if (overlapDist >= OVERLAP_DISTANCE && (nodeA.type === 'ambient' || nodeB.type === 'ambient')) {
              if (nodeA.nz !== 1) nodeA.vz = -nodeA.vz;
              if (nodeB.nz !== 1) nodeB.vz = -nodeB.vz;
              continue;
            }

            const push = (maxD - dist) * 0.5;
            const pushX = nx * push / w;
            const pushY = ny * push / h;

            nodeA.nx -= pushX;
            nodeA.ny -= pushY;
            nodeB.nx += pushX;
            nodeB.ny += pushY;

            const rvx = nodeB.vx - nodeA.vx;
            const rvy = nodeB.vy - nodeA.vy;
            const dot = rvx * nx + rvy * ny;

            if (dot < 0) {
              nodeA.vx += dot * nx;
              nodeA.vy += dot * ny;
              nodeB.vx -= dot * nx;
              nodeB.vy -= dot * ny;
            }
          }
        }
      }
    }
  }
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

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  updateGeometry(dt);
  const geo = sortGeometry();
  drawGeometry(geo);
  resolveCollisions(w, h);

  requestAnimationFrame(animate);
}

// -----------------------------
// Filter button click handler
// -----------------------------
function updateDimmedNodes() {
  let filterMode = JSON.parse(sessionStorage.getItem('filterMode'));
  for (const n of nodes) {
    if (!filterMode.projects && !filterMode.publications) {
      n.dimmed = false;
    } else if (filterMode.projects && !filterMode.publications) {
      n.dimmed = !(n.type === 'project');
    } else if (!filterMode.projects && filterMode.publications) {
      n.dimmed = !(n.type === 'publication');
    } else n.dimmed = !(n.type === 'project' || n.type === 'publication');
  }
}

// -------------------------------------
// Hover animations
// -------------------------------------
function handleDirectoryHover(el) {
  const href = new URL(el.href).pathname;
  const node = nodes.find(n => n.href === href);

  el.addEventListener('mouseenter', () => {
    for (const n of nodes) n.updateHoverStatus(false);

    if (node) node.updateHoverStatus(true);
  });

  el.addEventListener('mouseleave', () => {
    if (node) node.updateHoverStatus(false);
  });
}

function handleCanvasHover(e) {
  for (const n of nodes) n.updateHoverStatus(false);

  const mx = e.offsetX, my = e.offsetY;
  let closestNode = null, closestDist = Infinity;
  for (const n of nodes) {
    if (!n.visible) continue;

    const d = Math.hypot(mx - n.x, my - n.y);
    if (d < closestDist && d <= n.r) {
      closestDist = d;
      closestNode = n;
    }
  }

  if (closestNode) closestNode.updateHoverStatus(true);
  if (closestNode && closestNode.type != 'ambient') {
    linkOverlay.classList.toggle('hide');
    linkOverlay.href = closestNode.href;
    linkOverlay.style.left = `${closestNode.x - closestNode.r}px`;
    linkOverlay.style.top = `${closestNode.y - closestNode.r}px`;
    linkOverlay.style.width = linkOverlay.style.height = `${closestNode.r * 2}px`;
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
    if (!n.visible || n.type === 'ambient') continue;

    const d = Math.hypot(mx - n.x, my - n.y);
    if (d < n.r) {
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

  const ambientCount = ((canvas.width * canvas.height) / AMBIENT_DENSITY) | 0;
  // console.log('initial ambient node count:', ambientCount);

  let filterMode = JSON.parse(sessionStorage.getItem('filterMode'));
  for (const work of works) createNode(filterMode, nodes.length + 1, work);
  for (let i = 0; i < ambientCount; i++) createNode(filterMode);
  // console.log('node count', nodes.length);

  createConnections();

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
