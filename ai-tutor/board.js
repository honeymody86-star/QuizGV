// السبورة: ترسم أوامر الدرس كرسوم "يدوية" متحركة (SVG + rough.js) في المتصفح، بلا أي تكلفة خادم.
import rough from "./vendor/rough.esm.js";

const NS = "http://www.w3.org/2000/svg";
export const W = 1000, H = 620;
const PALETTE = {
  ink: ["#1f2937", "#e5e7eb"], blue: ["#2563eb", "#bfdbfe"], red: ["#dc2626", "#fecaca"],
  green: ["#16a34a", "#bbf7d0"], orange: ["#ea580c", "#fed7aa"], purple: ["#7c3aed", "#ddd6fe"],
};
const SERIES = ["blue", "orange", "green", "purple", "red", "ink"];
const FONT = "'Cairo', 'Tajawal', system-ui, sans-serif";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const col = (c, i = 0) => (PALETTE[c] || PALETTE.ink)[i];

export class Board {
  constructor(svg) {
    this.svg = svg;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.rc = rough.svg(svg);
    this.layer = document.createElementNS(NS, "g");
    svg.appendChild(this.layer);
    this.speed = 1;
    this.reset();
  }

  reset() {
    this.layer.replaceChildren();
    this.items = new Map();
    this.auto = 0;
  }

