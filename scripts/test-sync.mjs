// Multi-device sync tests for public/app/sync-core.js.   node scripts/test-sync.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const S = createRequire(import.meta.url)("../public/app/sync-core.js");

// ── tiny in-memory "server" + "device" using the same building blocks the app uses ──────────────────────────
function makeServer() { return { rows: new Map(), seq: 0 }; }
function makeDevice(server, name) { return { name, server, local: {}, snap: {}, cursor: 0 }; }
const tasks = (d) => JSON.parse(d.local.sb_tasks ?? "[]");
const setTasks = (d, arr) => { d.local.sb_tasks = JSON.stringify(arr); };

function push(d, base = "sb_tasks") {
  const plan = S.planPush(base, d.local[base], d.snap[base]);
  plan.upserts.forEach((u) => d.server.rows.set(S.itemKey(base, u.id), { json: u.json, deleted: false, seq: ++d.server.seq }));
  plan.removals.forEach((id) => d.server.rows.set(S.itemKey(base, id), { json: "null", deleted: true, seq: ++d.server.seq }));
  d.snap[base] = plan.nextSnap;
}
function pull(d) {
  const rows = [...d.server.rows.entries()].filter(([, r]) => r.seq > d.cursor).sort((a, b) => a[1].seq - b[1].seq);
  const byBase = {};
  rows.forEach(([key, r]) => { const { base, id } = S.parseKey(key); (byBase[base] ??= []).push({ id, deleted: r.deleted, json: r.json }); });
  Object.entries(byBase).forEach(([base, remote]) => {
    const res = S.applyRemote(base, d.local[base], d.snap[base], remote);
    if (res.changed) d.local[base] = res.json;
    d.snap[base] = res.snap;
  });
  d.cursor = Math.max(d.cursor, ...rows.map(([, r]) => r.seq), 0);
}
const names = (d) => tasks(d).map((t) => `${t.name}${t.done ? "✓" : ""}`).sort();
let n = 0;
const t = (title, fn) => { fn(); n++; console.log("✓", title); };

// ── 0. reproduce the reported bug with the OLD design (one blob per list, last write wins) ────────────────
{
  const server = { sb_tasks: "[]" };
  const phone = { sb_tasks: "[]" }, laptop = { sb_tasks: "[]" };
  phone.sb_tasks = JSON.stringify([{ id: "y", name: "Yoyo", done: false }]); server.sb_tasks = phone.sb_tasks;   // phone creates Yoyo
  laptop.sb_tasks = server.sb_tasks;                                                                            // laptop loads it
  const p = JSON.parse(phone.sb_tasks); p[0].done = true; phone.sb_tasks = JSON.stringify(p); server.sb_tasks = phone.sb_tasks; // phone completes it
  const l = JSON.parse(laptop.sb_tasks); l.push({ id: "z", name: "Other", done: false }); laptop.sb_tasks = JSON.stringify(l); server.sb_tasks = laptop.sb_tasks; // stale laptop adds a task
  const yoyo = JSON.parse(server.sb_tasks).find((x) => x.id === "y");
  assert.equal(yoyo.done, false, "old design should have lost the 'done'");
  console.log("• (old design) stale laptop overwrote the phone's 'done' on Yoyo — bug reproduced\n");
}

// ── new design ──────────────────────────────────────────────────────────────────────────────────────────
t("Yoyo: created on the phone, appears on the laptop; completing it on the laptop reaches the phone", () => {
  const s = makeServer(), phone = makeDevice(s, "phone"), laptop = makeDevice(s, "laptop");
  setTasks(phone, [{ id: "y", name: "Yoyo", done: false }]); push(phone);
  pull(laptop); assert.deepEqual(names(laptop), ["Yoyo"]);
  setTasks(laptop, tasks(laptop).map((x) => ({ ...x, done: true }))); push(laptop);
  pull(phone); assert.deepEqual(names(phone), ["Yoyo✓"]);
});

