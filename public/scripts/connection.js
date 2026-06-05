const canvas = document.getElementById("heroCanvas");
const ctx = canvas.getContext("2d");
export const maxDist = 150;


function getDistance(nodeA, nodeB) {
  const [ax, ay] = nodeA.getCoordinates();
  const [bx, by] = nodeB.getCoordinates();
  return Math.hypot(ax - bx, ay - by);
}

export class Connection {
  constructor(nodeA, nodeB) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.depth = Math.min(nodeA.depth || 0, nodeB.depth || 0);
    this.dist = getDistance(nodeA, nodeB);
    this.visible = this.dist < maxDist;
    this.dead = false;

    nodeA.addConnection(this);
    nodeB.addConnection(this);
  }

  update() {
    const { nodeA: A, nodeB: B } = this;
    if (A.dead || B.dead) return (this.dead = this.visible = false);

    this.dist = getDistance(A, B);
    this.visible = this.dist < maxDist;
    this.depth = Math.min(A.depth || 0, B.depth || 0);
  }

  draw() {
    if (!this.visible) return;

    const [ax, ay] = this.nodeA.getCoordinates();
    const [bx, by] = this.nodeB.getCoordinates();
    const fade = 1 - this.dist / maxDist;

    const aA = Math.max(0.2, this.nodeA.getLineAlpha() * fade);
    const aB = Math.max(0.2, this.nodeB.getLineAlpha() * fade);

    const dark = document.documentElement.classList.contains("dark");
    const gA = dark ? 250 - this.nodeA.lineGray : this.nodeA.lineGray;
    const gB = dark ? 250 - this.nodeB.lineGray : this.nodeB.lineGray;

    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, `rgba(${gA},${gA},${gA},${aA})`);
    grad.addColorStop(1, `rgba(${gB},${gB},${gB},${aB})`);

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
