export const MAXDIST = 200;

const canvas = document.querySelector('#heroCanvas canvas');
const ctx = canvas.getContext('2d');

function getDistance(nodeA, nodeB) {
  const [ax, ay] = nodeA.getCoordinates();
  const [bx, by] = nodeB.getCoordinates();
  return Math.hypot(ax - bx, ay - by);
}

export class Connection {
  constructor(nodeA, nodeB) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.depth = Math.min(nodeA.depth, nodeB.depth);
    this.dist = getDistance(nodeA, nodeB);
    this.visible = this.dist < MAXDIST;
    this.dead = false;

    nodeA.addConnection(this);
    nodeB.addConnection(this);
  }

  update() {
    if (this.nodeA.dead || this.nodeB.dead) {
      return (this.dead = this.visible = false);
    }

    this.dist = getDistance(this.nodeA, this.nodeB);
    this.visible = this.dist < MAXDIST;
  }

  draw() {
    if (!this.visible) return;

    const [ax, ay] = this.nodeA.getCoordinates();
    const [bx, by] = this.nodeB.getCoordinates();

    const fade = 1 - this.dist / MAXDIST;
    const alphaA = Math.max(0.2, this.nodeA.depthAlpha * fade);
    const alphaB = Math.max(0.2, this.nodeB.depthAlpha * fade);
    const colorA = this.nodeA.getColor(alphaA);
    const colorB = this.nodeB.getColor(alphaB);

    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    ctx.strokeStyle = grad;

    ctx.lineWidth =
      (0.8 + Math.pow(this.depth, 1.5) * 2) *
      (Math.min(canvas.width, canvas.height) / 1000);

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
}
