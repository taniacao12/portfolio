export const MAXDIST = 0.3;

const canvas = document.querySelector('#heroCanvas canvas');
const ctx = canvas.getContext('2d');

function getDistance(nodeA, nodeB) {
  return Math.hypot(nodeA.nx - nodeB.nx, nodeA.ny - nodeB.ny, nodeA.nz - nodeB.nz);
}

export class Connection {
  constructor(order, nodeA, nodeB) {
    this.order = order;
    this.nodeA = nodeA;
    this.nodeB = nodeB;

    this.nz = Math.min(nodeA.nz, nodeB.nz);
    this.dist = getDistance(nodeA, nodeB);
    this.visible = this.nodeA.nz > 0 && this.nodeB.nz > 0 && this.dist < MAXDIST;

    nodeA.addConnection(this);
    nodeB.addConnection(this);
  }

  update() {
    this.dist = getDistance(this.nodeA, this.nodeB);
    this.visible = this.dist < MAXDIST && this.nodeA.nz > 0 && this.nodeB.nz > 0;
  }

  draw() {
    if (!this.visible) return;

    const [ax, ay] = this.nodeA.getCoordinates();
    const [bx, by] = this.nodeB.getCoordinates();

    const strength = 1 - this.dist / MAXDIST;
    const colorA = this.nodeA.getColor(this.nodeA.nz * strength);
    const colorB = this.nodeB.getColor(this.nodeB.nz * strength);

    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    ctx.strokeStyle = grad;
    ctx.lineWidth = (0.8 + Math.pow(this.nz, 1.5) * 2) * (Math.min(canvas.width, canvas.height) / 1000);

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
}
