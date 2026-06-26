import { Node } from "./node.js";
import { Connection, MAXDIST } from "./connection.js";

const AMBIENT_DENSITY = 15000;
const AMBIENT_PULSE_INTERVAL = 1500;

const canvasContainer = document.querySelector(".canvasContainer");
const canvas = document.querySelector(".canvasContainer canvas");
const linkOverlay = document.querySelector(".canvasContainer a");
const ctx = canvas.getContext("2d");

let paused = false;
let nodes = [];
let connections = [];
let activeNode = null;
let lastTime = performance.now();

const cellKey = (x, y) => `${x},${y}`;

// -------------------------------------
// Canvas / Layout
// -------------------------------------
function resizeCanvas() {
  if (canvas.width == canvasContainer.parentElement.clientWidth &&
    canvas.height == canvasContainer.clientHeight) return;
  // console.log(
  //   canvas.width,
  //   canvas.height,
  //   parseFloat(getComputedStyle(canvasContainer.parentElement).width),
  //   canvasContainer.clientHeight,
  // );
  canvas.width = parseFloat(getComputedStyle(canvasContainer.parentElement).width);
  canvas.height = canvasContainer.clientHeight;
  // console.log("canvas size:", canvas.width, canvas.height);
}

// -------------------------------------
// Collision Resolution
// -------------------------------------
function resolveCollisions() {
  const grid = new Map();

  // bucket nodes into grid cells
  for (const n of nodes) {
    const [x, y] = n.getCoordinates();
    const cx = Math.floor(x / MAXDIST);
    const cy = Math.floor(y / MAXDIST);
    const key = cellKey(cx, cy);

    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push({ node: n, p: { x, y, r: n.radius } });
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

          if (na.isAmbient || nb.isAmbient) continue;

          const dx = b.p.x - a.p.x;
          const dy = b.p.y - a.p.y;
          const dist = Math.hypot(dx, dy);
          const minD = a.p.r + b.p.r;

          if (dist < minD && dist > 0) {
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
// Update / Draw Pipeline
// -------------------------------------
function updateGeometry(dt) {
  for (const g of nodes) g.update(dt);
  for (const g of connections) g.update(dt);
}

function sortGeometry() {
  const geo = [...connections, ...nodes];
  geo.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    if (a.depth !== 1) {
      const aIsNode = a instanceof Node;
      const bIsNode = b instanceof Node;
      if (aIsNode !== bIsNode) return aIsNode ? -1 : 1;
      return 0;
    } return b.order - a.order;
  });
  return geo;
}

function drawGeometry(sorted) {
  for (const g of sorted) g.draw();
}

// -------------------------------------
// Ambient Node Birth / Death
// -------------------------------------
function spawnAmbientNode() {
  const newNode = new Node();
  for (let i = 0; i < nodes.length - 1; i++) {
    connections.push(new Connection(nodes[i], newNode));
  } nodes.push(newNode);
}

function killRandomAmbientNode() {
  const ambientNodes = nodes.filter(n => n.isAmbient && !n.dying);
  if (ambientNodes.length === 0) return;

  const victim = ambientNodes[Math.floor(Math.random() * ambientNodes.length)];
  victim.dying = true;
}

function ambientPulse(maxAmbient) {
  const BIRTH_RATIO = 0.4;
  const KILL_RATIO = 0.4;

  const ambientNodes = nodes.filter(n => n.isAmbient && !n.dying);
  const ratio = ambientNodes.length / maxAmbient;
  const birthChance = Math.max(0, (1 - ratio) * BIRTH_RATIO);
  const killChance = Math.max(0, ratio * KILL_RATIO);
  const nothingChance = 1 - birthChance - killChance;

  const roll = Math.random();
  if (roll < nothingChance) return;
  if (roll < nothingChance + birthChance) return spawnAmbientNode();
  killRandomAmbientNode();
}

// -------------------------------------
// Hover Logic
// -------------------------------------
function handleDirectoryHover(a) {
  a.addEventListener("mouseenter", () => {
    nodes.forEach(n => {
      n.hovered = false;
      n.targetRadius = n.baseRadius;
    });

    const href = new URL(a.href).pathname;
    const node = nodes.find(n => n.href === href);
    if (node) {
      node.hovered = true;
      node.targetRadius = node.baseRadius * 3;
    }
  });

  a.addEventListener("mouseleave", () => {
    const href = new URL(a.href).pathname;
    const node = nodes.find(n => n.href === href);
    if (node) {
      node.hovered = false;
      node.targetRadius = node.baseRadius;
    }
  });
}

function handleCanvasHover(e) {
  const mx = e.offsetX, my = e.offsetY;

  let closest = null, closestDist = Infinity;
  for (const n of nodes) {
    const [x, y] = n.getCoordinates();
    const d = Math.hypot(mx - x, my - y);
    if (d < closestDist) {
      closestDist = d;
      closest = n;
    }
  }

  nodes.forEach(n => {
    const h = n === closest && closestDist < n.radius;
    n.hovered = h;
    n.targetRadius = h ? n.baseRadius * 3 : n.baseRadius;
  });

  activeNode = closest && closest.href && closest.hovered ? closest : null;

  if (activeNode) {
    const [x, y] = activeNode.getCoordinates();
    const r = activeNode.radius;
    linkOverlay.href = activeNode.href;
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
}

// -------------------------------------
// Click Navigation
// -------------------------------------
function handleCanvasClick(e) {
  const mx = e.offsetX, my = e.offsetY;

  for (const n of nodes) {
    if (!n.href) continue;

    const [x, y] = n.getCoordinates();
    if (Math.hypot(mx - x, my - y) < n.radius) {
      location.href = n.href;
      break;
    }
  }
}

// -------------------------------------
// Animation Loop
// -------------------------------------
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

  nodes = nodes.filter(n => !n.isDead);
  connections = connections.filter(c => !c.isDead);

  requestAnimationFrame(animate);
}

// -------------------------------------
// Initialization
// -------------------------------------
export function InitHeroCanvas({ works = [] }) {
  resizeCanvas();

  const ambientCount = Math.round((canvas.width * canvas.height) / AMBIENT_DENSITY);
  const maxAmbient = parseInt(ambientCount * 1.5);
  // console.log("max ambient node count:", maxAmbient);
  // console.log("initial ambient node count:", ambientCount);

  works.forEach(work => nodes.push(new Node(work.type, work)));
  for (let i = 0; i < ambientCount; i++) nodes.push(new Node());

  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      connections.push(new Connection(nodes[i], nodes[j]));

  requestAnimationFrame(animate);
  setInterval(ambientPulse(maxAmbient), AMBIENT_PULSE_INTERVAL);

  const ro = new ResizeObserver(() => {
    clearTimeout(window._resizeTimeout);
    window._resizeTimeout = setTimeout(resizeCanvas, 20);
  });
  ro.observe(canvasContainer);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      paused = false;
      lastTime = performance.now();
      requestAnimationFrame(animate);
    } else paused = true;
  });

  document.querySelectorAll(".directory a").forEach(handleDirectoryHover);
  canvas.addEventListener("mousemove", handleCanvasHover);
  canvas.addEventListener("click", handleCanvasClick);
}
