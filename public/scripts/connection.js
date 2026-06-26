export const MAXDIST = 150;

const canvas = document.querySelector(".canvasContainer canvas");
const ctx = canvas.getContext("2d");

function getDistance(nodeA, nodeB) {
  const [ax, ay] = nodeA.getCoordinates();
  const [bx, by] = nodeB.getCoordinates();
  return Math.hypot(ax - bx, ay - by);
}

const ColorCache = new Map();
function getColor(isAmbient, color, dimmed, isDark, alpha) {
  const key = `${isAmbient}|${color}|${dimmed}|${isDark}|${alpha}`;
  if (ColorCache.has(key)) return ColorCache.get(key);

  let c;
  if (isAmbient) {
    c = isDark
      ? (dimmed ? 280 - color : 250 - color)
      : color;
  } else c = isDark ? 255 : 0;
  const fill = `rgba(${c},${c},${c},${alpha})`;
  ColorCache.set(key, fill);
  return fill;
}

function getStroke(grad, fade, nodeA, nodeB, isDark) {
  const alphaA = Math.max(0.2, nodeA.depthAlpha * fade);
  const alphaB = Math.max(0.2, nodeB.depthAlpha * fade);
  const colorA = getColor(nodeA.isAmbient, nodeA.color, nodeA.dimmed, isDark, alphaA);
  const colorB = getColor(nodeB.isAmbient, nodeB.color, nodeB.dimmed, isDark, alphaB);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB);
  return grad;
}

export class Connection {
  constructor(nodeA, nodeB) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.depth = Math.min(nodeA.depth, nodeB.depth);
    this.dist = getDistance(nodeA, nodeB);
    this.visible = this.dist < MAXDIST;
    this.isDead = false;

    nodeA.addConnection(this);
    nodeB.addConnection(this);
  }

  update() {
    if (this.nodeA.isDead || this.nodeB.isDead) {
      return (this.isDead = this.visible = false);
    }

    this.dist = getDistance(this.nodeA, this.nodeB);
    this.visible = this.dist < MAXDIST;
  }

  draw() {
    if (!this.visible) return;

    const isDark = document.documentElement.classList.contains("dark");
    const [ax, ay] = this.nodeA.getCoordinates();
    const [bx, by] = this.nodeB.getCoordinates();

    const fade = 1 - this.dist / MAXDIST;
    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    ctx.strokeStyle = getStroke(grad, fade, this.nodeA, this.nodeB, isDark);

    ctx.lineWidth =
      (0.8 + Math.pow(this.depth, 1.5) * 2) *
      (Math.min(canvas.width, canvas.height) / 1000);

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
}
