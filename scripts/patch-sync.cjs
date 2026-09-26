// ONE-OFF (historical): first migration to item-level sync. DO NOT re-run: vault.js has been edited by hand since
// (loading guard, migration fix). Kept for documentation.
// One-off: switches public/app/vault.js + index.html + sw.js to item-level sync (see public/app/sync-core.js).
//   node scripts/patch-sync.cjs      (idempotent)
const fs = require("fs");
const V = "public/app/vault.js", H = "public/app/index.html", W = "public/app/sw.js";
let v = fs.readFileSync(V, "utf8");
if (v.includes("BMSync")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!v.includes(a)) throw new Error("missing: " + a.slice(0, 80)); v = v.replace(a, () => b); };

// 1. the Gemini key now syncs too (end-to-end encrypted like everything else); only the install banner flag stays on-device
rep("  var NOSYNC = { sb_ai_key: 1, sb_install_dismissed: 1 }; // device-only", "  var NOSYNC = { sb_install_dismissed: 1 }; // device-only UI flag; everything else (incl. the AI key) syncs, end-to-end encrypted\n  var LS_SNAP = 'bm_snap', LS_LEGACY = 'bm_legacy', SC = window.BMSync;");
rep("localKeys().concat(['sb_ai_key', 'sb_install_dismissed', LS_DIRTY, LS_SYNC, LS_OWNER])", "localKeys().concat(['sb_ai_key', 'sb_install_dismissed', LS_DIRTY, LS_SYNC, LS_OWNER, LS_SNAP, LS_LEGACY])");