t("stale device editing a DIFFERENT task no longer reverts the other device's change (the reported bug)", () => {
  const s = makeServer(), a = makeDevice(s, "A"), b = makeDevice(s, "B");
  setTasks(a, [{ id: "y", name: "Yoyo", done: false }, { id: "k", name: "Keep", done: false }]); push(a); pull(b);
  setTasks(b, tasks(b).map((x) => (x.id === "y" ? { ...x, done: true } : x))); push(b);      // B completes Yoyo
  setTasks(a, tasks(a).map((x) => (x.id === "k" ? { ...x, name: "Keep!" } : x))); push(a);     // A is stale, edits Keep
  assert.equal(JSON.parse(s.rows.get("sb_tasks#y").json).done, true, "server still has Yoyo done");
  pull(a); pull(b);
  assert.deepEqual(names(a), ["Keep!", "Yoyo✓"]); assert.deepEqual(names(b), ["Keep!", "Yoyo✓"]);
});

t("deleting a task on one device removes it everywhere and a stale device doesn't bring it back", () => {
  const s = makeServer(), a = makeDevice(s, "A"), b = makeDevice(s, "B");
  setTasks(a, [{ id: "y", name: "Yoyo" }, { id: "k", name: "Keep" }]); push(a); pull(b);
  setTasks(b, tasks(b).filter((x) => x.id !== "y")); push(b);
  setTasks(a, tasks(a).map((x) => (x.id === "k" ? { ...x, name: "Keep2" } : x))); push(a);   // stale A saves something else
  pull(a); pull(b);
  assert.deepEqual(names(a), ["Keep2"]); assert.deepEqual(names(b), ["Keep2"]);
});

t("concurrent additions on two devices both survive", () => {
  const s = makeServer(), a = makeDevice(s, "A"), b = makeDevice(s, "B");
  setTasks(a, [{ id: "1", name: "one" }]); push(a); pull(b);
  setTasks(a, [...tasks(a), { id: "2", name: "from A" }]); setTasks(b, [...tasks(b), { id: "3", name: "from B" }]);
  push(a); push(b); pull(a); pull(b);
  assert.deepEqual(names(a), ["from A", "from B", "one"]); assert.deepEqual(names(b), names(a));
});

t("an unsent local edit is not overwritten by a remote change to the same item", () => {
  const s = makeServer(), a = makeDevice(s, "A"), b = makeDevice(s, "B");
  setTasks(a, [{ id: "1", name: "task", done: false }]); push(a); pull(b);
  setTasks(b, [{ id: "1", name: "task", done: true }]); push(b);          // remote change
  setTasks(a, [{ id: "1", name: "renamed locally", done: false }]);        // local edit, not pushed yet
  pull(a);
  assert.equal(tasks(a)[0].name, "renamed locally");                       // preserved
  push(a); pull(b); assert.equal(tasks(b)[0].name, "renamed locally");      // and wins once uploaded
});

t("a task deleted locally (not yet uploaded) is not resurrected by a remote copy arriving first", () => {
  const s = makeServer(), a = makeDevice(s, "A"), b = makeDevice(s, "B");
  setTasks(a, [{ id: "1", name: "x" }]); push(a); pull(b);
  setTasks(b, [{ id: "1", name: "x edited" }]); push(b);
  setTasks(a, []);                                   // A deletes, not pushed yet
  pull(a); assert.deepEqual(tasks(a), []);
  push(a); pull(b); assert.deepEqual(tasks(b), []);
});

t("a remote deletion does not destroy an item that has unsent local edits", () => {
  const s = makeServer(), a = makeDevice(s, "A"), b = makeDevice(s, "B");
  setTasks(a, [{ id: "1", name: "x" }]); push(a); pull(b);
  setTasks(b, []); push(b);
  setTasks(a, [{ id: "1", name: "x, edited offline" }]);
  pull(a); assert.equal(tasks(a).length, 1);
});

t("a brand-new device (empty) receives everything, then edits sync back", () => {
  const s = makeServer(), a = makeDevice(s, "A"), c = makeDevice(s, "C");
  setTasks(a, [{ id: "1", name: "one" }, { id: "2", name: "two", done: true }]); push(a);
  pull(c); assert.deepEqual(names(c), ["one", "two✓"]);
  setTasks(c, tasks(c).map((x) => ({ ...x, done: !x.done }))); push(c); pull(a);
  assert.deepEqual(names(a), ["one✓", "two"]);
});

