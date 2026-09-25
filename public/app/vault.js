/* Brain Map OS — login + end-to-end encrypted cloud sync.
 *
 * - Auth: Supabase GoTrue over fetch (no SDK), username -> synthetic email.
 * - Encryption: a random 256-bit data key (DEK) encrypts every sb_* value with AES-GCM in the browser.
 *   The DEK is stored in the cloud only wrapped (encrypted) by a key derived from the user's password
 *   (PBKDF2-SHA256, 600k iterations) and by a one-time recovery code. The server only ever sees ciphertext.
 * - The unwrapped DEK lives in IndexedDB as a NON-extractable CryptoKey so the device stays unlocked.
 * - Sync: localStorage stays the working copy (the app is unchanged); DB.set/DB.del call Vault.touch(key),
 *   changed keys are encrypted and upserted to `vault_items` (last-write-wins). Works offline, retries later.
 */
(function () {
  'use strict';
  var CFG = window.BM_CONFIG || {};
  var LS_SESSION = 'bm_session', LS_DIRTY = 'bm_dirty', LS_OWNER = 'bm_owner', LS_SYNC = 'bm_lastsync';
  var NOSYNC = { sb_ai_key: 1, sb_install_dismissed: 1 }; // device-only
  var PBKDF2_ITERS = 600000;
  var te = new TextEncoder(), td = new TextDecoder();

  var session = null, uid = null, dek = null, ready = false, flushing = false, timer = null, doneCb = null;

  // ── helpers ────────────────────────────────────────────────────────────────
  function b64(buf) { var b = new Uint8Array(buf), s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
  function unb64(s) { var bin = atob(s), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b; }
  function rand(n) { return crypto.getRandomValues(new Uint8Array(n)); }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function syncable(k) { return /^sb_/.test(k) && !NOSYNC[k]; }
  function getDirty() { try { return JSON.parse(localStorage.getItem(LS_DIRTY) || '[]'); } catch (e) { return []; } }
  function setDirty(a) { localStorage.setItem(LS_DIRTY, JSON.stringify(a)); }
  function localKeys() { var o = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (syncable(k)) o.push(k); } return o; }
  function wipeLocal() { localKeys().concat(['sb_ai_key', 'sb_install_dismissed', LS_DIRTY, LS_SYNC, LS_OWNER]).forEach(function (k) { localStorage.removeItem(k); }); }

  // ── IndexedDB (non-extractable DEK) ───────────────────────────────────────
  function idb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open('bm-vault', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('k'); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function idbGet(k) { return idb().then(function (db) { return new Promise(function (res, rej) { var q = db.transaction('k').objectStore('k').get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { rej(q.error); }; }); }); }
  function idbSet(k, v) { return idb().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('k', 'readwrite'); t.objectStore('k').put(v, k); t.oncomplete = res; t.onerror = function () { rej(t.error); }; }); }); }
  function idbDel(k) { return idb().then(function (db) { return new Promise(function (res) { var t = db.transaction('k', 'readwrite'); t.objectStore('k').delete(k); t.oncomplete = res; t.onerror = res; }); }); }

  // ── crypto ────────────────────────────────────────────────────────────────
  function kek(secret, saltB64) {
    return crypto.subtle.importKey('raw', te.encode(secret), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: unb64(saltB64), iterations: PBKDF2_ITERS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function wrap(raw, key) { var iv = rand(12); return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, raw).then(function (ct) { return { ct: b64(ct), iv: b64(iv) }; }); }
  function unwrap(ct, iv, key) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct)); }
  function importDek(raw) { return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); }
  function makeRecovery() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = rand(20), s = '';
    for (var i = 0; i < 20; i++) { s += A[b[i] % 32]; if (i % 4 === 3 && i < 19) s += '-'; }
    return s;
  }
  function normRecovery(s) { return String(s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function aad(name) { return te.encode(uid + ':' + name); }
  function encItem(name, str) {
    var iv = rand(12);
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: aad(name) }, dek, te.encode(str)).then(function (ct) { return { iv: b64(iv), ciphertext: b64(ct) }; });
  }
  function decItem(name, row) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(row.iv), additionalData: aad(name) }, dek, unb64(row.ciphertext)).then(function (pt) { return td.decode(pt); });
  }

  // ── network ────────────────────────────────────────────────────────────────
  function saveSession(s) { session = s; if (s) localStorage.setItem(LS_SESSION, JSON.stringify(s)); else localStorage.removeItem(LS_SESSION); }
  function toSession(j) { return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: j.user }; }
  function authCall(path, body, token) {
    var h = { apikey: CFG.key, 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    return fetch(CFG.url + path, { method: body === undefined ? 'GET' : 'POST', headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  }
  var refreshing = null;
  function refresh() {
    if (refreshing) return refreshing;
    refreshing = authCall('/auth/v1/token?grant_type=refresh_token', { refresh_token: session.refresh_token }).then(function (r) {
      if (!r.ok) { var e = new Error('session'); e.code = 'session'; throw e; }
      return r.json().then(function (j) { saveSession(toSession(j)); });
    }).then(function () { refreshing = null; }, function (e) { refreshing = null; throw e; });
    return refreshing;
  }
  function api(path, opts, noRetry) {
    opts = opts || {};
    var go = function () {
      var h = { apikey: CFG.key, 'Content-Type': 'application/json' };
      for (var k in (opts.headers || {})) h[k] = opts.headers[k];
      if (session) h.Authorization = 'Bearer ' + session.access_token;
      return fetch(CFG.url + path, { method: opts.method || 'GET', headers: h, body: opts.body });
    };
    var pre = session && session.expires_at * 1000 - Date.now() < 60000 ? refresh() : Promise.resolve();
    return pre.then(go).then(function (r) {
      if (r.status === 401 && !noRetry && session) return refresh().then(function () { return api(path, opts, true); });
      return r;
    });
  }
  function signIn(username, password) {
    var email = username.indexOf('@') > -1 ? username.trim() : username.trim().toLowerCase() + '@' + (CFG.usernameDomain || 'app.brainmap.invalid');
    return authCall('/auth/v1/token?grant_type=password', { email: email, password: password }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) { var e = new Error(j.error_description || j.msg || 'login'); e.code = 'credentials'; throw e; }
        saveSession(toSession(j));
      });
    });
  }
  function getKeys() { return api('/rest/v1/vault_keys?select=*&user_id=eq.' + uid).then(function (r) { return r.json(); }).then(function (a) { return a && a[0] ? a[0] : null; }); }

  // ── sync engine ────────────────────────────────────────────────────────────
  var statusEl = null, statusT = null;
  function setStatus(t, cls) {
    if (!statusEl) return;
    statusEl.textContent = t; statusEl.className = 'show ' + (cls || '');
    clearTimeout(statusT); if (cls !== 'err') statusT = setTimeout(function () { statusEl.className = ''; }, 1800);
  }
  function touch(k) {
    if (!ready || !syncable(k)) return;
    var d = getDirty(); if (d.indexOf(k) < 0) { d.push(k); setDirty(d); }
    clearTimeout(timer); timer = setTimeout(flush, 1500);
  }
  function flush() {
    if (flushing || !ready || !dek) return Promise.resolve();
    var d = getDirty(); if (!d.length) return Promise.resolve();
    if (!navigator.onLine) { setStatus('Offline — will sync later', 'off'); return Promise.resolve(); }
    flushing = true;
    var sent = {};
    return Promise.all(d.map(function (k) {
      var v = localStorage.getItem(k); sent[k] = v;
      return encItem(k, v === null ? 'null' : v).then(function (e) { return { user_id: uid, key: k, iv: e.iv, ciphertext: e.ciphertext, deleted: v === null }; });
    })).then(function (rows) {
      return api('/rest/v1/vault_items?on_conflict=user_id,key', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
    }).then(function (r) {
      if (!r.ok) { var pe = new Error('push ' + r.status); pe.status = r.status; throw pe; }
      setDirty(getDirty().filter(function (k) { return !(k in sent) || localStorage.getItem(k) !== sent[k]; }));
      setStatus('Saved ✓');
    }).catch(function (e) {
      if (window.console) console.warn('[Brain Map] sync failed:', e);
      if (e && e.code === 'session') { saveSession(null); ready = false; showLogin('Your session expired. Please sign in again.'); return; }
      setStatus('Sync failed' + (e && e.status ? ' (' + e.status + ')' : '') + ' — retrying', 'err'); clearTimeout(timer); timer = setTimeout(flush, 8000);
    })
      .then(function () { flushing = false; if (getDirty().length && !timer) timer = setTimeout(flush, 1500); });
  }
  function pull(full) {
    var q = '/rest/v1/vault_items?select=key,iv,ciphertext,deleted,updated_at&order=updated_at.asc&limit=1000';
    var since = localStorage.getItem(LS_SYNC);
    if (!full && since) q += '&updated_at=gt.' + encodeURIComponent(since);
    return api(q).then(function (r) { if (!r.ok) throw new Error('pull ' + r.status); return r.json(); }).then(function (rows) {
      var dirty = getDirty(), changed = false, chain = Promise.resolve();
      rows.forEach(function (row) {
        chain = chain.then(function () {
          if (dirty.indexOf(row.key) >= 0) return;
          return decItem(row.key, row).then(function (pt) {
            if (row.deleted || pt === 'null') localStorage.removeItem(row.key); else localStorage.setItem(row.key, pt);
            changed = true;
          }).catch(function () { /* undecryptable row: skip */ });
        });
      });
      return chain.then(function () { if (rows.length) localStorage.setItem(LS_SYNC, rows[rows.length - 1].updated_at); return changed; });
    });
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  var CSS = '#bm-auth{position:fixed;inset:0;z-index:20000;background:#050505;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;font-family:"DM Sans",sans-serif;color:#fff}' +
    '#bm-auth .bm-card{width:100%;max-width:380px;text-align:center}#bm-auth .bm-logo{display:inline-flex;align-items:center;gap:10px;font-family:Syne,sans-serif;font-weight:800;font-size:24px;margin-bottom:6px}' +
    '#bm-auth .bm-mark{width:38px;height:38px;border-radius:11px;background:#121212;border:1px solid rgba(255,43,43,.6);display:grid;place-items:center;font-size:15px;color:#fff}#bm-auth .bm-mark i{color:#ff2b2b;font-style:normal}' +
    '#bm-auth .bm-by{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#52525b;margin-bottom:32px}#bm-auth h2{font-family:Syne,sans-serif;font-size:24px;margin-bottom:8px}' +
    '#bm-auth p{color:#a1a1aa;font-size:14px;line-height:1.55;margin-bottom:20px}#bm-auth input{width:100%;background:#121212;border:1px solid rgba(255,255,255,.12);color:#fff;font:16px "DM Sans",sans-serif;padding:14px 16px;border-radius:12px;outline:none;margin-bottom:12px;transition:border-color .2s}' +
    '#bm-auth input:focus{border-color:#ff2b2b}#bm-auth button.bm-p{width:100%;padding:15px;border:0;border-radius:12px;background:#ff2b2b;color:#fff;font:600 16px "DM Sans",sans-serif;cursor:pointer;box-shadow:0 8px 28px rgba(255,43,43,.35);transition:transform .15s,opacity .2s}' +
    '#bm-auth button.bm-p:active{transform:scale(.98)}#bm-auth button.bm-p:disabled{opacity:.5}#bm-auth .bm-link{background:none;border:0;color:#a1a1aa;font:14px "DM Sans",sans-serif;margin-top:14px;cursor:pointer;text-decoration:underline}' +
    '#bm-auth .bm-err{color:#ff6b6b;font-size:13px;min-height:18px;margin-bottom:8px}#bm-auth .bm-code{font-family:ui-monospace,Menlo,monospace;font-size:18px;letter-spacing:.06em;background:#121212;border:1px dashed rgba(255,43,43,.6);border-radius:12px;padding:16px 8px;margin-bottom:14px;user-select:all;word-break:break-all}' +
    '#bm-auth label.bm-chk{display:flex;gap:10px;align-items:flex-start;text-align:left;font-size:13px;color:#a1a1aa;margin:14px 0}#bm-auth label.bm-chk input{width:18px;margin:2px 0 0;padding:0}' +
    '#bm-auth .bm-row{display:flex;gap:10px}#bm-auth .bm-row button{flex:1}#bm-auth button.bm-s{padding:13px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:#121212;color:#fff;font:500 14px "DM Sans",sans-serif;cursor:pointer;width:100%}' +
    '#bm-sync{position:fixed;top:10px;left:50%;transform:translate(-50%,-20px);z-index:19000;font:500 11px "DM Sans",sans-serif;background:#121212;border:1px solid rgba(255,255,255,.12);color:#a1a1aa;padding:5px 12px;border-radius:99px;opacity:0;pointer-events:none;transition:all .3s}' +
    '#bm-sync.show{opacity:1;transform:translate(-50%,0)}#bm-sync.err{color:#ff6b6b}#bm-sync.off{color:#f59e0b}';

  function injectUI() {
    if ($('bm-auth')) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var ov = document.createElement('div'); ov.id = 'bm-auth'; ov.style.display = 'none'; document.body.appendChild(ov);
    statusEl = document.createElement('div'); statusEl.id = 'bm-sync'; statusEl.setAttribute('role', 'status'); document.body.appendChild(statusEl);
  }
  function brand() { return '<div class="bm-logo"><span class="bm-mark">b<i>.</i>m</span>Brain Map OS</div><div class="bm-by">created by creativebee.app</div>'; }
  function screen(html) { var ov = $('bm-auth'); ov.style.display = 'flex'; ov.innerHTML = '<div class="bm-card">' + brand() + html + '</div>'; }
  function hide() { var ov = $('bm-auth'); if (ov) { ov.style.display = 'none'; ov.innerHTML = ''; } }
  function bind(id, fn) { var el = $(id); if (el) el.addEventListener('click', fn); }
  function err(t) { var e = $('bm-err'); if (e) e.textContent = t || ''; }
  function busy(id, on, label) { var b = $(id); if (!b) return; b.disabled = on; if (label) b.textContent = on ? 'Please wait…' : label; }
  function siteUrl() { return (CFG.siteUrl || location.origin) + '/account'; }

  function showLogin(msg) {
    screen('<h2>Welcome back</h2><p>Sign in with the app login from <b>My Purchases</b> on the Brain Map site.</p>' +
      '<input id="bm-u" placeholder="Username (e.g. bm-1a2b3c4d)" autocapitalize="none" autocomplete="username" spellcheck="false">' +
      '<input id="bm-p" type="password" placeholder="Password" autocomplete="current-password"><div class="bm-err" id="bm-err">' + esc(msg || '') + '</div>' +
      '<button class="bm-p" id="bm-go">Sign in</button><button class="bm-link" id="bm-help">Where do I find my login?</button>');
    var go = function () {
      var u = $('bm-u').value, p = $('bm-p').value; if (!u || !p) return err('Enter your username and password.');
      err(''); busy('bm-go', true, 'Sign in');
      signIn(u, p).then(function () { return afterAuth(p); }).catch(function (e) { busy('bm-go', false, 'Sign in'); err(e.code === 'credentials' ? 'Wrong username or password.' : 'Could not sign in. Check your connection.'); });
    };
    bind('bm-go', go); $('bm-p').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    bind('bm-help', function () { window.open(siteUrl(), '_blank'); });
  }

  function showSetPassword(tempPw) {
    screen('<h2>Choose your password</h2><p>Pick a new password only you know. It also unlocks your encrypted data, so make it strong (8+ characters).</p>' +
      '<input id="bm-n1" type="password" placeholder="New password" autocomplete="new-password"><input id="bm-n2" type="password" placeholder="Repeat new password" autocomplete="new-password">' +
      '<div class="bm-err" id="bm-err"></div><button class="bm-p" id="bm-go">Set password &amp; continue</button>');
    bind('bm-go', function () {
      var a = $('bm-n1').value, b = $('bm-n2').value;
      if (a.length < 8) return err('Use at least 8 characters.'); if (a !== b) return err('Passwords do not match.');
      if (a === tempPw) return err('Choose a different password than the temporary one.');
      err(''); busy('bm-go', true, 'Set password & continue');
      setupVault(a).catch(function (e) { busy('bm-go', false, 'Set password & continue'); err(e && e.message ? e.message : 'Something went wrong. Try again.'); });
    });
  }

  function showRecoveryCode(code, onDone) {
    screen('<h2>Save your recovery code</h2><p>If you ever lose your password, this code is the <b>only</b> way to unlock your data — not even we can. Store it somewhere safe (password manager, paper).</p>' +
      '<div class="bm-code" id="bm-code">' + code + '</div><div class="bm-row"><button class="bm-s" id="bm-copy">Copy</button><button class="bm-s" id="bm-dl">Download</button></div>' +
      '<label class="bm-chk"><input type="checkbox" id="bm-ok"><span>I have saved my recovery code.</span></label><button class="bm-p" id="bm-go" disabled>Continue</button>');
    bind('bm-copy', function () { navigator.clipboard && navigator.clipboard.writeText(code).then(function () { $('bm-copy').textContent = 'Copied ✓'; }); });
    bind('bm-dl', function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['Brain Map OS recovery code\n\n' + code + '\n\nKeep this file private.'], { type: 'text/plain' })); a.download = 'brain-map-recovery-code.txt'; a.click(); });
    $('bm-ok').addEventListener('change', function () { $('bm-go').disabled = !$('bm-ok').checked; });
    bind('bm-go', onDone);
  }

  function showUnlock() {
    screen('<h2>Unlock your data</h2><p>Enter your password to decrypt your data on this device.</p><input id="bm-p" type="password" placeholder="Password" autocomplete="current-password">' +
      '<div class="bm-err" id="bm-err"></div><button class="bm-p" id="bm-go">Unlock</button><button class="bm-link" id="bm-rec">Use my recovery code</button><button class="bm-link" id="bm-out">Sign out</button>');
    var go = function () { var p = $('bm-p').value; if (!p) return; busy('bm-go', true, 'Unlock'); unlockWith(p).catch(function () { busy('bm-go', false, 'Unlock'); err('Wrong password.'); }); };
    bind('bm-go', go); $('bm-p').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    bind('bm-rec', function () { showRecover(null); }); bind('bm-out', logout);
  }

  function showRecover(currentPw) {
    screen('<h2>Use recovery code</h2><p>Enter the recovery code you saved when you set up your account.</p><input id="bm-rc" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autocapitalize="characters" spellcheck="false">' +
      (currentPw ? '' : '<input id="bm-p" type="password" placeholder="Your current password" autocomplete="current-password">') + '<div class="bm-err" id="bm-err"></div><button class="bm-p" id="bm-go">Restore my data</button><button class="bm-link" id="bm-out">Sign out</button>');
    bind('bm-go', function () {
      var pw = currentPw || ($('bm-p') && $('bm-p').value); if (!pw) return err('Enter your password too.');
      err(''); busy('bm-go', true, 'Restore my data');
      recoverWith($('bm-rc').value, pw).catch(function () { busy('bm-go', false, 'Restore my data'); err('That recovery code is not correct.'); });
    });
    bind('bm-out', logout);
  }

  // ── flows ──────────────────────────────────────────────────────────────────
  function afterAuth(password) {
    uid = session.user.id;
    if (localStorage.getItem(LS_OWNER) && localStorage.getItem(LS_OWNER) !== uid) wipeLocal();
    localStorage.setItem(LS_OWNER, uid);
    return idbGet('dek').then(function (rec) {
      if (rec && rec.uid === uid) dek = rec.key;
      return getKeys();
    }).then(function (kr) {
      if (!kr) { if (!password) return showLogin('Please sign in to finish setup.'); return showSetPassword(password); }
      if (dek) return finish();
      if (password) return unlockWith(password, kr).catch(function () { showRecover(password); });
      showUnlock();
    });
  }

  function unlockWith(password, kr) {
    return (kr ? Promise.resolve(kr) : getKeys()).then(function (k) {
      return kek(password, k.salt).then(function (key) { return unwrap(k.wrapped_dek, k.wrapped_dek_iv, key); });
    }).then(function (raw) { return adopt(raw); });
  }
  function adopt(raw) {
    return importDek(raw).then(function (key) { dek = key; return idbSet('dek', { uid: uid, key: key }); }).then(finish);
  }

  function setupVault(newPw) {
    return api('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password: newPw }) }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.msg || j.message || 'Could not set password.'); });
      return api('/rest/v1/rpc/mark_password_changed', { method: 'POST', body: '{}' });
    }).then(function () {
      var raw = rand(32), salt = b64(rand(16)), rsalt = b64(rand(16)), code = makeRecovery(), row = { user_id: uid, salt: salt, kdf_iters: PBKDF2_ITERS, recovery_salt: rsalt };
      return Promise.all([kek(newPw, salt), kek(normRecovery(code), rsalt)]).then(function (ks) {
        return Promise.all([wrap(raw, ks[0]), wrap(raw, ks[1])]);
      }).then(function (w) {
        row.wrapped_dek = w[0].ct; row.wrapped_dek_iv = w[0].iv; row.wrapped_dek_recovery = w[1].ct; row.wrapped_dek_recovery_iv = w[1].iv;
        return api('/rest/v1/vault_keys', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
      }).then(function (r) {
        if (!r.ok) throw new Error('Could not save your encryption key. Try again.');
        return importDek(raw);
      }).then(function (key) { dek = key; return idbSet('dek', { uid: uid, key: key }); }).then(function () {
        showRecoveryCode(code, function () { localKeys().forEach(touchForce); finish(); });
      });
    });
  }
  function touchForce(k) { var d = getDirty(); if (d.indexOf(k) < 0) { d.push(k); setDirty(d); } }

  function recoverWith(codeInput, currentPw) {
    return getKeys().then(function (k) {
      if (!k.wrapped_dek_recovery) throw new Error('no recovery');
      return kek(normRecovery(codeInput), k.recovery_salt).then(function (key) { return unwrap(k.wrapped_dek_recovery, k.wrapped_dek_recovery_iv, key); });
    }).then(function (raw) {
      var salt = b64(rand(16));
      return kek(currentPw, salt).then(function (key) { return wrap(raw, key); }).then(function (w) {
        return api('/rest/v1/vault_keys?user_id=eq.' + uid, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ salt: salt, wrapped_dek: w.ct, wrapped_dek_iv: w.iv }) });
      }).then(function () { return adopt(raw); });
    });
  }

  var started = false;
  function finish() {
    ready = true; hide();
    var go = function () { if (!started) { started = true; window.addEventListener('online', function () { flush(); }); document.addEventListener('visibilitychange', function () { if (!document.hidden) { pull(false).then(function (c) { if (c && window.BM_refresh) window.BM_refresh(); }).catch(function () {}); flush(); } }); } var cb = doneCb; doneCb = null; if (cb) cb(); flush(); };
    if (!navigator.onLine) return go();
    pull(true).catch(function () {}).then(go);
  }

  function logout() {
    var out = function () {
      var t = session && session.access_token;
      var fin = function () { saveSession(null); idbDel('dek').then(function () { wipeLocal(); location.reload(); }); };
      if (t && navigator.onLine) authCall('/auth/v1/logout', {}, t).then(fin, fin); else fin();
    };
    flush().then(out, out);
  }

  // ── security sheet (called from the app's Settings/Profile) ─────────────────
  function openSecurity() {
    screen('<h2>Security</h2><p>Signed in as <b>' + esc(session && session.user && session.user.email ? session.user.email.split('@')[0] : '') + '</b>. Your data is end-to-end encrypted.</p>' +
      '<button class="bm-s" id="bm-cp" style="margin-bottom:10px">Change password</button><button class="bm-s" id="bm-nr" style="margin-bottom:10px">Generate a new recovery code</button>' +
      '<button class="bm-s" id="bm-sy" style="margin-bottom:10px">Sync now</button><button class="bm-s" id="bm-lo" style="margin-bottom:10px;color:#ff6b6b">Sign out of this device</button><button class="bm-link" id="bm-cl">Close</button>');
    bind('bm-cl', hide); bind('bm-lo', logout);
    bind('bm-sy', function () { hide(); pull(false).then(function (c) { if (c && window.BM_refresh) window.BM_refresh(); }).then(flush); setStatus('Syncing…'); });
    bind('bm-cp', function () {
      screen('<h2>Change password</h2><input id="bm-c0" type="password" placeholder="Current password" autocomplete="current-password"><input id="bm-n1" type="password" placeholder="New password" autocomplete="new-password"><input id="bm-n2" type="password" placeholder="Repeat new password" autocomplete="new-password"><div class="bm-err" id="bm-err"></div><button class="bm-p" id="bm-go">Update password</button><button class="bm-link" id="bm-cl">Cancel</button>');
      bind('bm-cl', openSecurity);
      bind('bm-go', function () {
        var cur = $('bm-c0').value, a = $('bm-n1').value, b = $('bm-n2').value;
        if (a.length < 8) return err('Use at least 8 characters.'); if (a !== b) return err('Passwords do not match.');
        busy('bm-go', true, 'Update password');
        changePassword(cur, a).then(function () { setStatus('Password updated ✓'); hide(); }).catch(function () { busy('bm-go', false, 'Update password'); err('Current password is not correct.'); });
      });
    });
    bind('bm-nr', function () {
      screen('<h2>New recovery code</h2><p>Enter your password. Your old recovery code will stop working.</p><input id="bm-p" type="password" placeholder="Password" autocomplete="current-password"><div class="bm-err" id="bm-err"></div><button class="bm-p" id="bm-go">Generate</button><button class="bm-link" id="bm-cl">Cancel</button>');
      bind('bm-cl', openSecurity);
      bind('bm-go', function () { busy('bm-go', true, 'Generate'); newRecovery($('bm-p').value).catch(function () { busy('bm-go', false, 'Generate'); err('Password is not correct.'); }); });
    });
  }
  function rawFromPassword(pw) { return getKeys().then(function (k) { return kek(pw, k.salt).then(function (key) { return unwrap(k.wrapped_dek, k.wrapped_dek_iv, key); }); }); }
  function changePassword(cur, next) {
    return rawFromPassword(cur).then(function (raw) {
      return api('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password: next }) }).then(function (r) {
        if (!r.ok) throw new Error('auth');
        var salt = b64(rand(16));
        return kek(next, salt).then(function (key) { return wrap(raw, key); }).then(function (w) {
          return api('/rest/v1/vault_keys?user_id=eq.' + uid, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ salt: salt, wrapped_dek: w.ct, wrapped_dek_iv: w.iv }) });
        });
      });
    });
  }
  function newRecovery(pw) {
    return rawFromPassword(pw).then(function (raw) {
      var code = makeRecovery(), rsalt = b64(rand(16));
      return kek(normRecovery(code), rsalt).then(function (key) { return wrap(raw, key); }).then(function (w) {
        return api('/rest/v1/vault_keys?user_id=eq.' + uid, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ recovery_salt: rsalt, wrapped_dek_recovery: w.ct, wrapped_dek_recovery_iv: w.iv }) });
      }).then(function () { showRecoveryCode(code, hide); });
    });
  }
  function wipeCloud() {
    return (ready ? api('/rest/v1/vault_items?user_id=eq.' + uid, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }) : Promise.resolve()).then(function () { localKeys().forEach(function (k) { localStorage.removeItem(k); }); localStorage.removeItem(LS_DIRTY); localStorage.removeItem(LS_SYNC); });
  }

  // ── public API ─────────────────────────────────────────────────────────────
  window.Vault = {
    touch: touch,
    flush: flush,
    logout: logout,
    openSecurity: openSecurity,
    wipeCloud: wipeCloud,
    isCloud: function () { return !!CFG.url && ready; },
    boot: function (done) {
      injectUI(); doneCb = done;
      if (!CFG.url || !CFG.key) { ready = false; doneCb = null; done(); return; }
      try { session = JSON.parse(localStorage.getItem(LS_SESSION) || 'null'); } catch (e) { session = null; }
      if (!session) return showLogin();
      var proceed = function () { afterAuth(null).catch(function () { showLogin(); }); };
      var need = session.expires_at * 1000 - Date.now() < 60000;
      (need ? refresh() : Promise.resolve()).then(proceed, function (e) {
        if (e && e.code === 'session') { saveSession(null); return showLogin('Your session expired. Please sign in again.'); }
        // offline: keep working from the local copy if this device was already unlocked
        uid = session.user.id;
        idbGet('dek').then(function (rec) { if (rec && rec.uid === uid && localStorage.getItem(LS_OWNER) === uid) { dek = rec.key; ready = true; hide(); var cb = doneCb; doneCb = null; if (cb) cb(); } else showLogin('You are offline.'); });
      });
    }
  };
})();