// 2. new flush + pull
const a = v.indexOf("  function flush() {");
const b = v.indexOf("  // ── UI ─");
if (a < 0 || b < 0) throw new Error("flush/pull block");
const engine = `  function getSnap() { try { return JSON.parse(localStorage.getItem(LS_SNAP) || '{}'); } catch (e) { return {}; } }
  function setSnap(s) { localStorage.setItem(LS_SNAP, JSON.stringify(s)); }
  function getLegacy() { try { return JSON.parse(localStorage.getItem(LS_LEGACY) || '[]'); } catch (e) { return []; } }
  function setLegacy(a) { localStorage.setItem(LS_LEGACY, JSON.stringify(a)); }
  function mkRow(key, str, gone) { return encItem(key, gone ? 'null' : str).then(function (e) { return { user_id: uid, key: key, iv: e.iv, ciphertext: e.ciphertext, deleted: !!gone }; }); }

  // Rows to upload for one local key. Lists/maps upload ONLY the items that changed (each item is its own row).
  function planFor(k) {
    var v = localStorage.getItem(k);
    if (SC.kind(k) === 'blob') return mkRow(k, v, v === null).then(function (r) { return { rows: [r], sent: v }; });
    var plan = SC.planPush(k, v, getSnap()[k]), jobs = [];
    plan.upserts.forEach(function (u) { jobs.push(mkRow(SC.itemKey(k, u.id), u.json, false)); });
    plan.removals.forEach(function (id) { jobs.push(mkRow(SC.itemKey(k, id), null, true)); });
    var legacy = getLegacy().indexOf(k) >= 0;
    if (legacy) jobs.push(mkRow(k, null, true));   // retire the old single-blob row for this list
    return Promise.all(jobs).then(function (rows) { return { rows: rows, sent: v, nextSnap: plan.nextSnap, legacyDone: legacy }; });
  }
  function postRows(rows, i) {
    i = i || 0; if (i >= rows.length) return Promise.resolve();
    return api('/rest/v1/vault_items?on_conflict=user_id,key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows.slice(i, i + 200)) }).then(function (r) {
      if (!r.ok) { var pe = new Error('push ' + r.status); pe.status = r.status; throw pe; }
      return postRows(rows, i + 200);
    });
  }
  function flush() {
    if (flushing || !ready || !dek) return Promise.resolve();
    var d = getDirty(); if (!d.length) return Promise.resolve();
    if (!navigator.onLine) { setStatus('Offline — will sync later', 'off'); return Promise.resolve(); }
    flushing = true; timer = null;
    var plans = {};
    return Promise.all(d.map(function (k) { return planFor(k).then(function (p) { plans[k] = p; return p.rows; }); })).then(function (arrs) {
      return postRows([].concat.apply([], arrs));
    }).then(function () {
      var snap = getSnap(), legacy = getLegacy();
      d.forEach(function (k) { var p = plans[k]; if (p.nextSnap) snap[k] = p.nextSnap; if (p.legacyDone) legacy = legacy.filter(function (x) { return x !== k; }); });
      setSnap(snap); setLegacy(legacy);
      setDirty(getDirty().filter(function (k) { return !(k in plans) || localStorage.getItem(k) !== plans[k].sent; }));
      setStatus('Saved ✓');
    }).catch(function (e) {
      if (window.console) console.warn('[Brain Map] sync failed:', e);
      if (e && e.code === 'session') { saveSession(null); ready = false; showLogin('Your session expired. Please sign in again.'); return; }
      setStatus('Sync failed' + (e && e.status ? ' (' + e.status + ')' : '') + ' — retrying', 'err'); clearTimeout(timer); timer = setTimeout(flush, 8000);
    }).then(function () { flushing = false; if (getDirty().length && !timer) timer = setTimeout(flush, 1500); });
  }

  function fetchRows(since) {
    var all = [];
    function page(off) {
      var q = '/rest/v1/vault_items?select=key,iv,ciphertext,deleted,updated_at&order=updated_at.asc,key.asc&limit=1000&offset=' + off;
      if (since) q += '&updated_at=gte.' + encodeURIComponent(since);   // gte + idempotent merge: never skips same-timestamp rows
      return api(q).then(function (r) { if (!r.ok) throw new Error('pull ' + r.status); return r.json(); }).then(function (rows) {
        all = all.concat(rows); return rows.length === 1000 ? page(off + 1000) : all;
      });
    }
    return page(0);
  }

  // Merge remote changes into local storage, item by item. Nothing local and unsent is ever overwritten.
  function pull(full) {
    var since = full ? null : localStorage.getItem(LS_SYNC);
    return fetchRows(since).then(function (rows) {
      return Promise.all(rows.map(function (row) { return decItem(row.key, row).then(function (pt) { return { row: row, pt: pt }; }, function () { return null; }); })).then(function (list) {
        list = list.filter(Boolean);
        var byBase = {}, blobs = [], changed = false, snap = getSnap(), dirty = getDirty(), legacy = getLegacy();
        list.forEach(function (x) {
          var pk = SC.parseKey(x.row.key), kd = SC.kind(pk.base), gone = x.row.deleted || x.pt === 'null';
          if (kd === 'blob') { blobs.push({ key: pk.base, gone: gone, pt: x.pt }); return; }
          var g = byBase[pk.base] || (byBase[pk.base] = { legacy: [], items: [], hadLegacy: false });
          if (pk.id === null) {                        // old single-blob row: expand into items (applied first, item rows override)
            if (gone) return;
            g.hadLegacy = true;
            var val; try { val = JSON.parse(x.pt); } catch (e) { return; }
            if (kd === 'array' && Array.isArray(val)) val.forEach(function (it) { if (it && it.id != null) g.legacy.push({ id: String(it.id), deleted: false, json: JSON.stringify(it) }); });
            else if (kd === 'map' && val && typeof val === 'object') Object.keys(val).forEach(function (id) { g.legacy.push({ id: id, deleted: false, json: JSON.stringify(val[id]) }); });
          } else g.items.push({ id: pk.id, deleted: gone, json: x.pt });
        });
        blobs.forEach(function (b) {
          if (dirty.indexOf(b.key) >= 0) return;       // unsent local change wins (uploaded next)
          var cur = localStorage.getItem(b.key);
          if (b.gone) { if (cur !== null) { localStorage.removeItem(b.key); changed = true; } }
          else if (cur !== b.pt) { localStorage.setItem(b.key, b.pt); changed = true; }
        });
        Object.keys(byBase).forEach(function (base) {
          var g = byBase[base], all = g.legacy.concat(g.items);
          if (snap[base] === undefined) snap[base] = SC.bootstrapSnap(base, localStorage.getItem(base), all);   // first sync of this list here: trust the server
          var res = SC.applyRemote(base, localStorage.getItem(base), snap[base], all);
          if (res.changed) { localStorage.setItem(base, res.json); changed = true; }
          snap[base] = res.snap;
          if (g.hadLegacy) {                       // old single-row copy found: re-upload EVERY item as its own row, then retire the old row
            snap[base] = {};                        // (empty snapshot = nothing counts as already uploaded)
            if (legacy.indexOf(base) < 0) legacy.push(base);
            touchForce(base);
          }
        });
        setSnap(snap); setLegacy(legacy);
        if (rows.length) localStorage.setItem(LS_SYNC, rows[rows.length - 1].updated_at);
        if (changed && window.BM_reloadState) window.BM_reloadState();   // same tick: in-memory state can never overwrite what we just merged
        if (getDirty().length) { clearTimeout(timer); timer = setTimeout(flush, 500); }
        return changed;
      });
    });
  }

  // re-render after a background merge, but never while the user is typing or has a dialog open
  function refreshUI(tries) {
    if (!window.BM_refresh) return;
    var a = document.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !(a.id && a.id.indexOf('bm-') === 0);
    if ((document.querySelector('.modal-bg.open') || typing || (window.S && window.S.fabOpen)) && (tries || 0) < 15) { setTimeout(function () { refreshUI((tries || 0) + 1); }, 3000); return; }
    window.BM_refresh();
  }

`;
v = v.slice(0, a) + engine + v.slice(b);