t("habit logs (map kind) sync per habit", () => {
  const s = makeServer(), a = makeDevice(s, "A"), b = makeDevice(s, "B");
  a.local.sb_habitlogs = JSON.stringify({ h1: ["2026-09-25"] }); push(a, "sb_habitlogs"); pull(b);
  b.local.sb_habitlogs = JSON.stringify({ ...JSON.parse(b.local.sb_habitlogs), h2: ["2026-09-25"] }); push(b, "sb_habitlogs");
  a.local.sb_habitlogs = JSON.stringify({ h1: ["2026-09-25", "2026-09-26"] }); push(a, "sb_habitlogs");
  pull(a); pull(b);
  assert.deepEqual(JSON.parse(a.local.sb_habitlogs), { h1: ["2026-09-25", "2026-09-26"], h2: ["2026-09-25"] });
  assert.deepEqual(JSON.parse(b.local.sb_habitlogs), JSON.parse(a.local.sb_habitlogs));
});

t("legacy single-blob data migrates: missing items are added, local edits kept", () => {
  const legacy = [{ id: "y", name: "Yoyo", done: false }, { id: "k", name: "Keep", done: false }];
  const local = JSON.stringify([{ id: "k", name: "Keep (edited here)", done: false }]);
  const res = S.applyRemote("sb_tasks", local, {}, legacy.map((it) => ({ id: it.id, deleted: false, json: JSON.stringify(it) })));
  const out = JSON.parse(res.json);
  assert.equal(out.length, 2);
  assert.equal(out.find((x) => x.id === "k").name, "Keep (edited here)");
  assert.ok(out.find((x) => x.id === "y"));
  const plan = S.planPush("sb_tasks", res.json, res.snap);       // migration then uploads only the local-only edit
  assert.deepEqual(plan.upserts.map((u) => u.id), ["k"]);
});

t("hashing ignores key order (same item on two devices is 'unchanged')", () => {
  assert.equal(S.hash(S.canon({ a: 1, b: { d: 2, c: 3 } })), S.hash(S.canon({ b: { c: 3, d: 2 }, a: 1 })));
});

t("planPush uploads only changed items", () => {
  const list = JSON.stringify([{ id: "1", n: "a" }, { id: "2", n: "b" }, { id: "3", n: "c" }]);
  const first = S.planPush("sb_tasks", list, {});
  assert.equal(first.upserts.length, 3);
  const edited = JSON.stringify([{ id: "1", n: "a" }, { id: "2", n: "B!" }]);
  const next = S.planPush("sb_tasks", edited, first.nextSnap);
  assert.deepEqual(next.upserts.map((u) => u.id), ["2"]); assert.deepEqual(next.removals, ["3"]);
});

t("upgrading device: server copies win, items the server never saw are uploaded (no stale overwrite)", () => {
  const s = makeServer(), phone = makeDevice(s, "phone"), oldLaptop = makeDevice(s, "laptop");
  setTasks(phone, [{ id: "y", name: "Yoyo", done: true }]); push(phone);                                   // phone: Yoyo done (server truth)
  oldLaptop.local.sb_tasks = JSON.stringify([{ id: "y", name: "Yoyo", done: false }, { id: "n", name: "new here", done: false }]); // old laptop copy, never item-synced
  const remote = [...s.rows.entries()].map(([k, r]) => ({ id: S.parseKey(k).id, deleted: r.deleted, json: r.json }));
  oldLaptop.snap.sb_tasks = S.bootstrapSnap("sb_tasks", oldLaptop.local.sb_tasks, remote);
  pull(oldLaptop);
  assert.deepEqual(names(oldLaptop), ["Yoyo✓", "new here"]);                                                // Yoyo taken from the server, local-only task kept
  push(oldLaptop); pull(phone);
  assert.deepEqual(names(phone), ["Yoyo✓", "new here"]);
});

console.log(`\n${n} sync tests passed`);
