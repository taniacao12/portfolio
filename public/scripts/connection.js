const MAX_DISTANCE = 0.3;

const canvas = document.querySelector('#heroCanvas canvas');
const ctx = canvas.getContext('2d');

function getDistance(a, b) {
  const dx = a.nx - b.nx;
  const dy = a.ny - b.ny;
  const dz = a.nz - b.nz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

const round = v => Math.round(v * 1000) * 0.001; // to 3 decimal places
const rgb = (c, o) => `rgba(${c},${c},${c},${o})`;

export class Connection {
  constructor(order, nodeA, nodeB) {
    this.order = order;
    this.na = nodeA;
    this.nb = nodeB;

    this.nz = Math.min(nodeA.nz, nodeB.nz);
    this.dist = getDistance(nodeA, nodeB);
    this.visible = this.dist < MAX_DISTANCE && nodeA.nz > 0 && nodeB.nz > 0;
  }

  update() {
    if (!this.na.visible || !this.nb.visible) {
      this.visible = false;
      return;
    }

    this.nz = Math.min(this.na.nz, this.nb.nz);
    this.dist = getDistance(this.na, this.nb);
    this.visible = this.dist < MAX_DISTANCE;
  }

  draw() {
    if (!this.visible) return;

    const na = this.na;
    const nb = this.nb;

    const strength = 1 - this.dist / MAX_DISTANCE;
    const opacityA = round(na.nz * strength);
    const opacityB = round(nb.nz * strength);
    if (opacityA <= 0 && opacityB <= 0) return;

    const grad = ctx.createLinearGradient(na.x, na.y, nb.x, nb.y);
    grad.addColorStop(0, rgb(na.color, opacityA));
    grad.addColorStop(1, rgb(nb.color, opacityB));
    ctx.strokeStyle = grad;

    const scale = Math.min(canvas.width, canvas.height) / 1000;
    ctx.lineWidth = (0.8 + this.nz ** 1.5 * 2) * scale;

    ctx.beginPath();
    ctx.moveTo(na.x, na.y);
    ctx.lineTo(nb.x, nb.y);
    ctx.stroke();
  }
}
