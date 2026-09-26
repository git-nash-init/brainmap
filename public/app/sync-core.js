/* Brain Map OS — item-level sync core (pure logic, no DOM/network, unit-tested in Node).
 *
 * Problem it solves: storing a whole list (all tasks) as ONE row means the last device to save overwrites every other
 * device's changes. Here every task/goal/note/... is its own row, and merges are decided per item:
 *   - an item edited on this device and not yet uploaded is never overwritten by a remote copy
 *   - a remote deletion removes the item unless it has unsent local edits
 *   - an item deleted locally is not resurrected by a stale remote copy before the deletion is uploaded
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.BMSync = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ARRAY_KEYS = { sb_tasks: 1, sb_goals: 1, sb_habits: 1, sb_notes: 1, sb_journal: 1, sb_finance: 1, sb_projects: 1, sb_vision: 1, sb_routines: 1 };
  var MAP_KEYS = { sb_habitlogs: 1 };

  function kind(base) { return ARRAY_KEYS[base] ? 'array' : MAP_KEYS[base] ? 'map' : 'blob'; }
  function itemKey(base, id) { return base + '#' + id; }
  function parseKey(key) { var i = key.indexOf('#'); return i < 0 ? { base: key, id: null } : { base: key.slice(0, i), id: key.slice(i + 1) }; }

  // deterministic JSON (sorted keys) so the same item hashes the same on every device
  function canon(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
  }
  function hash(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; } return h.toString(16) + ':' + str.length; }

  function parse(json, fallback) { try { var v = JSON.parse(json); return v == null ? fallback : v; } catch (e) { return fallback; } }

  /** {id: canonicalItemJson} for the local value of an array/map key. */
  function entries(k, json) {
    var out = {}, v;
    if (kind(k) === 'array') { v = parse(json, []); if (Array.isArray(v)) v.forEach(function (it) { if (it && it.id != null) out[String(it.id)] = canon(it); }); }
    else if (kind(k) === 'map') { v = parse(json, {}); if (v && typeof v === 'object') Object.keys(v).forEach(function (id) { out[id] = canon(v[id]); }); }
    return out;
  }

  /** What must be uploaded so the server matches `json`, given what we last synced (`snap`: id -> hash). */
  function planPush(k, json, snap) {
    snap = snap || {};
    var cur = entries(k, json), upserts = [], removals = [], next = {};
    Object.keys(cur).forEach(function (id) { var h = hash(cur[id]); next[id] = h; if (snap[id] !== h) upserts.push({ id: id, json: cur[id] }); });
    Object.keys(snap).forEach(function (id) { if (!(id in cur)) removals.push(id); });
    return { upserts: upserts, removals: removals, nextSnap: next };
  }

  /**
   * Merge remote item changes into the local value.
   * remote: [{id, deleted, json}] in server order. Returns {json, snap, changed}.
   */
  function applyRemote(k, json, snap, remote) {
    snap = Object.assign({}, snap || {});
    var isArr = kind(k) === 'array';
    var list = isArr ? parse(json, []) : null, map = isArr ? null : parse(json, {});
    if (isArr && !Array.isArray(list)) list = [];
    var byId = {};
    if (isArr) list.forEach(function (it, i) { if (it && it.id != null) byId[String(it.id)] = i; });
    var changed = false;

    remote.forEach(function (r) {
      var id = String(r.id);
      var local = isArr ? (id in byId ? list[byId[id]] : undefined) : (map && id in map ? map[id] : undefined);
      var exists = local !== undefined;
      var S = snap[id];
      var lh = exists ? hash(canon(local)) : null;
      var modified = exists && lh !== S;               // edited (or created) here, not uploaded yet
      var deletedPending = !exists && S !== undefined;  // deleted here, tombstone not uploaded yet

      if (r.deleted) {
        if (exists && !modified) {
          if (isArr) { list.splice(byId[id], 1); byId = {}; list.forEach(function (it, i) { if (it && it.id != null) byId[String(it.id)] = i; }); } else delete map[id];
          delete snap[id]; changed = true;
        } else if (!exists) { delete snap[id]; }
        return;
      }
      if (deletedPending) return;                        // our deletion wins until it is uploaded
      var item = parse(r.json, null); if (item === null) return;
      var rh = hash(canon(item));
      if (!exists) {
        if (isArr) { list.push(item); byId[id] = list.length - 1; } else map[id] = item;
        snap[id] = rh; changed = true;
      } else if (!modified) {
        if (lh !== rh) { if (isArr) list[byId[id]] = item; else map[id] = item; changed = true; }
        snap[id] = rh;
      } /* else: keep the unsent local edit; it will be uploaded and win (last write) */
    });
    return { json: isArr ? JSON.stringify(list) : JSON.stringify(map), snap: snap, changed: changed };
  }

  /**
   * First sync of a list on this device (no snapshot yet, e.g. upgrading from the old app): for items the server already
   * has, trust the server (mark the local copy "unmodified" so it gets replaced); items the server has never seen are new
   * local items and will be uploaded.
   */
  function bootstrapSnap(k, json, remote) {
    var local = entries(k, json), snap = {};
    remote.forEach(function (r) { var id = String(r.id); if (id in local) snap[id] = hash(local[id]); });
    return snap;
  }

  return { bootstrapSnap: bootstrapSnap, kind: kind, itemKey: itemKey, parseKey: parseKey, canon: canon, hash: hash, entries: entries, planPush: planPush, applyRemote: applyRemote };
});
