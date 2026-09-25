// Generates ORIGINAL Brain Map printable templates as fillable A4 PDFs (pdf-lib).
//   node scripts/build-templates.mjs   ->  templates-out/*.pdf + templates-out/manifest.json
import { PDFDocument, StandardFonts, rgb, PDFName, PDFBool } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";

const OUT = "templates-out";
fs.mkdirSync(OUT, { recursive: true });

const W = 595.28, H = 841.89, M = 36;
const INK = rgb(0.07, 0.07, 0.07), GREEN = rgb(0.18, 0.49, 0.2), LIME = rgb(0.85, 0.98, 0.62), GREY = rgb(0.55, 0.55, 0.55), LINE = rgb(0.75, 0.75, 0.75), PAPER = rgb(0.97, 0.97, 0.94);

const manifest = [];

async function make(title, category, productId, draw, opts = {}) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${title} — Brain Map`);
  pdf.setAuthor("Brain Map (creativebee.app)");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const landscape = !!opts.landscape;
  const page = pdf.addPage(landscape ? [H, W] : [W, H]);
  const form = pdf.getForm();
  const pw = landscape ? H : W, ph = landscape ? W : H;
  let n = 0;
  const c = {
    pdf, page, form, font, bold, pw, ph,
    // y is measured from the TOP for easier layout
    Y: (y) => ph - y,
    text(t, x, y, size = 10, f = font, color = INK) { page.drawText(String(t), { x, y: ph - y - size * 0.8, size, font: f, color }); },
    center(t, cx, y, size = 10, f = font, color = INK) { const w = f.widthOfTextAtSize(String(t), size); page.drawText(String(t), { x: cx - w / 2, y: ph - y - size * 0.8, size, font: f, color }); },
    rect(x, y, w, h, o = {}) { page.drawRectangle({ x, y: ph - y - h, width: w, height: h, borderColor: o.border ?? LINE, borderWidth: o.bw ?? 0.7, color: o.fill }); },
    line(x1, y1, x2, y2, o = {}) { page.drawLine({ start: { x: x1, y: ph - y1 }, end: { x: x2, y: ph - y2 }, thickness: o.t ?? 0.6, color: o.color ?? LINE }); },
    circle(x, y, r, o = {}) { page.drawCircle({ x, y: ph - y, size: r, borderColor: o.border ?? LINE, borderWidth: o.bw ?? 0.7, color: o.fill }); },
    field(x, y, w, h, o = {}) {
      const tf = form.createTextField(`f${++n}`);
      if (o.multi) tf.enableMultiline();
      tf.addToPage(page, { x, y: ph - y - h, width: w, height: h, borderWidth: 0, backgroundColor: undefined, font });
      tf.setFontSize(o.size ?? 9);
      return tf;
    },
    box(x, y, s = 10) {
      const cb = form.createCheckBox(`c${++n}`);
      cb.addToPage(page, { x, y: ph - y - s, width: s, height: s, borderWidth: 0.8, borderColor: INK });
      return cb;
    },
    // page chrome
    header(sub) {
      page.drawRectangle({ x: 0, y: ph - 70, width: pw, height: 70, color: INK });
      c.text(title.toUpperCase(), M, 20, 20, bold, rgb(1, 1, 1));
      if (sub) c.text(sub, M, 46, 9, font, LIME);
      c.text("b.m", pw - M - 26, 24, 16, bold, LIME);
    },
    footer() {
      c.text("Brain Map  ·  created by creativebee.app", M, ph - 28, 7, font, GREY);
      c.center("Type into the fields or print and fill by hand", pw - M - 90, ph - 28, 7, font, GREY);
    },
    label(t, x, y) { c.text(t.toUpperCase(), x, y, 7.5, bold, GREEN); },
    nameDate(y = 84) {
      c.label("Name", M, y); c.line(M + 34, y + 9, M + 240, y + 9); c.field(M + 36, y - 4, 200, 14);
      c.label("Month / Week", pw - M - 220, y); c.line(pw - M - 150, y + 9, pw - M, y + 9); c.field(pw - M - 148, y - 4, 146, 14);
    },
  };
  c.header(opts.sub);
  c.nameDate();
  await draw(c);
  c.footer();
  form.updateFieldAppearances(font);
  const bytes = await pdf.save();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  fs.writeFileSync(path.join(OUT, `${slug}.pdf`), bytes);
  manifest.push({ title, category, productId, file: `${slug}.pdf` });
  console.log("✓", title);
}

// ---------- reusable layouts ----------
const days = (n) => Array.from({ length: n }, (_, i) => i + 1);
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function checkGrid(c, { rows, cols, top = 118, labelW = 130, rowLabel = "Habit", colLabels, bottom = 60 }) {
  const gridW = c.pw - 2 * M - labelW, cw = gridW / cols, rh = Math.min(22, (c.ph - top - bottom - 16) / (rows + 1));
  c.label(rowLabel, M, top - 12);
  colLabels.forEach((l, i) => c.center(l, M + labelW + cw * i + cw / 2, top - 11, cols > 20 ? 6 : 8, c.bold, INK));
  for (let r = 0; r < rows; r++) {
    const y = top + r * rh;
    c.rect(M, y, labelW, rh, { border: LINE }); c.field(M + 3, y + 3, labelW - 6, rh - 6);
    for (let k = 0; k < cols; k++) {
      c.rect(M + labelW + cw * k, y, cw, rh, { fill: r % 2 ? undefined : PAPER });
      c.box(M + labelW + cw * k + (cw - 8) / 2, y + (rh - 8) / 2, 8);
    }
  }
  return top + rows * rh;
}

function notesBox(c, y, label = "Notes", h = 80) {
  c.label(label, M, y); c.rect(M, y + 11, c.pw - 2 * M, h, { border: LINE }); c.field(M + 4, y + 15, c.pw - 2 * M - 8, h - 8, { multi: true });
}

function ruledList(c, { top, count, label, checkbox = true, cols = 1, gap = 14 }) {
  const cw = (c.pw - 2 * M - gap * (cols - 1)) / cols, rh = 24;
  c.label(label, M, top - 12);
  for (let k = 0; k < cols; k++)
    for (let r = 0; r < count; r++) {
      const x = M + k * (cw + gap), y = top + r * rh;
      if (checkbox) c.box(x, y + 6, 11);
      c.line(x + (checkbox ? 18 : 0), y + rh - 2, x + cw, y + rh - 2);
      c.field(x + (checkbox ? 20 : 2), y + 4, cw - (checkbox ? 22 : 4), rh - 8);
    }
}

function weekBoxes(c, top, label = "Plan") {
  const cw = (c.pw - 2 * M - 10) / 2, ch = 132;
  WEEK.forEach((d, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * (cw + 10), y = top + row * (ch + 10);
    if (i === 6) { /* Sunday spans half; notes take the other */ }
    c.rect(x, y, cw, ch, { border: INK }); c.rect(x, y, cw, 16, { fill: LIME, border: INK }); c.text(d.toUpperCase(), x + 6, y + 4, 8, c.bold);
    c.field(x + 4, y + 20, cw - 8, ch - 24, { multi: true });
  });
  const x = M + (cw + 10), y = top + 3 * (ch + 10);
  c.rect(x, y, cw, ch, { border: INK }); c.rect(x, y, cw, 16, { fill: INK, border: INK }); c.text("NOTES / WINS", x + 6, y + 4, 8, c.bold, rgb(1, 1, 1));
  c.field(x + 4, y + 20, cw - 8, ch - 24, { multi: true });
}

async function main() {
  // 1. Monthly habit wheel (the hero product)
  await make("Monthly Habit Wheel", "Habit Tracker", "habit-full", (c) => {
    const cx = 226, cy = 410, r0 = 44, ringW = 16, rings = 8, RX = 432, r1 = r0 + ringW * rings;
    const start = (-90 * Math.PI) / 180, span = (300 * Math.PI) / 180, step = span / 31;
    const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    for (let d = 0; d < 31; d++) {
      const a0 = start + d * step, a1 = a0 + step;
      for (let k = 0; k < rings; k++) {
        const ra = r0 + k * ringW, rb = ra + ringW;
        const [x1, y1] = pt(ra, a0), [x2, y2] = pt(rb, a0), [x3, y3] = pt(rb, a1), [x4, y4] = pt(ra, a1);
        c.page.drawSvgPath(`M ${x1} ${y1} L ${x2} ${y2} A ${rb} ${rb} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${ra} ${ra} 0 0 0 ${x1} ${y1} Z`, { x: 0, y: c.ph, borderColor: INK, borderWidth: 0.5, color: k % 2 ? undefined : PAPER });
      }
      const [lx, ly] = pt(r1 + 9, a0 + step / 2);
      c.center(d + 1, lx, ly - 4, 6.5, c.bold);
    }
    c.center("MONTH / YEAR", cx, cy - 12, 7, c.bold); c.line(cx - 30, cy + 4, cx + 30, cy + 4, { color: INK }); c.field(cx - 30, cy - 6, 60, 12, { size: 8 });
    c.label("Habits (one per ring)", RX, 118);
    for (let i = 0; i < 8; i++) { c.text(`${i + 1}.`, RX, 138 + i * 22, 9, c.bold); c.line(RX + 14, 150 + i * 22, pw(c) - M, 150 + i * 22); c.field(RX + 16, 136 + i * 22, pw(c) - M - RX - 18, 14); }
    c.rect(RX, 330, pw(c) - M - RX, 22, { fill: INK, border: INK }); c.center("OBSERVATIONS", RX + (pw(c) - M - RX) / 2, 336, 9, c.bold, rgb(1, 1, 1));
    c.rect(RX, 352, pw(c) - M - RX, 130, { border: INK }); c.field(RX + 4, 356, pw(c) - M - RX - 8, 122, { multi: true });
    c.rect(RX, 500, pw(c) - M - RX, 22, { fill: INK, border: INK }); c.center("KEY GOALS", RX + (pw(c) - M - RX) / 2, 506, 9, c.bold, rgb(1, 1, 1));
    c.rect(RX, 522, pw(c) - M - RX, 130, { border: INK }); c.field(RX + 4, 526, pw(c) - M - RX - 8, 122, { multi: true });
    c.text("Shade a cell each day you complete the habit: green = done, red = missed.", M, 690, 9, c.font, GREY);
    c.text("“Discipline is doing what needs to be done, even when you don’t feel like doing it.”", M, 706, 9, c.bold, INK);
  }, { sub: "31 days · 8 habits · one clear picture" });

  // 2. Habit Tracker 2.0
  await make("Habit Tracker 2.0", "Habit Tracker", "habit-full", (c) => {
    const end = checkGrid(c, { rows: 20, cols: 31, colLabels: days(31), labelW: 120 });
    notesBox(c, end + 16, "Reflection", 60);
  }, { landscape: false, sub: "Tick each day. 20 habits × 31 days." });

  // 3-5 planners
  await make("Daily Planning", "Planner", "habit-full", (c) => {
    c.label("Top 3 priorities", M, 116);
    for (let i = 0; i < 3; i++) { c.box(M, 132 + i * 24, 11); c.line(M + 18, 152 + i * 24, c.pw - M, 152 + i * 24); c.field(M + 20, 134 + i * 24, c.pw - 2 * M - 22, 16); }
    c.label("Schedule", M, 220);
    for (let h = 5; h <= 22; h++) { const y = 234 + (h - 5) * 24; c.text(`${String(h).padStart(2, "0")}:00`, M, y + 6, 8, c.bold, GREEN); c.line(M + 40, y + 20, 330, y + 20); c.field(M + 42, y + 4, 288 - 42 + 0, 16); }
    c.label("To do", 356, 220);
    for (let i = 0; i < 12; i++) { const y = 234 + i * 24; c.box(356, y + 6, 11); c.line(374, y + 20, c.pw - M, y + 20); c.field(376, y + 4, c.pw - M - 376, 16); }
    notesBox(c, 690, "Gratitude / notes", 60);
  }, { sub: "Plan the day. Win the day." });

  await make("Weekly Planning", "Planner", "habit-full", (c) => { weekBoxes(c, 112); c.label("Top 3 goals this week", M, 112 + 4 * 142 + 4); }, { sub: "Seven days, one clear plan" });
  await make("Weekly Planner 2.0", "Planner", "habit-full", (c) => {
    c.label("Weekly focus", M, 116); c.rect(M, 128, c.pw - 2 * M, 34, { border: INK }); c.field(M + 4, 132, c.pw - 2 * M - 8, 26, { multi: true });
    const top = 178, cw = (c.pw - 2 * M) / 7;
    WEEK.forEach((d, i) => { const x = M + i * cw; c.rect(x, top, cw, 20, { fill: i > 4 ? LIME : INK, border: INK }); c.center(d.slice(0, 3).toUpperCase(), x + cw / 2, top + 6, 8, c.bold, i > 4 ? INK : rgb(1, 1, 1)); c.rect(x, top + 20, cw, 300, { border: INK }); c.field(x + 2, top + 24, cw - 4, 292, { multi: true, size: 8 }); });
    c.label("Habits", M, 516); for (let i = 0; i < 4; i++) { const y = 530 + i * 22; c.rect(M, y, 120, 22); c.field(M + 3, y + 4, 114, 14); for (let d = 0; d < 7; d++) { c.rect(M + 120 + d * ((c.pw - 2 * M - 120) / 7), y, (c.pw - 2 * M - 120) / 7, 22); c.box(M + 120 + d * ((c.pw - 2 * M - 120) / 7) + ((c.pw - 2 * M - 120) / 7 - 9) / 2, y + 7, 9); } }
    notesBox(c, 634, "Review: wins & lessons", 90);
  }, { sub: "Focus · Schedule · Habits · Review" });

  // calendar
  await make("Monthly Calendar", "Planner", "habit-full", (c) => {
    const top = 130, cw = (c.pw - 2 * M) / 7, rh = 100;
    WEEK.forEach((d, i) => { c.rect(M + i * cw, top - 20, cw, 20, { fill: INK, border: INK }); c.center(d.slice(0, 3).toUpperCase(), M + i * cw + cw / 2, top - 14, 8, c.bold, rgb(1, 1, 1)); });
    for (let r = 0; r < 6; r++) for (let k = 0; k < 7; k++) { const x = M + k * cw, y = top + r * rh; c.rect(x, y, cw, rh, { border: LINE }); c.field(x + 3, y + 3, 22, 12, { size: 8 }); c.field(x + 3, y + 18, cw - 6, rh - 22, { multi: true, size: 7 }); }
  }, { sub: "Dates, deadlines and everything in between" });
  await make("Monthly Planning", "Planner", "habit-full", (c) => {
    c.label("Theme of the month", M, 116); c.rect(M, 128, c.pw - 2 * M, 30, { border: INK }); c.field(M + 4, 132, c.pw - 2 * M - 8, 22);
    c.label("Key goals", M, 176); for (let i = 0; i < 5; i++) { c.box(M, 194 + i * 26, 11); c.line(M + 18, 214 + i * 26, c.pw - M, 214 + i * 26); c.field(M + 20, 196 + i * 26, c.pw - 2 * M - 22, 16); }
    c.label("Important dates", M, 342); c.rect(M, 356, 250, 150, { border: LINE }); c.field(M + 4, 360, 242, 142, { multi: true });
    c.label("Habits to build", 306, 342); c.rect(306, 356, c.pw - M - 306, 150, { border: LINE }); c.field(310, 360, c.pw - M - 314, 142, { multi: true });
    notesBox(c, 526, "Weekly milestones", 110); notesBox(c, 660, "End-of-month review", 90);
  }, { sub: "Direction for the next 30 days" });

  // finance
  await make("Monthly Budget", "Finance", "habit-full", (c) => {
    const cats = ["Rent / EMI", "Groceries", "Transport", "Utilities & bills", "Eating out", "Health", "Education", "Entertainment", "Shopping", "Savings / SIP", "Family", "Other"];
    c.label("Income", M, 116); for (let i = 0; i < 3; i++) { c.line(M, 146 + i * 20, 280, 146 + i * 20); c.field(M, 132 + i * 20, 160, 14); c.field(200, 132 + i * 20, 80, 14); }
    c.label("Expenses", M, 210);
    const cols = [["Category", 170], ["Planned", 90], ["Actual", 90], ["Diff", 90]]; let x = M;
    cols.forEach(([t, w]) => { c.rect(x, 226, w, 20, { fill: INK, border: INK }); c.text(t.toUpperCase(), x + 5, 232, 7.5, c.bold, rgb(1, 1, 1)); x += w; });
    cats.forEach((cat, r) => { let xx = M; cols.forEach(([, w], k) => { c.rect(xx, 246 + r * 24, w, 24, { fill: r % 2 ? undefined : PAPER }); if (k === 0) c.text(cat, xx + 5, 246 + r * 24 + 8, 8.5); else c.field(xx + 3, 246 + r * 24 + 5, w - 6, 14, { size: 9 }); xx += w; }); });
    c.rect(M, 246 + 12 * 24, 440, 24, { fill: LIME, border: INK }); c.text("TOTAL", M + 5, 246 + 12 * 24 + 8, 8.5, c.bold);
    notesBox(c, 246 + 12 * 24 + 40, "Money lessons this month", 60);
  }, { sub: "Plan it. Track it. Keep it." });
  await make("Savings Tracker", "Finance", "habit-full", (c) => {
    c.label("Goal", M, 116); c.rect(M, 128, 240, 28, { border: INK }); c.field(M + 4, 133, 232, 18);
    c.label("Target amount", 300, 116); c.rect(300, 128, 120, 28, { border: INK }); c.field(304, 133, 112, 18);
    c.label("Target date", 440, 116); c.rect(440, 128, c.pw - M - 440, 28, { border: INK }); c.field(444, 133, c.pw - M - 448, 18);
    const cols = [["Month", 100], ["Saved", 150], ["Total so far", 150], ["Note", c.pw - 2 * M - 400]]; let x = M;
    cols.forEach(([t, w]) => { c.rect(x, 180, w, 20, { fill: INK, border: INK }); c.text(t.toUpperCase(), x + 5, 186, 7.5, c.bold, rgb(1, 1, 1)); x += w; });
    for (let r = 0; r < 12; r++) { let xx = M; cols.forEach(([, w], k) => { c.rect(xx, 200 + r * 30, w, 30, { fill: r % 2 ? undefined : PAPER }); c.field(xx + 3, 200 + r * 30 + 8, w - 6, 14); xx += w; }); }
  }, { sub: "Every rupee has a destination" });
  await make("Savings Challenge", "Finance", "habit-full", (c) => {
    const denoms = [10, 20, 50, 100, 200, 500];
    c.label("Savings goal", M, 116); c.rect(M, 128, 200, 26, { border: INK }); c.field(M + 4, 132, 192, 18);
    denoms.forEach((d, i) => {
      const x = M + i * ((c.pw - 2 * M) / 6), cw = (c.pw - 2 * M) / 6;
      c.center(`Rs. ${d}`, x + cw / 2, 176, 9, c.bold, GREEN);
      for (let r = 0; r < 25; r++) c.box(x + cw / 2 - 5.5 + 0, 192 + r * 20, 11);
    });
    c.text("Tick a box every time you save that amount.", M, 706, 9, c.font, GREY);
  }, { sub: "Small notes. Big total." });
  await make("100 Day Challenge", "Habit Tracker", "habit-full", (c) => {
    c.label("My challenge", M, 116); c.rect(M, 128, c.pw - 2 * M, 28, { border: INK }); c.field(M + 4, 132, c.pw - 2 * M - 8, 20);
    const cols = 10, cw = (c.pw - 2 * M) / cols;
    for (let i = 0; i < 100; i++) { const x = M + (i % cols) * cw, y = 178 + Math.floor(i / cols) * 54; c.rect(x + 2, y, cw - 4, 50, { border: LINE }); c.text(i + 1, x + 6, y + 4, 7, c.bold, GREEN); c.box(x + cw / 2 - 7, y + 24, 14); }
  }, { sub: "One box a day. Don’t break the chain." });

  // goals
  await make("Goal Setting Planner", "Goals", "habit-full", (c) => {
    c.label("My big goal", M, 116); c.rect(M, 128, c.pw - 2 * M, 44, { fill: PAPER, border: INK }); c.field(M + 4, 132, c.pw - 2 * M - 8, 36, { multi: true, size: 11 });
    const q = ["Why does it matter?", "What will success look like?", "What could get in the way?", "Who or what will help me?"];
    q.forEach((t, i) => { const x = M + (i % 2) * ((c.pw - 2 * M) / 2 + 5), y = 190 + Math.floor(i / 2) * 120, w = (c.pw - 2 * M) / 2 - 5; c.label(t, x, y); c.rect(x, y + 12, w, 92, { border: LINE }); c.field(x + 4, y + 16, w - 8, 84, { multi: true }); });
    c.label("Action steps", M, 444); for (let i = 0; i < 7; i++) { c.box(M, 462 + i * 24, 11); c.line(M + 18, 482 + i * 24, c.pw - 120, 482 + i * 24); c.field(M + 20, 464 + i * 24, c.pw - 2 * M - 142, 16); c.label("Due", c.pw - 112, 468 + i * 24); c.line(c.pw - 90, 482 + i * 24, c.pw - M, 482 + i * 24); c.field(c.pw - 90, 464 + i * 24, 54, 16); }
  }, { sub: "From wish to plan" });
  await make("Harada Method", "Goals", "habit-full", (c) => {
    const gs = 468, cs = gs / 9, x0 = (c.pw - gs) / 2, y0 = 140;
    for (let r = 0; r < 9; r++) for (let k = 0; k < 9; k++) { const x = x0 + k * cs, y = y0 + r * cs; const centre = r >= 3 && r < 6 && k >= 3 && k < 6; c.rect(x, y, cs, cs, { fill: r === 4 && k === 4 ? LIME : centre ? PAPER : undefined, border: LINE }); c.field(x + 2, y + 2, cs - 4, cs - 4, { multi: true, size: 6.5 }); }
    for (let i = 0; i <= 3; i++) { c.line(x0 + i * cs * 3, y0, x0 + i * cs * 3, y0 + gs, { t: 1.4, color: INK }); c.line(x0, y0 + i * cs * 3, x0 + gs, y0 + i * cs * 3, { t: 1.4, color: INK }); }
    c.text("Centre: your main goal. Ring: 8 pillars. Outer blocks: 8 actions for each pillar.", M, y0 + gs + 14, 9, c.font, GREY);
  }, { sub: "64 actions that make one goal inevitable" });

  // trackers
  await make("Task Tracker", "Productivity", "habit-full", (c) => {
    const top = 118, cols = [["Task", 230], ["Priority", 60], ["Due", 70], ["Status", 60], ["Notes", c.pw - 2 * M - 420]]; let x = M;
    cols.forEach(([t, w]) => { c.rect(x, top, w, 20, { fill: INK, border: INK }); c.text(t.toUpperCase(), x + 5, top + 6, 7.5, c.bold, rgb(1, 1, 1)); x += w; });
    for (let r = 0; r < 26; r++) { let xx = M; cols.forEach(([, w], k) => { c.rect(xx, top + 20 + r * 26, w, 26, { fill: r % 2 ? undefined : PAPER }); if (k === 3) c.box(xx + w / 2 - 6, top + 20 + r * 26 + 7, 12); else c.field(xx + 3, top + 20 + r * 26 + 6, w - 6, 14); xx += w; }); }
  }, { sub: "Everything you need to finish, in one place" });
  await make("Reading Tracker", "Productivity", "habit-full", (c) => {
    const top = 118, cols = [["Title", 190], ["Author", 120], ["Started", 60], ["Finished", 60], ["Rating", 50], ["Key takeaway", c.pw - 2 * M - 480]]; let x = M;
    cols.forEach(([t, w]) => { c.rect(x, top, w, 20, { fill: INK, border: INK }); c.text(t.toUpperCase(), x + 4, top + 6, 7, c.bold, rgb(1, 1, 1)); x += w; });
    for (let r = 0; r < 22; r++) { let xx = M; cols.forEach(([, w]) => { c.rect(xx, top + 20 + r * 30, w, 30, { fill: r % 2 ? undefined : PAPER }); c.field(xx + 3, top + 20 + r * 30 + 7, w - 6, 16, { size: 8 }); xx += w; }); }
  }, { sub: "Books finished, lessons kept" });
  await make("Weight Tracker", "Health", "habit-full", (c) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], cw = (c.pw - 2 * M - 20) / 3;
    months.forEach((m, i) => { const x = M + (i % 3) * (cw + 10), y = 118 + Math.floor(i / 3) * 150; c.rect(x, y, cw, 140, { border: INK }); c.rect(x, y, cw, 20, { fill: i % 2 ? LIME : INK, border: INK }); c.text(m.toUpperCase(), x + 6, y + 6, 8, c.bold, i % 2 ? INK : rgb(1, 1, 1)); ["Start", "End", "Change"].forEach((l, k) => { c.label(l, x + 8, y + 34 + k * 34); c.line(x + 8, y + 58 + k * 34, x + cw - 8, y + 58 + k * 34); c.field(x + 8, y + 44 + k * 34, cw - 16, 14); }); });
  }, { sub: "12 months of honest numbers" });
  await make("Workout Tracker", "Health", "habit-full", (c) => {
    const end = checkGrid(c, { rows: 12, cols: 31, colLabels: days(31), labelW: 130, rowLabel: "Exercise / activity" });
    c.label("Personal bests", M, end + 18); for (let i = 0; i < 4; i++) { c.line(M, end + 52 + i * 22, c.pw - M, end + 52 + i * 22); c.field(M, end + 36 + i * 22, c.pw - 2 * M, 16); }
  }, { sub: "Show up. Log it. Get stronger." });
  await make("Weekly Workout", "Health", "habit-full", (c) => {
    const top = 118, cw = (c.pw - 2 * M - 10) / 2;
    WEEK.forEach((d, i) => { const x = M + (i % 2) * (cw + 10), y = top + Math.floor(i / 2) * 150; c.rect(x, y, cw, 140, { border: INK }); c.rect(x, y, cw, 16, { fill: LIME, border: INK }); c.text(d.toUpperCase(), x + 6, y + 4, 8, c.bold); ["Exercise", "Sets", "Reps"].forEach((t, k) => c.text(t, x + [6, cw - 120, cw - 60][k], y + 22, 7, c.bold, GREEN)); for (let r = 0; r < 5; r++) { c.line(x + 4, y + 50 + r * 18, x + cw - 4, y + 50 + r * 18); c.field(x + 4, y + 36 + r * 18, cw - 132, 14, { size: 8 }); c.field(x + cw - 120, y + 36 + r * 18, 40, 14, { size: 8 }); c.field(x + cw - 60, y + 36 + r * 18, 40, 14, { size: 8 }); } });
  }, { sub: "Sets · Reps · Progress" });

  // life planners
  await make("Weekly Meal Planner", "Home", "habit-full", (c) => {
    const meals = ["Breakfast", "Lunch", "Snack", "Dinner"], top = 130, lw = 74, cw = (c.pw - 2 * M - lw) / 4, rh = 82;
    meals.forEach((m, i) => { c.rect(M + lw + i * cw, top - 20, cw, 20, { fill: INK, border: INK }); c.center(m.toUpperCase(), M + lw + i * cw + cw / 2, top - 14, 8, c.bold, rgb(1, 1, 1)); });
    WEEK.forEach((d, r) => { c.rect(M, top + r * rh, lw, rh, { fill: LIME, border: LINE }); c.text(d.toUpperCase(), M + 6, top + r * rh + 8, 8, c.bold); meals.forEach((_, k) => { c.rect(M + lw + k * cw, top + r * rh, cw, rh, { border: LINE }); c.field(M + lw + k * cw + 3, top + r * rh + 3, cw - 6, rh - 6, { multi: true, size: 8 }); }); });
  }, { sub: "Plan once. Eat well all week." });
  await make("Weekly Study Planner", "Study", "habit-full", (c) => {
    c.label("Main goals for the week", M, 112); for (let i = 0; i < 3; i++) { c.line(M, 146 + i * 20, c.pw / 2 - 10, 146 + i * 20); c.field(M, 132 + i * 20, c.pw / 2 - 12, 14); }
    c.label("Top priorities", c.pw / 2 + 10, 112); for (let i = 0; i < 3; i++) { c.line(c.pw / 2 + 10, 146 + i * 20, c.pw - M, 146 + i * 20); c.field(c.pw / 2 + 10, 132 + i * 20, c.pw / 2 - M - 10, 14); }
    const days6 = WEEK.slice(0, 6), cw = (c.pw - 2 * M - 10) / 2;
    days6.forEach((d, i) => { const x = M + (i % 2) * (cw + 10), y = 200 + Math.floor(i / 2) * 130; c.rect(x, y, cw, 120, { border: INK }); c.rect(x, y, cw, 16, { fill: LIME, border: INK }); c.text(d.toUpperCase(), x + 6, y + 4, 8, c.bold); c.text("Subjects / tasks", x + 6, y + 22, 7, c.bold, GREEN); c.field(x + 4, y + 34, cw - 8, 54, { multi: true, size: 8 }); c.text("Study time", x + 6, y + 94, 7, c.bold, GREEN); c.line(x + 60, y + 104, x + cw - 6, y + 104); c.field(x + 60, y + 92, cw - 66, 14, { size: 8 }); });
    c.label("What worked?", M, 596); c.rect(M, 608, (c.pw - 2 * M) / 2 - 5, 90, { border: LINE }); c.field(M + 4, 612, (c.pw - 2 * M) / 2 - 13, 82, { multi: true });
    c.label("What can be improved?", c.pw / 2 + 5, 596); c.rect(c.pw / 2 + 5, 608, (c.pw - 2 * M) / 2 - 5, 90, { border: LINE }); c.field(c.pw / 2 + 9, 612, (c.pw - 2 * M) / 2 - 13, 82, { multi: true });
  }, { sub: "Subjects · Time · Review" });
  await make("Social Media Planner", "Business", "habit-full", (c) => {
    const cols = [["Day", 62], ["Platform", 80], ["Topic / hook", 150], ["Format", 70], ["Caption / notes", c.pw - 2 * M - 362]]; const top = 118; let x = M;
    cols.forEach(([t, w]) => { c.rect(x, top, w, 20, { fill: INK, border: INK }); c.text(t.toUpperCase(), x + 4, top + 6, 7, c.bold, rgb(1, 1, 1)); x += w; });
    for (let r = 0; r < 14; r++) { let xx = M; cols.forEach(([, w], k) => { c.rect(xx, top + 20 + r * 40, w, 40, { fill: r % 2 ? undefined : PAPER }); if (k === 0) c.text(WEEK[r % 7].slice(0, 3).toUpperCase() + (r > 6 ? " 2" : ""), xx + 5, top + 20 + r * 40 + 14, 8, c.bold); else c.field(xx + 3, top + 20 + r * 40 + 4, w - 6, 32, { multi: true, size: 8 }); xx += w; }); }
  }, { sub: "Two weeks of content, planned" });

  // bonus everyday
  await make("To-Do List", "Everyday", "habit-full", (c) => {
    c.label("Must do today", M, 112); ruledList(c, { top: 128, count: 6, label: "", checkbox: true });
    c.label("Should do", M, 290); ruledList(c, { top: 306, count: 8, label: "", checkbox: true });
    c.label("Could do", M, 512); ruledList(c, { top: 528, count: 6, label: "", checkbox: true });
  }, { sub: "Prioritise. Then finish." });
  await make("Grocery List", "Everyday", "habit-full", (c) => {
    const cats = ["Produce", "Dairy & eggs", "Grains & pulses", "Snacks & drinks", "Household", "Other"], cw = (c.pw - 2 * M - 12) / 2;
    cats.forEach((t, i) => { const x = M + (i % 2) * (cw + 12), y = 118 + Math.floor(i / 2) * 208; c.rect(x, y, cw, 198, { border: INK }); c.rect(x, y, cw, 18, { fill: LIME, border: INK }); c.text(t.toUpperCase(), x + 6, y + 5, 8, c.bold); for (let r = 0; r < 8; r++) { c.box(x + 6, y + 28 + r * 20, 10); c.line(x + 22, y + 40 + r * 20, x + cw - 6, y + 40 + r * 20); c.field(x + 24, y + 26 + r * 20, cw - 32, 14, { size: 8 }); } });
  }, { sub: "Never forget the one thing" });
  await make("Cleaning Schedule", "Home", "habit-full", (c) => {
    const areas = ["Kitchen", "Bathroom", "Bedroom", "Living room", "Floors", "Laundry", "Windows", "Fridge", "Trash", "Balcony / other"], top = 130, lw = 140, cols = ["Daily", "Weekly", "Monthly", "Quarterly"], cw = (c.pw - 2 * M - lw) / 4;
    cols.forEach((t, i) => { c.rect(M + lw + i * cw, top - 20, cw, 20, { fill: INK, border: INK }); c.center(t.toUpperCase(), M + lw + i * cw + cw / 2, top - 14, 8, c.bold, rgb(1, 1, 1)); });
    areas.forEach((a, r) => { c.rect(M, top + r * 48, lw, 48, { fill: r % 2 ? undefined : PAPER }); c.field(M + 4, top + r * 48 + 15, lw - 8, 16, { size: 9 }); c.text(a, M + 5, top + r * 48 + 4, 6.5, c.bold, GREEN); cols.forEach((_, k) => { c.rect(M + lw + k * cw, top + r * 48, cw, 48, { fill: r % 2 ? undefined : PAPER }); c.box(M + lw + k * cw + cw / 2 - 7, top + r * 48 + 17, 14); }); });
  }, { sub: "A clean home, on a schedule" });

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n${manifest.length} templates written to ${OUT}/`);
}

function pw(c) { return c.pw; }
main().catch((e) => { console.error(e); process.exit(1); });
