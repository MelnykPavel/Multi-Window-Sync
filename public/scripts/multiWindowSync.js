// =========================
// BroadcastChannel Sync
// =========================

const PREFIX = "multiWindowSync";
const bcData = new BroadcastChannel(`${PREFIX}:data`);
const bcLife = new BroadcastChannel(`${PREFIX}:lifecycle`);

const id = crypto.randomUUID();
const otherWindows = new Map();
const g = document.getElementById("lines");
let myCenter = { cx: 0, cy: 0 };

// =========================
// POSITION & CENTER
// =========================

function computeMyCenterOnScreen() {
  return {
    cx: window.screenX + window.outerWidth / 2,
    cy: window.screenY + window.outerHeight / 2,
  };
}

// =========================
// SVG LINES
// =========================

function ensureLine(item, key, cls) {
  if (!item[key]) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
    el.setAttribute("class", cls);
    el.setAttribute("stroke-linecap", "round");
    g.appendChild(el);
    item[key] = el;
  }
  return item[key];
}

function drawLines() {
  const sx = 50;
  const sy = 50;

  otherWindows.forEach((o) => {
    const dx = o.cx - myCenter.cx;
    const dy = o.cy - myCenter.cy;

    const x2 = sx + (dx / window.innerWidth) * 100;
    const y2 = sy + (dy / window.innerHeight) * 100;

    const line = ensureLine(o, "line", "line");
    const glow = ensureLine(o, "glow", "glow");

    line.setAttribute("x1", sx);
    line.setAttribute("y1", sy);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);

    glow.setAttribute("x1", sx);
    glow.setAttribute("y1", sy);
    glow.setAttribute("x2", x2);
    glow.setAttribute("y2", y2);
  });
}

// =========================
// SYNC MESSAGES
// =========================

function publishSelf() {
  bcData.postMessage({
    type: "update",
    id,
    cx: myCenter.cx,
    cy: myCenter.cy,
  });
}

function announceSelf() {
  bcLife.postMessage({ type: "announce", id });
  publishSelf();
}

function updateOthers(fromId, data) {
  if (fromId === id) return;
  let item = otherWindows.get(fromId);

  if (!item) {
    item = { cx: data.cx, cy: data.cy, line: null, glow: null };
    otherWindows.set(fromId, item);
    return;
  }
  item.cx = data.cx;
  item.cy = data.cy;
}

function removeOther(otherId) {
  const item = otherWindows.get(otherId);
  if (!item) return;

  item.line?.remove();
  item.glow?.remove();
  otherWindows.delete(otherId);
}

// =========================
// ANIMATION LOOP
// =========================

function frame() {
  const newCenter = computeMyCenterOnScreen();
  const moved =
    Math.abs(newCenter.cx - myCenter.cx) > 0.1 ||
    Math.abs(newCenter.cy - myCenter.cy) > 0.1;

  if (moved) {
    myCenter = newCenter;
    publishSelf();
    drawLines();
  }

  requestAnimationFrame(frame);
}

// =========================
// CHANNEL LISTENERS
// =========================

bcData.onmessage = (ev) => {
  const msg = ev.data;
  if (!msg || msg.id === id) return;
  if (msg.type !== "update") return;

  updateOthers(msg.id, msg);
  drawLines();
};

bcLife.onmessage = (ev) => {
  const msg = ev.data;
  if (!msg || msg.id === id) return;

  if (msg.type === "announce") {
    publishSelf();
  }

  if (msg.type === "left") {
    removeOther(msg.id);
    drawLines();
  }
};

// =========================
// WINDOW EVENTS
// =========================

window.addEventListener("resize", rawLines);

window.addEventListener("beforeunload", () => {
  bcLife.postMessage({ type: "left", id });
});

// =========================
// START
// =========================

myCenter = computeMyCenterOnScreen();
announceSelf();
drawLines();
requestAnimationFrame(frame);