// 3. background polling + refresh helper in finish()
rep("document.addEventListener('visibilitychange', function () { if (!document.hidden) { pull(false).then(function (c) { if (c && window.BM_refresh) window.BM_refresh(); }).catch(function () {}); flush(); } }); }",
    "document.addEventListener('visibilitychange', function () { if (!document.hidden) { pull(false).then(function (c) { if (c) refreshUI(); }).catch(function () {}); flush(); } });\n      setInterval(function () { if (document.hidden || !navigator.onLine || !ready) return; pull(false).then(function (c) { if (c) refreshUI(); }).catch(function () {}); }, 15000); }");
rep("bind('bm-sy', function () { hide(); pull(false).then(function (c) { if (c && window.BM_refresh) window.BM_refresh(); }).then(flush); setStatus('Syncing…'); });",
    "bind('bm-sy', function () { hide(); pull(true).then(function (c) { if (c) refreshUI(); }).then(flush); setStatus('Syncing…'); });");

// 4. "Reset all data" must reach other devices: mark every row deleted instead of hard-deleting them
rep("return (ready ? api('/rest/v1/vault_items?user_id=eq.' + uid, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }) : Promise.resolve()).then(function () { localKeys().forEach(function (k) { localStorage.removeItem(k); }); localStorage.removeItem(LS_DIRTY); localStorage.removeItem(LS_SYNC); });",
    "return (ready ? api('/rest/v1/vault_items?user_id=eq.' + uid, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ deleted: true }) }) : Promise.resolve()).then(function () { localKeys().forEach(function (k) { localStorage.removeItem(k); }); [LS_DIRTY, LS_SYNC, LS_SNAP, LS_LEGACY].forEach(function (k) { localStorage.removeItem(k); }); });");
fs.writeFileSync(V, v);

// index.html: load sync-core before vault.js; expose a state-only reload hook
let h = fs.readFileSync(H, "utf8");
if (!h.includes("sync-core.js")) {
  const s1 = '<script src="/app/vault.js"></script>';
  if (!h.includes(s1)) throw new Error("vault script tag");
  h = h.replace(s1, '<script src="/app/sync-core.js"></script>\n' + s1);
  const s2 = "window.BM_refresh=function(){loadState();updateAvatar();showPage(S.currentPage||'home');};";
  if (!h.includes(s2)) throw new Error("BM_refresh");
  h = h.replace(s2, s2 + "\n  window.BM_reloadState=function(){loadState();};");
  fs.writeFileSync(H, h);
}
// service worker: precache the new file
let w = fs.readFileSync(W, "utf8");
if (!w.includes("sync-core.js")) { w = w.replace('"/app/vault.js",', '"/app/vault.js", "/app/sync-core.js",').replace('const CACHE = "bm-app-v1";', 'const CACHE = "bm-app-v2";'); fs.writeFileSync(W, w); }
console.log("item-level sync applied");
