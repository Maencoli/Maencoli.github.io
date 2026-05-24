(function () {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;

  const W = 400;
  const H = 500;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const TOP_W = 200;
  const BOTTOM_W = (TOP_W * 95) / 145;
  const CUP_H = (TOP_W * 225) / 145;
  const cup = {
    topY: 110,
    bottomY: 110 + CUP_H,
    topLeft: (W - TOP_W) / 2,
    topRight: (W + TOP_W) / 2,
    bottomLeft: (W - BOTTOM_W) / 2,
    bottomRight: (W + BOTTOM_W) / 2,
  };

  const cherryR = (TOP_W * 18) / 145;
  const cherryX = cup.topLeft + (TOP_W * 50) / 145;
  const cherryY = cup.topY + (CUP_H * 73) / 225;
  const surfaceY = cherryY - cherryR;

  const C_SODA_ALPHA = "rgba(31, 221, 104, 0.85)";
  const C_SURFACE = "#6FF09D";
  const C_INK = "#1F4D2E";
  const C_INK_SOFT = "rgba(31, 77, 46, 0.4)";
  const C_STRAW = "#FFFFFF";
  const C_STRAW_INK = "#3B3B3B";
  const C_STRAW_STRIPE = "#D8344D";
  const C_CHERRY = "#D8344D";
  const C_CHERRY_HI = "#F4A7B0";
  const C_CHERRY_INK = "#6A1924";
  const C_STEM = "#3D6E2A";
  const C_BUBBLE = "rgba(255, 255, 255, 0.95)";

  function leftAt(y) {
    const t = (y - cup.topY) / CUP_H;
    return cup.topLeft + (cup.bottomLeft - cup.topLeft) * t;
  }
  function rightAt(y) {
    const t = (y - cup.topY) / CUP_H;
    return cup.topRight + (cup.bottomRight - cup.topRight) * t;
  }

  const straw = {
    xTop: cup.topLeft + TOP_W * 0.66,
    yTop: 30,
    xBottom: cup.topLeft + TOP_W * 0.58,
    yBottom: cup.bottomY - 28,
    width: 20,
  };

  const bubbles = [];
  function spawnBubble() {
    const y = cup.bottomY - 8 - Math.random() * 60;
    const lx = leftAt(y) + 8;
    const rx = rightAt(y) - 8;
    bubbles.push({
      x: lx + Math.random() * (rx - lx),
      y,
      r: 1.5 + Math.random() * 3.2,
      vy: 0.35 + Math.random() * 0.85,
      drift: (Math.random() - 0.5) * 0.22,
    });
  }
  for (let i = 0; i < 12; i++) spawnBubble();

  function cupPath() {
    ctx.beginPath();
    ctx.moveTo(cup.topLeft, cup.topY);
    ctx.lineTo(cup.topRight, cup.topY);
    ctx.lineTo(cup.bottomRight, cup.bottomY);
    ctx.lineTo(cup.bottomLeft, cup.bottomY);
    ctx.closePath();
  }

  function strawCorners() {
    const dx = straw.xBottom - straw.xTop;
    const dy = straw.yBottom - straw.yTop;
    const len = Math.hypot(dx, dy);
    const px = -dy / len;
    const py = dx / len;
    const w = straw.width / 2;
    return {
      tl: { x: straw.xTop + px * w, y: straw.yTop + py * w },
      tr: { x: straw.xTop - px * w, y: straw.yTop - py * w },
      br: { x: straw.xBottom - px * w, y: straw.yBottom - py * w },
      bl: { x: straw.xBottom + px * w, y: straw.yBottom + py * w },
    };
  }

  function drawStraw() {
    const c = strawCorners();
    ctx.save();
    ctx.lineJoin = "miter";

    ctx.fillStyle = C_STRAW;
    ctx.beginPath();
    ctx.moveTo(c.tl.x, c.tl.y);
    ctx.lineTo(c.tr.x, c.tr.y);
    ctx.lineTo(c.br.x, c.br.y);
    ctx.lineTo(c.bl.x, c.bl.y);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c.tl.x, c.tl.y);
    ctx.lineTo(c.tr.x, c.tr.y);
    ctx.lineTo(c.br.x, c.br.y);
    ctx.lineTo(c.bl.x, c.bl.y);
    ctx.closePath();
    ctx.clip();

    ctx.strokeStyle = C_STRAW_STRIPE;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "butt";
    const stripes = 14;
    for (let i = 0; i < stripes; i++) {
      const t1 = i / stripes;
      const t2 = (i - 0.6) / stripes;
      const sx1 = c.tl.x + (c.bl.x - c.tl.x) * t1;
      const sy1 = c.tl.y + (c.bl.y - c.tl.y) * t1;
      const sx2 = c.tr.x + (c.br.x - c.tr.x) * t2;
      const sy2 = c.tr.y + (c.br.y - c.tr.y) * t2;
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = C_STRAW_INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.tl.x, c.tl.y);
    ctx.lineTo(c.tr.x, c.tr.y);
    ctx.lineTo(c.br.x, c.br.y);
    ctx.lineTo(c.bl.x, c.bl.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawCherryBody() {
    ctx.save();
    ctx.fillStyle = C_CHERRY;
    ctx.strokeStyle = C_CHERRY_INK;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(cherryX, cherryY, cherryR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C_CHERRY_HI;
    ctx.beginPath();
    ctx.arc(
      cherryX - cherryR * 0.32,
      cherryY - cherryR * 0.38,
      cherryR * 0.24,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  function drawCherryStem() {
    ctx.save();
    ctx.strokeStyle = C_STEM;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cherryX + 1, cherryY - cherryR);
    ctx.quadraticCurveTo(
      cherryX + 13,
      cherryY - cherryR - 14,
      cherryX + 24,
      cherryY - cherryR - 26
    );
    ctx.stroke();
    ctx.restore();
  }

  function drawCupOutline() {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = C_INK_SOFT;
    ctx.lineWidth = 7;
    cupPath();
    ctx.stroke();
    ctx.strokeStyle = C_INK;
    ctx.lineWidth = 3.2;
    cupPath();
    ctx.stroke();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    drawStraw();

    ctx.save();
    cupPath();
    ctx.clip();

    drawCherryBody();

    ctx.fillStyle = C_SODA_ALPHA;
    ctx.beginPath();
    ctx.moveTo(leftAt(surfaceY) - 2, surfaceY);
    ctx.lineTo(rightAt(surfaceY) + 2, surfaceY);
    ctx.lineTo(cup.bottomRight + 2, cup.bottomY + 2);
    ctx.lineTo(cup.bottomLeft - 2, cup.bottomY + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = C_SURFACE;
    ctx.fillRect(
      leftAt(surfaceY) - 2,
      surfaceY - 2,
      rightAt(surfaceY) - leftAt(surfaceY) + 4,
      3
    );

    ctx.fillStyle = C_BUBBLE;
    for (const b of bubbles) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    drawCupOutline();
    drawCherryStem();

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.vy;
      b.x += b.drift;
      if (b.y < surfaceY + b.r) bubbles.splice(i, 1);
    }
    if (bubbles.length < 20 && Math.random() < 0.3) spawnBubble();

    requestAnimationFrame(tick);
  }
  tick();
})();
