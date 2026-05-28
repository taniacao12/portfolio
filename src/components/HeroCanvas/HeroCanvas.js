import { Node } from "./Node.js";

export function InitHeroCanvas({ projects = [], publications = [] }) {
  /* --- Engine Constants / Config --- */
  const minR = 10;
  const maxR = 30;
  const connectionDistance = 150;

  const config = {
    minR,
    maxR,
    lineAlpha(depth) {
      return 0.2 + depth * 0.8;
    }
  };

  /* --- Utility Functions --- */
  const rgba = (gray, alpha) => `rgba(${gray},${gray},${gray},${alpha})`;

  // normalized to pixel
  const px = (node, canvas) => ({
    x: node.nx * canvas.width,
    y: node.ny * canvas.height,
    r: node.nr * Math.min(canvas.width, canvas.height)
  });

  // spatial hash key
  const cellKey = (cx, cy) => `${cx},${cy}`;


  /* --- DOM References --- */
  const canvas = document.getElementById("heroCanvas");
  const wrapper = canvas.parentElement;
  const linkOverlay = document.getElementById("linkOverlay");
  const ctx = canvas.getContext("2d");

  /* --- Canvas Setup + Resize --- */
  const wrapperWidth = wrapper.clientWidth;
  const wrapperHeight = wrapper.clientHeight;
  function resize() {
    if (!wrapper || window.heroIsTransitioning) return;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
  }

  resize();
  const resizeObserver = new ResizeObserver(() => {
    resize();
  });
  if (!window.heroIsTransitioning && !window.heroTransitionStart) {
    resizeObserver.observe(wrapper);
  }

  /* --- Node Initialization --- */
  let nodes = [];
  const ambientNodeCount = Math.round(window.innerWidth * window.innerHeight / 15000);
  // console.log("# of ambient nodes:", ambientNodeCount);

  projects.forEach(p =>
    nodes.push(new Node(p, "project", canvas, config))
  );
  publications.forEach(p =>
    nodes.push(new Node(p, "publication", canvas, config))
  );
  for (let i = 0; i < ambientNodeCount; i++) {
    nodes.push(new Node(null, "ambient", canvas, config));
  }

  /* --- Spatial Hashing --- */
  const cellSize = connectionDistance; // good heuristic

  function buildSpatialHash() {
    const grid = new Map();

    for (const n of nodes) {
      const p = px(n, canvas);
      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);
      const key = cellKey(cx, cy);

      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push({ node: n, p, cx, cy });
    }

    return grid;
  }

  function forEachNeighborPair(grid, callback) {
    const neighborOffsets = [
      [0, 0], [1, 0], [0, 1], [1, 1],
      [-1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1]
    ];

    const visited = new Set();

    for (const [key, list] of grid.entries()) {
      const [cxStr, cyStr] = key.split(",");
      const cx = parseInt(cxStr, 10);
      const cy = parseInt(cyStr, 10);

      for (const [ox, oy] of neighborOffsets) {
        const nx = cx + ox;
        const ny = cy + oy;
        const nKey = cellKey(nx, ny);
        if (!grid.has(nKey)) continue;

        const pairKey = cx <= nx && cy <= ny
          ? `${cx},${cy}|${nx},${ny}`
          : `${nx},${ny}|${cx},${cy}`;

        if (visited.has(pairKey)) continue;
        visited.add(pairKey);

        const listA = grid.get(key);
        const listB = grid.get(nKey);

        for (let i = 0; i < listA.length; i++) {
          const a = listA[i];
          const startJ = (key === nKey) ? i + 1 : 0;
          for (let j = startJ; j < listB.length; j++) {
            const b = listB[j];
            callback(a, b);
          }
        }
      }
    }
  }

  /* --- Core Engine: Connections --- */
  function drawConnections(mapX = 1, mapY = 1) {
    const segments = [];
    const grid = buildSpatialHash();

    // build segments list
    forEachNeighborPair(grid, (A, B) => {
      const a = A.node;
      const b = B.node;
      const ap = A.p;
      const bp = B.p;

      const dx = ap.x - bp.x;
      const dy = ap.y - bp.y;
      const dist = Math.hypot(dx, dy);

      if (dist < connectionDistance) {
        segments.push({
          a, b, ap, bp,
          dist,
          depth: Math.min(a.depth, b.depth)
        });
      }
    });

    // depth sort (far to near)
    segments.sort((s1, s2) => s1.depth - s2.depth);

    // draw segments
    for (const s of segments) {
      const { a, b, ap, bp } = s;

      // compensate for CSS distortion
      const ax = ap.x * mapX;
      const ay = ap.y * mapY;
      const bx = bp.x * mapX;
      const by = bp.y * mapY;

      const grad = ctx.createLinearGradient(ax, ay, bx, by);

      const fade = 1 - s.dist / connectionDistance;
      const alphaA = Math.max(0.2, config.lineAlpha(a.depth) * fade);
      const alphaB = Math.max(0.2, config.lineAlpha(b.depth) * fade);

      grad.addColorStop(0, rgba(a.lineGray, alphaA));
      grad.addColorStop(1, rgba(b.lineGray, alphaB));

      ctx.strokeStyle = grad;
      const lw = 0.8 + Math.pow(s.depth, 1.5) * 2;
      ctx.lineWidth = lw * Math.min(mapX, mapY);

      ctx.beginPath();
      ctx.moveTo(ap.x, ap.y);
      ctx.lineTo(bp.x, bp.y);
      ctx.stroke();
    }
  }

  /* --- Core Engine: Collision Resolution --- */
  function resolveCollisions() {
    const grid = buildSpatialHash();

    forEachNeighborPair(grid, (A, B) => {
      const a = A.node;
      const b = B.node;

      const isAContent = a.type === "project" || a.type === "publication";
      const isBContent = b.type === "project" || b.type === "publication";
      if (!isAContent || !isBContent) return;

      const ap = A.p;
      const bp = B.p;

      const dx = bp.x - ap.x;
      const dy = bp.y - ap.y;
      const dist = Math.hypot(dx, dy);
      const minDist = ap.r + bp.r;

      if (dist < minDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;

        const overlap = minDist - dist;
        const push = overlap / 2;

        // convert pixel push to normalized push
        const npx = (nx * push) / canvas.width;
        const npy = (ny * push) / canvas.height;

        a.nx -= npx;
        a.ny -= npy;
        b.nx += npx;
        b.ny += npy;

        const relVx = b.vx - a.vx;
        const relVy = b.vy - a.vy;

        const dot = relVx * nx + relVy * ny;

        if (dot < 0) {
          const impulse = (2 * dot) / 2;
          const bounce = 1.0;

          a.vx += impulse * nx * bounce;
          a.vy += impulse * ny * bounce;
          b.vx -= impulse * nx * bounce;
          b.vy -= impulse * ny * bounce;
        }
      }
    });
  }

  /* --- Ambient Node Lifecycle --- */
  function createAmbientNode() {
    nodes.push(new Node(null, "ambient", canvas, config));
  }

  function removeRandomAmbientNode() {
    const ambientNodes = nodes.filter(n => n.type === "ambient" && !n.dying);
    if (!ambientNodes.length) return;

    const victim = ambientNodes[Math.floor(Math.random() * ambientNodes.length)];
    victim.dying = true;
  }

  function isHeroTransitioning() {
    const aside = document.querySelector(".heroLayout aside");
    const width = aside.getBoundingClientRect().width;

    // transitioning if width is between 0 and 300
    window.heroIsTransitioning = width > 0 && width < 300;
    window.heroTransitionStart = false;
  }

  function highlightCanvasNode(src) {
    nodes.forEach(n => {
      n.hovered = (n.imgSrc === src);
      n.targetR = n.hovered ? n.baseR * 3 : n.baseR;
    });

    const node = nodes.find(n => n.imgSrc === src);
    if (node) {
      ghostMouse.x = node.x;
      ghostMouse.y = node.y;
    }
  }

  function clearCanvasHighlight() {
    nodes.forEach(n => {
      n.hovered = false;
      n.targetR = n.baseR;
    });
  }

  // expose to global scope
  window.highlightCanvasNode = highlightCanvasNode;
  window.clearCanvasHighlight = clearCanvasHighlight;

  setInterval(() => {
    Math.random() < 0.5 ? createAmbientNode() : removeRandomAmbientNode();
  }, 1500);

  /* --- Animation Loop --- */
  let lastTime = performance.now();

  function animate(now) {
    const dt = (now - lastTime) / 16.67; // normalize to ~60fps
    lastTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    isHeroTransitioning();
    drawConnections();

    nodes
      .sort((a, b) => {
        const order = { ambient: 0, project: 1, publication: 1 };
        return order[a.type] - order[b.type];
      })
      .forEach(n => {
        n.update(dt);
        n.draw(wrapperWidth / canvas.width, wrapperHeight / canvas.height);
      });

    resolveCollisions();
    nodes = nodes.filter(n => !n.dead);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  /* --- Interaction Handlers --- */
  let active = null;

  canvas.addEventListener("mousemove", e => {
    const mx = e.offsetX;
    const my = e.offsetY;

    let closest = null;
    let closestDist = Infinity;

    for (const n of nodes) {
      const p = px(n, canvas);
      const dist = Math.hypot(mx - p.x, my - p.y);
      if (dist < closestDist) {
        closestDist = dist;
        closest = n;
      }
    }

    nodes.forEach(n => {
      const p = px(n, canvas);
      const isHovered = n === closest && closestDist < p.r;

      n.hovered = isHovered;
      n.targetNR = isHovered ? n.baseNR * 3 : n.baseNR;
    });

    active = closest && closest.href && closest.hovered ? closest : null;

    if (active) {
      const p = px(active, canvas);
      const size = p.r * 2;

      linkOverlay.href = active.href;
      linkOverlay.style.cursor = "pointer";
      linkOverlay.style.display = "block";
      linkOverlay.style.left = `${p.x - p.r}px`;
      linkOverlay.style.top = `${p.y - p.r}px`;
      linkOverlay.style.width = `${size}px`;
      linkOverlay.style.height = `${size}px`;
      linkOverlay.style.pointerEvents = "auto";
    } else {
      linkOverlay.href = "/";
      linkOverlay.style.cursor = "default";
      linkOverlay.style.display = "none";
      linkOverlay.style.pointerEvents = "none";
    }
  });

  canvas.addEventListener("click", e => {
    const mx = e.offsetX;
    const my = e.offsetY;

    nodes.forEach(n => {
      if (!n.href) return;

      const p = px(n, canvas);
      const dist = Math.hypot(mx - p.x, my - p.y);

      if (dist < p.r) window.location.href = n.href;
    });
  });
}
