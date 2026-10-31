(function () {
  "use strict";

  // Scene is authored in the 2000x2000 coordinate space of the drawn parts;
  // the canvas shows only the region that matters.
  const OX = 770, OY = 500, W = 880, H = 1500;
  const cv = document.querySelector(".scene-stage canvas");
  if (!cv) return;
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const INK = "#262222";
  const SODA = "rgba(31, 221, 104, 0.85)";
  const SURF = "#6FF09D";
  const GREEN_INK = "rgba(31, 77, 46, 0.78)";

  // ---------- cup (same proportions as the original canvas.js cup) ----------
  const TOP_W = 380;
  const BOT_W = (TOP_W * 95) / 145;
  const CUP_H = (TOP_W * 225) / 145;
  const cup = { topY: 1388, left: 811 };
  cup.right = cup.left + TOP_W;
  cup.bottomY = cup.topY + CUP_H;
  const mid = (cup.left + cup.right) / 2;
  cup.bl = mid - BOT_W / 2;
  cup.br = mid + BOT_W / 2;
  const leftAt = (y) => cup.left + (cup.bl - cup.left) * ((y - cup.topY) / CUP_H);
  const rightAt = (y) => cup.right + (cup.br - cup.right) * ((y - cup.topY) / CUP_H);

  const cherryR = (TOP_W * 18) / 145;
  const cherryX = cup.left + (TOP_W * 41) / 145; // a little left, clear of the straw
  const cherryY0 = cup.topY + (CUP_H * 73) / 225;
  const SURF_Y = cherryY0 - cherryR;

  // ---------- giraffe parts ----------
  const img = new Image();
  let imgReady = false;
  img.onload = () => { imgReady = true; };
  img.src = "image/giraffe_head_neck.png";
  const imgP = new Image();
  let puffReady = false;
  imgP.onload = () => { puffReady = true; };
  imgP.src = "image/giraffe_head_puff.png";

  const YCUT = 1290;           // head/neck split line
  const YBASE = 1825;          // bottom of the drawn neck
  const J = { x: 1343, y: 1290 }; // joint: centre of the neck at the split
  const C = { x: 1040, y: 1010 }; // muzzle centre (puff scales around this)
  const A0 = { x: 1000, y: 1220 }; // straw top: under the chin / on the puffed lips
  const STRAW_W = 38;
  const B0 = { x: 988, y: cup.bottomY - 70 };
  const RIM_T = (cup.topY - A0.y) / (B0.y - A0.y);
  const P = { x: A0.x + (B0.x - A0.x) * RIM_T, y: cup.topY }; // straw pivots on the rim
  const LEVER = (B0.y - P.y) / (P.y - A0.y);

  // ---------- state ----------
  let t = 0, angle = 0, env = 0, spd = 1;
  let hover = false;
  let blowT = 99;
  const blowQueue = [];
  let prevB = null;
  let cherryCy = cherryY0;
  let spawnAcc = 0, fizzAcc = 0;
  const bubbles = [], pops = [], drops = [];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (x) => x * x * (3 - 2 * x);
  const rnd = (a, b) => a + Math.random() * (b - a);

  function waveY(x) {
    return SURF_Y
      + Math.sin(x * 0.045 + t * 9) * 3.2 * env
      + Math.sin(x * 0.02 - t * 5) * 2.0 * env;
  }

  // ---------- bubbles ----------
  function addBubble(x, y, r, vy, big) {
    bubbles.push({ x, y, r, vy, big: !!big, ph: Math.random() * 6.28, amp: rnd(6, 16), st: 0, life: 0 });
  }
  function popBubble(b) {
    pops.push({ x: b.x, y: b.y, r: b.r, age: 0, dur: 0.22 });
    if (b.r >= 13) {
      const n = 4 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) {
        const a = -Math.PI * rnd(0.15, 0.85);
        const s = rnd(170, 340);
        drops.push({ x: b.x, y: b.y - b.r * 0.4, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rnd(2.5, 5) });
      }
    }
  }
  function startBlow() {
    if (blowT < 0.35) return;
    blowT = 0;
    blowQueue.length = 0;
    for (let i = 0; i < 15; i++) {
      blowQueue.push({ at: 0.18 + i * 0.05 + Math.random() * 0.03, r: i % 4 === 3 ? rnd(8, 14) : rnd(14, 36) });
    }
  }

  function updateBubbles(dt, B, tipSpeed) {
    // blow bursts
    if (blowT < 5) {
      while (blowQueue.length && blowQueue[0].at <= blowT) {
        const q = blowQueue.shift();
        addBubble(B.x + rnd(-14, 14), B.y + rnd(-10, 10), q.r, rnd(170, 290), q.r >= 14);
        if (Math.random() < 0.8) addBubble(B.x + rnd(-24, 24), B.y + rnd(-6, 10), rnd(4, 8), rnd(110, 190), false);
      }
    }
    // stir-driven bubbles: rate follows how fast the straw tip is moving
    const rate = clamp(tipSpeed * 0.02, 0, 26);
    spawnAcc += rate * dt;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      const r = rnd(4, 12);
      addBubble(B.x + rnd(-16, 16), B.y + rnd(-8, 8), r, rnd(90, 190), r > 10);
    }
    // quiet carbonation
    fizzAcc += 5 * dt;
    while (fizzAcc >= 1) {
      fizzAcc -= 1;
      const y = cup.bottomY - rnd(10, 80);
      addBubble(rnd(leftAt(y) + 14, rightAt(y) - 14), y, rnd(2.5, 6.5), rnd(40, 120), false);
    }

    let foam = 0;
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      if (b.st === 0) {
        b.y -= b.vy * dt;
        b.ph += dt * (3 + 28 / (b.r + 4));
        b.x += Math.cos(b.ph) * b.amp * dt;
        b.x = clamp(b.x, leftAt(b.y) + b.r + 8, rightAt(b.y) - b.r - 8);
        const surf = waveY(b.x);
        if (b.y - b.r * 0.35 <= surf) {
          if (b.r < 8) {
            popBubble(b);
            bubbles.splice(i, 1);
          } else {
            b.st = 1;
            b.life = (b.big ? 1.0 : 0.45) + Math.random() * (b.big ? 1.5 : 0.6);
          }
        }
      } else {
        foam++;
        b.life -= dt;
        const target = waveY(b.x) - b.r * 0.5;
        b.y += (target - b.y) * Math.min(1, dt * 9);
        if (b.life <= 0) {
          popBubble(b);
          bubbles.splice(i, 1);
        }
      }
    }
    // foam bubbles nudge each other apart
    for (let i = 0; i < bubbles.length; i++) {
      const a = bubbles[i];
      if (a.st !== 1) continue;
      for (let j = i + 1; j < bubbles.length; j++) {
        const b = bubbles[j];
        if (b.st !== 1) continue;
        const dx = b.x - a.x;
        const min = (a.r + b.r) * 0.85;
        if (Math.abs(dx) < min) {
          const push = (min - Math.abs(dx)) * 0.5 * (dx >= 0 ? 1 : -1);
          a.x -= push;
          b.x += push;
        }
      }
    }
    if (foam > 16) {
      const old = bubbles.find((b) => b.st === 1);
      if (old) old.life = 0;
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].age += dt;
      if (pops[i].age >= pops[i].dur) pops.splice(i, 1);
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.vy += 900 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y > SURF_Y + 4) drops.splice(i, 1);
    }
  }

  // ---------- drawing ----------
  function cupPath() {
    ctx.beginPath();
    ctx.moveTo(cup.left, cup.topY);
    ctx.lineTo(cup.right, cup.topY);
    ctx.lineTo(cup.br, cup.bottomY);
    ctx.lineTo(cup.bl, cup.bottomY);
    ctx.closePath();
  }

  function drawStraw(A, B) {
    const dx = B.x - A.x, dy = B.y - A.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len, w = STRAW_W / 2;
    const tl = { x: A.x + nx * w, y: A.y + ny * w };
    const tr = { x: A.x - nx * w, y: A.y - ny * w };
    const br = { x: B.x - nx * w, y: B.y - ny * w };
    const bl = { x: B.x + nx * w, y: B.y + ny * w };
    const poly = () => {
      ctx.beginPath();
      ctx.moveTo(tl.x, tl.y);
      ctx.lineTo(tr.x, tr.y);
      ctx.lineTo(br.x, br.y);
      ctx.lineTo(bl.x, bl.y);
      ctx.closePath();
    };
    ctx.save();
    ctx.fillStyle = "#fff";
    poly();
    ctx.fill();
    ctx.save();
    poly();
    ctx.clip();
    ctx.strokeStyle = "#D8344D";
    ctx.lineWidth = 7;
    const n = Math.round(len / 26);
    for (let i = 0; i < n; i++) {
      const t1 = i / n, t2 = (i - 0.6) / n;
      ctx.beginPath();
      ctx.moveTo(tl.x + (bl.x - tl.x) * t1, tl.y + (bl.y - tl.y) * t1);
      ctx.lineTo(tr.x + (br.x - tr.x) * t2, tr.y + (br.y - tr.y) * t2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.lineJoin = "miter";
    poly();
    ctx.stroke();
    ctx.restore();
  }

  function bubbleStyleInside(b, small) {
    if (small) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.2832);
      ctx.fill();
      return;
    }
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.strokeStyle = "rgba(255,255,255,0.96)";
    ctx.lineWidth = Math.max(2.5, b.r * 0.15);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(2.5, b.r * 0.13);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.62, Math.PI * 1.08, Math.PI * 1.45);
    ctx.stroke();
  }
  function bubbleStyleAbove(b) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.strokeStyle = GREEN_INK;
    ctx.lineWidth = Math.max(3, b.r * 0.1 + 2);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(111,240,157,0.95)";
    ctx.lineWidth = Math.max(2.5, b.r * 0.12);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.62, Math.PI * 1.08, Math.PI * 1.45);
    ctx.stroke();
  }
  function drawBubble(b) {
    const surf = waveY(b.x);
    const small = b.r < 5;
    if (b.y - b.r >= surf) {
      bubbleStyleInside(b, small);
    } else if (b.y + b.r <= surf) {
      bubbleStyleAbove(b);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(b.x - b.r - 6, surf, b.r * 2 + 12, b.r + 12);
      ctx.clip();
      bubbleStyleInside(b, false);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(b.x - b.r - 6, b.y - b.r - 6, b.r * 2 + 12, surf - (b.y - b.r - 6));
      ctx.clip();
      bubbleStyleAbove(b);
      ctx.restore();
    }
  }

  function drawSoda(Bsway) {
    ctx.save();
    cupPath();
    ctx.clip();

    // cherry: floats with about a third of it above the soda, riding the waves
    const cy = waveY(cherryX) + cherryR * 0.3 + Math.sin(t * 1.7) * 2.5 + Math.sin(angle) * 4 * env;
    cherryCy = cy;
    ctx.save();
    ctx.fillStyle = "#D8344D";
    ctx.strokeStyle = "#6A1924";
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.arc(cherryX, cy, cherryR, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#F4A7B0";
    ctx.beginPath();
    ctx.arc(cherryX - cherryR * 0.32, cy - cherryR * 0.38, cherryR * 0.24, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    // soda body with a lively surface
    const lx = leftAt(SURF_Y) - 6, rx = rightAt(SURF_Y) + 6;
    ctx.fillStyle = SODA;
    ctx.beginPath();
    ctx.moveTo(lx, waveY(lx));
    for (let x = lx + 8; x < rx; x += 8) ctx.lineTo(x, waveY(x));
    ctx.lineTo(rx, waveY(rx));
    ctx.lineTo(cup.br + 6, cup.bottomY + 6);
    ctx.lineTo(cup.bl - 6, cup.bottomY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = SURF;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lx, waveY(lx));
    for (let x = lx + 8; x < rx; x += 8) ctx.lineTo(x, waveY(x));
    ctx.stroke();

    // swirl lines that follow the stirring
    if (env > 0.04) {
      ctx.lineCap = "round";
      for (let k = 0; k < 2; k++) {
        const yy = SURF_Y + 110 + k * 140;
        const f = (yy - cup.topY) / CUP_H;
        const cx = P.x + (Bsway.x - P.x) * ((yy - P.y) / (Bsway.y - P.y));
        const rxw = 70 + k * 26;
        ctx.strokeStyle = "rgba(255,255,255," + (0.42 * env).toFixed(3) + ")";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(cx, yy, rxw, 15 + k * 4, 0, angle * 1.3 + k * 2.4, angle * 1.3 + k * 2.4 + 1.9);
        ctx.stroke();
      }
    }

    for (const b of bubbles) drawBubble(b);

    for (const p of pops) {
      const k = p.age / p.dur;
      const rr = p.r * (1 + 0.8 * k);
      const below = p.y - p.r > waveY(p.x);
      ctx.strokeStyle = below ? "rgba(255,255,255," + (1 - k).toFixed(2) + ")" : "rgba(31,77,46," + (0.7 * (1 - k)).toFixed(2) + ")";
      ctx.lineWidth = Math.max(2.5, p.r * 0.12);
      ctx.beginPath();
      ctx.arc(p.x, p.y, rr, 0, 6.2832);
      ctx.stroke();
    }
    ctx.restore();

    // outline
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;
    cupPath();
    ctx.stroke();
    ctx.restore();

    // cherry stem, sticking out of the soda
    ctx.save();
    ctx.strokeStyle = "#3D6E2A";
    ctx.lineWidth = 6.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cherryX + 2, cherryCy - cherryR + 2);
    ctx.quadraticCurveTo(cherryX + 25, cherryCy - cherryR - 27, cherryX + 46, cherryCy - cherryR - 50);
    ctx.stroke();
    ctx.restore();
  }

  function drawDrops() {
    ctx.save();
    for (const d of drops) {
      ctx.fillStyle = SURF;
      ctx.strokeStyle = GREEN_INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 6.2832);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // The head transform (shift + tiny tilt + puff) is blended down the neck:
  // full strength at the head, none at the base, so the neck bends smoothly.
  function applyHeadTransform(dx, dy, rot, sx, sy) {
    ctx.translate(dx, dy);
    ctx.translate(C.x, C.y);
    ctx.scale(sx, sy);
    ctx.translate(-C.x, -C.y);
    ctx.translate(J.x, J.y);
    ctx.rotate(rot);
    ctx.translate(-J.x, -J.y);
  }

  function drawGiraffe(pose) {
    if (!imgReady) return;
    const SH = 4;
    const SX = 1100, SW = 640;
    for (let y0 = YCUT; y0 < YBASE; y0 += SH) {
      const tt = (y0 + SH / 2 - YCUT) / (YBASE - YCUT);
      const w = (1 - tt) * (1 - tt);
      const a = clamp((YBASE - 25 - (y0 + SH / 2)) / 190, 0, 1);
      if (a <= 0) continue;
      ctx.save();
      ctx.globalAlpha = a;
      applyHeadTransform(pose.dx * w, pose.dy * w, pose.rot * w, 1 + (pose.sx - 1) * w, 1 + (pose.sy - 1) * w);
      ctx.drawImage(img, SX, y0, SW, SH + 1, SX, y0, SW, SH + 1);
      ctx.restore();
    }
    ctx.save();
    applyHeadTransform(pose.dx, pose.dy, pose.rot, pose.sx, pose.sy);
    const HX = 780, HY = 480;
    const HW = 880, HH = YCUT + 14 - HY;
    if (pose.puffMix < 1 || !puffReady) ctx.drawImage(img, HX, HY, HW, HH, HX, HY, HW, HH);
    if (puffReady && pose.puffMix > 0) {
      ctx.globalAlpha = pose.puffMix;
      ctx.drawImage(imgP, HX, HY, HW, HH, HX, HY, HW, HH);
    }
    ctx.restore();
  }

  // ---------- main loop ----------
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    blowT += dt;
    const blowing = blowT < 1.3;
    const phase = t % 4;
    let envT = phase < 3 ? 1 : 0;
    if (hover) envT = 1;
    if (reduced && !hover) envT = 0;
    if (blowing) envT = 0;
    env += (envT - env) * Math.min(1, dt * (envT ? 5 : 8));
    spd += ((hover ? 2.4 : 1) - spd) * Math.min(1, dt * 4);
    angle += dt * Math.PI * 2 * 0.76 * spd;

    // puff amount while blowing
    let p = 0;
    if (blowT < 0.22) p = ease(blowT / 0.22);
    else if (blowT < 0.85) p = 1;
    else if (blowT < 1.25) p = 1 - ease((blowT - 0.85) / 0.4);

    const R = 26;
    const dx = R * env * Math.cos(angle) + Math.sin(blowT * 70) * 1.6 * p;
    const dy = R * 0.62 * env * Math.sin(angle) + Math.sin(t * 1.6) * 2 - 5 * p;
    const rot = 0.02 * env * Math.sin(angle + 0.9) - 0.025 * p;
    const sx = 1, sy = 1;
    const puffMix = clamp((p - 0.25) / 0.3, 0, 1);
    const pose = { dx, dy, rot, sx, sy, puffMix };

    // where the straw enters the chin after the head transform
    const m = new DOMMatrix();
    m.translateSelf(dx, dy);
    m.translateSelf(C.x, C.y);
    m.scaleSelf(sx, sy);
    m.translateSelf(-C.x, -C.y);
    m.translateSelf(J.x, J.y);
    m.rotateSelf((rot * 180) / Math.PI);
    m.translateSelf(-J.x, -J.y);
    const A = m.transformPoint(new DOMPoint(A0.x, A0.y));

    // straw is a lever pivoting on the rim: head moves one way, tip sweeps the other
    const B = { x: P.x + (P.x - A.x) * LEVER, y: P.y + (P.y - A.y) * LEVER };
    B.y = clamp(B.y, cup.topY + 300, cup.bottomY - 30);
    B.x = clamp(B.x, leftAt(B.y) + STRAW_W / 2 + 10, rightAt(B.y) - STRAW_W / 2 - 10);
    const tipSpeed = prevB ? Math.hypot(B.x - prevB.x, B.y - prevB.y) / Math.max(dt, 1e-3) : 0;
    prevB = { x: B.x, y: B.y };

    updateBubbles(dt, B, clamp(tipSpeed, 0, 2200));

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-OX, -OY);
    drawStraw({ x: A.x, y: A.y }, B);
    drawSoda(B);
    drawDrops();
    drawGiraffe(pose);
    ctx.restore();

    requestAnimationFrame(frame);
  }

  let last = performance.now();
  requestAnimationFrame(frame);

  // ---------- input ----------
  let pressStart = 0;
  cv.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hover = true; });
  cv.addEventListener("pointerleave", () => { hover = false; });
  cv.addEventListener("pointerdown", (e) => {
    pressStart = performance.now();
    if (e.pointerType !== "mouse") hover = true;
  });
  cv.addEventListener("pointerup", (e) => {
    const held = performance.now() - pressStart;
    if (e.pointerType === "mouse" || held < 260) startBlow();
    if (e.pointerType !== "mouse") hover = false;
  });
  cv.addEventListener("pointercancel", () => { hover = false; });

})();