  // ---------- أدوات مساعدة ----------
  el(tag, attrs = {}, parent = this.layer) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.appendChild(e);
    return e;
  }
  group(id) {
    const g = this.el("g", { class: "item" });
    if (id) { this.items.get(id)?.g.remove(); }
    return g;
  }
  text(parent, str, x, y, { size = 26, color = "ink", weight = 700, ltr = false, anchor = "middle" } = {}) {
    const t = this.el("text", {
      x, y, "font-size": size, "font-weight": weight, fill: col(color), "text-anchor": anchor,
      "dominant-baseline": "central", "font-family": ltr ? "'Kalam', 'Comic Sans MS', cursive" : FONT,
      direction: ltr ? "ltr" : "rtl", "unicode-bidi": "plaintext",
    }, parent);
    t.textContent = str;
    return t;
  }
  // يرسم مسارات rough كأنها تُخطّ باليد
  drawIn(node, dur = 700, delay = 0) {
    const paths = node.tagName === "path" ? [node] : [...node.querySelectorAll("path")];
    paths.forEach((p) => {
      let len = 0;
      try { len = p.getTotalLength(); } catch { /* ignore */ }
      if (!len) return;
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
        duration: dur / this.speed, delay: delay / this.speed, fill: "forwards", easing: "ease-in-out",
      });
    });
    return node;
  }
  write(t, dur = 600, delay = 0) {
    // يظهر النص كأنه يُكتب (كشف من جهة بداية السطر)
    const rtl = t.getAttribute("direction") === "rtl";
    t.animate([
      { clipPath: rtl ? "inset(-20% 0 -20% 100%)" : "inset(-20% 100% -20% 0)", opacity: 0.2 },
      { clipPath: "inset(-20% 0 -20% 0)", opacity: 1 },
    ], { duration: dur / this.speed, delay: delay / this.speed, fill: "backwards", easing: "ease-out" });
  }
  pop(node, dur = 450, delay = 0) {
    node.style.transformBox = "fill-box";
    node.style.transformOrigin = "center";
    node.animate([{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1.15)", opacity: 1, offset: 0.7 }, { transform: "scale(1)" }],
      { duration: dur / this.speed, delay: delay / this.speed, fill: "backwards", easing: "ease-out" });
  }
  register(id, g, box) {
    const key = id || `_${this.items.size}_${Math.random().toString(36).slice(2, 6)}`;
    this.items.set(key, { g, box });
    return key;
  }
  // موضع تلقائي إن لم يحدد النموذج الإحداثيات: أعمدة من اليمين لليسار
  autoPos() {
    const perCol = 5, i = this.auto++;
    const c = Math.floor(i / perCol), r = i % perCol;
    return { x: clamp(820 - c * 250, 120, 880), y: 130 + r * 95 };
  }
  pos(a) {
    if (typeof a.x !== "number" || typeof a.y !== "number") return this.autoPos();
    return { x: clamp(a.x, 70, W - 70), y: clamp(a.y, 60, H - 50) };
  }
  // نقطة على حافة الصندوق باتجاه نقطة أخرى
  edge(box, tx, ty) {
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const dx = tx - cx, dy = ty - cy;
    if (!dx && !dy) return [cx, cy];
    const sx = (box.w / 2 + 8) / Math.abs(dx || 1e-6), sy = (box.h / 2 + 8) / Math.abs(dy || 1e-6);
    const s = Math.min(sx, sy);
    return [cx + dx * s, cy + dy * s];
  }

  // ---------- تنفيذ الأوامر ----------
  apply(a) {
    try { (this[`do_${a.type}`] || (() => {})).call(this, a); }
    catch (e) { console.warn("board action failed", a, e); }
  }

  do_clear() {
    const old = [...this.layer.children];
    old.forEach((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: "forwards" }));
    setTimeout(() => old.forEach((n) => n.remove()), 360);
    this.items = new Map();
    this.auto = 0;
  }

  do_heading(a) {
    const g = this.group(a.id);
    const t = this.text(g, a.text || "", W / 2, a.y ?? 45, { size: 34, color: a.color || "ink", weight: 800 });
    const b = t.getBBox();
    const line = this.rc.line(b.x - 10, b.y + b.height + 6, b.x + b.width + 10, b.y + b.height + 4, { stroke: col("orange"), strokeWidth: 3, roughness: 1.6 });
    g.appendChild(line);
    this.write(t, 700);
    this.drawIn(line, 600, 500);
    this.register(a.id, g, { x: b.x, y: b.y, w: b.width, h: b.height });
  }

  shapeWithText(a, shape) {
    const { x, y } = this.pos(a);
    const g = this.group(a.id);
    const c = a.color || "blue";
    const t = this.text(g, a.text || "", x, y, { size: 25, color: "ink" });
    const b = t.getBBox();
    const padX = 26, padY = 16;
    let box, s;
    if (shape === "circle") {
      const d = Math.max(b.width + padX * 2, 90);
      box = { x: x - d / 2, y: y - d / 2, w: d, h: d };
      s = this.rc.circle(x, y, d, { stroke: col(c), strokeWidth: 2.4, fill: col(c, 1), fillStyle: "hachure", hachureGap: 7, roughness: 1.3 });
    } else {
      box = { x: b.x - padX, y: b.y - padY, w: b.width + padX * 2, h: b.height + padY * 2 };
      s = this.rc.rectangle(box.x, box.y, box.w, box.h, { stroke: col(c), strokeWidth: 2.4, fill: col(c, 1), fillStyle: "hachure", hachureGap: 8, roughness: 1.4 });
    }
    g.insertBefore(s, t);
    this.drawIn(s, 750);
    this.write(t, 500, 450);
    this.register(a.id, g, box);
  }
  do_node(a) { this.shapeWithText(a, "rect"); }
  do_circle(a) { this.shapeWithText(a, "circle"); }

  do_arrow(a) {
    const A = this.items.get(a.from), B = this.items.get(a.to);
    if (!A || !B) return;
    const g = this.group(a.id);
    const bc = (bx) => [bx.x + bx.w / 2, bx.y + bx.h / 2];
    const [bx, by] = bc(B.box), [ax, ay] = bc(A.box);
    const [x1, y1] = this.edge(A.box, bx, by);
    const [x2, y2] = this.edge(B.box, ax, ay);
    const o = { stroke: col(a.color || "ink"), strokeWidth: 2.2, roughness: 1.1 };
    const line = this.rc.line(x1, y1, x2, y2, o);
    const ang = Math.atan2(y2 - y1, x2 - x1), L = 16;
    const h1 = this.rc.line(x2, y2, x2 - L * Math.cos(ang - 0.45), y2 - L * Math.sin(ang - 0.45), o);
    const h2 = this.rc.line(x2, y2, x2 - L * Math.cos(ang + 0.45), y2 - L * Math.sin(ang + 0.45), o);
    g.append(line, h1, h2);
    this.drawIn(line, 550);
    this.drawIn(h1, 200, 520);
    this.drawIn(h2, 200, 520);
    if (a.text) {
      const t = this.text(g, a.text, (x1 + x2) / 2, (y1 + y2) / 2 - 16, { size: 19, color: a.color || "ink", weight: 600 });
      this.write(t, 400, 500);
    }
    this.register(a.id, g, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) });
  }

  do_text(a) {
    const { x, y } = this.pos(a);
    const g = this.group(a.id);
    const t = this.text(g, a.text || "", x, y, { size: 24, color: a.color || "ink", weight: 600 });
    this.write(t, 700);
    const b = t.getBBox();
    this.register(a.id, g, { x: b.x, y: b.y, w: b.width, h: b.height });
  }

  do_formula(a) {
    const { x, y } = this.pos(a);
    const g = this.group(a.id);
    const t = this.text(g, a.text || "", x, y, { size: 36, color: a.color || "purple", weight: 700, ltr: true });
    this.write(t, 900);
    const b = t.getBBox();
    this.register(a.id, g, { x: b.x, y: b.y, w: b.width, h: b.height });
  }

  do_list(a) {
    const items = a.items || [];
    const x = typeof a.x === "number" ? clamp(a.x, 150, W - 40) : 900;
    const y0 = typeof a.y === "number" ? clamp(a.y, 80, H - 60) : 140;
    const g = this.group(a.id);
    let minX = x, maxY = y0;
    items.forEach((it, i) => {
      const y = y0 + i * 52;
      const dot = this.rc.circle(x - 6, y, 12, { fill: col(a.color || "blue"), fillStyle: "solid", stroke: "none", roughness: 0.8 });
      g.appendChild(dot);
      const t = this.text(g, it, x - 24, y, { size: 24, weight: 600, anchor: "start" });
      this.pop(dot, 300, i * 650);
      this.write(t, 550, i * 650 + 120);
      const b = t.getBBox();
      minX = Math.min(minX, b.x); maxY = y + 20;
    });
    this.register(a.id, g, { x: minX, y: y0 - 20, w: x - minX, h: maxY - y0 + 20 });
  }

  chartArea(a) {
    const w = clamp(a.w || 640, 240, 900), h = clamp(a.h || 380, 180, 520);
    const cx = typeof a.x === "number" ? a.x : W / 2, cy = typeof a.y === "number" ? a.y : 350;
    return { x: clamp(cx - w / 2, 30, W - w - 30), y: clamp(cy - h / 2, 80, H - h - 20), w, h };
  }

  do_bar_chart(a) {
    const vals = a.values || [], labels = a.labels || [];
    const r = this.chartArea(a);
    const g = this.group(a.id);
    const max = Math.max(...vals, 1);
    const base = r.y + r.h - 40, top = r.y + (a.text ? 40 : 10);
    if (a.text) this.write(this.text(g, a.text, r.x + r.w / 2, r.y + 12, { size: 22, weight: 800 }), 500);
    const axis = this.rc.linearPath([[r.x, top], [r.x, base], [r.x + r.w, base]], { stroke: col("ink"), strokeWidth: 2, roughness: 1 });
    g.appendChild(axis);
    this.drawIn(axis, 500);
    const n = vals.length, slot = r.w / Math.max(n, 1), bw = Math.min(90, slot * 0.6);
    vals.forEach((v, i) => {
      // ترتيب من اليمين لليسار ليناسب القراءة العربية
      const cx = r.x + r.w - slot * (i + 0.5);
      const bh = ((base - top - 30) * v) / max;
      const c = SERIES[i % SERIES.length];
      const bar = this.rc.rectangle(cx - bw / 2, base - bh, bw, bh, { stroke: col(c), fill: col(c, 1), fillStyle: "hachure", hachureGap: 6, strokeWidth: 2, roughness: 1.2 });
      const bg = this.el("g", {}, g);
      bg.appendChild(bar);
      bg.style.transformBox = "fill-box"; bg.style.transformOrigin = "bottom";
      bg.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 650 / this.speed, delay: (300 + i * 260) / this.speed, fill: "backwards", easing: "cubic-bezier(.2,.9,.3,1.2)" });
      const vt = this.text(g, String(v), cx, base - bh - 16, { size: 19, color: c, weight: 800 });
      this.pop(vt, 300, 700 + i * 260);
      const lt = this.text(g, labels[i] || "", cx, base + 20, { size: 18, weight: 600 });
      this.write(lt, 400, 300 + i * 260);
    });
    this.register(a.id, g, r);
  }

  do_pie_chart(a) {
    const vals = a.values || [], labels = a.labels || [];
    const r = this.chartArea({ ...a, w: a.w || 560, h: a.h || 360 });
    const g = this.group(a.id);
    const sum = vals.reduce((s, v) => s + v, 0) || 1;
    const d = Math.min(r.h - 30, r.w / 2);
    const cx = r.x + r.w - d / 2 - 10, cy = r.y + r.h / 2 + 10;
    if (a.text) this.write(this.text(g, a.text, r.x + r.w / 2, r.y, { size: 22, weight: 800 }), 500);
    let ang = -Math.PI / 2;
    vals.forEach((v, i) => {
      const da = (v / sum) * Math.PI * 2;
      const c = SERIES[i % SERIES.length];
      const arc = this.rc.arc(cx, cy, d, d, ang, ang + da, true, { stroke: col(c), fill: col(c, 1), fillStyle: "solid", strokeWidth: 2, roughness: 1 });
      g.appendChild(arc);
      this.pop(arc, 450, i * 300);
      const ly = r.y + 50 + i * 40, lx = r.x + r.w - d - 40;
      const sw = this.rc.rectangle(lx - 18, ly - 10, 18, 18, { fill: col(c), fillStyle: "solid", stroke: col(c), roughness: 0.6 });
      g.appendChild(sw);
      this.pop(sw, 300, i * 300);
      const pct = Math.round((v / sum) * 100);
      this.write(this.text(g, `${labels[i] || ""} — ${pct}٪`, lx - 28, ly, { size: 19, weight: 600, anchor: "start" }), 400, i * 300 + 100);
      ang += da;
    });
    this.register(a.id, g, r);
  }

  do_counter(a) {
    const { x, y } = typeof a.x === "number" ? this.pos(a) : { x: W / 2, y: 300 };
    const g = this.group(a.id);
    const target = (a.values && a.values[0]) || 0;
    const num = this.text(g, "0", x, y, { size: 72, color: a.color || "red", weight: 900, ltr: true });
    if (a.text) this.write(this.text(g, a.text, x, y + 62, { size: 24, weight: 700 }), 500, 300);
    this.pop(num, 400);
    const dur = 1400 / this.speed, t0 = performance.now(), dec = Number.isInteger(target) ? 0 : 1;
    const fmt = (v) => v.toLocaleString("ar-EG", { maximumFractionDigits: dec, minimumFractionDigits: dec, useGrouping: target >= 10000 });
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      num.textContent = fmt(target * e);
      if (p < 1 && num.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    this.register(a.id, g, { x: x - 120, y: y - 45, w: 240, h: 120 });
  }

  do_emoji(a) {
    const { x, y } = this.pos(a);
    const g = this.group(a.id);
    const t = this.el("text", { x, y, "font-size": 64, "text-anchor": "middle", "dominant-baseline": "central" }, g);
    t.textContent = a.text || "✨";
    this.pop(t, 550);
    this.register(a.id, g, { x: x - 36, y: y - 36, w: 72, h: 72 });
  }

  do_highlight(a) {
    const it = this.items.get(a.to);
    if (!it) return;
    const b = it.box;
    const e = this.rc.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w + 50, b.h + 40, { stroke: col(a.color || "red"), strokeWidth: 3, roughness: 2.2 });
    this.layer.appendChild(e);
    this.drawIn(e, 650);
    it.g.style.transformBox = "fill-box"; it.g.style.transformOrigin = "center";
    it.g.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 700, delay: 300 });
  }

  do_underline(a) {
    const it = this.items.get(a.to);
    if (!it) return;
    const b = it.box;
    const l = this.rc.line(b.x, b.y + b.h + 8, b.x + b.w, b.y + b.h + 6, { stroke: col(a.color || "red"), strokeWidth: 3.5, roughness: 1.8 });
    this.layer.appendChild(l);
    this.drawIn(l, 500);
  }

  do_remove(a) {
    const it = this.items.get(a.to);
    if (!it) return;
    it.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: "forwards" });
    setTimeout(() => it.g.remove(), 360);
    this.items.delete(a.to);
  }
}
