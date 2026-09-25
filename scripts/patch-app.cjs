// One-off: builds public/app/index.html from the original "Second Brain OS" single file.
// Usage: node scripts/patch-app.cjs "<path to original index.html>"
const fs = require("fs");
const src = process.argv[2];
const out = "public/app/index.html";
let h = fs.readFileSync(src, "utf8");
const rep = (a, b) => { if (!h.includes(a)) throw new Error("missing: " + a.slice(0, 80)); h = h.replace(a, () => b); };
const repLine = (startsWith, b) => { const i = h.indexOf(startsWith); if (i < 0) throw new Error("missing line: " + startsWith); const j = h.indexOf("\n", i); h = h.slice(0, i) + b + h.slice(j); };

// ── head / branding
rep('<meta name="apple-mobile-web-app-title" content="Second Brain OS">', '<meta name="apple-mobile-web-app-title" content="Brain Map">\n<link rel="manifest" href="/app/manifest.webmanifest">\n<link rel="icon" href="/app/icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/app/icon.svg">');
rep("<title>Second Brain OS</title>", '<title>Brain Map OS</title>\n<script src="/app/config.js"></script>\n<script src="/app/vault.js"></script>');
rep('<div class="ob-logo">&#9889; SECOND BRAIN OS</div>', '<div class="ob-logo">b<span style="color:#fff">.</span>m &nbsp;BRAIN MAP OS</div>');
rep('<strong style="display:block;margin-bottom:2px">Install Second Brain OS</strong>', '<strong style="display:block;margin-bottom:2px">Install Brain Map OS</strong>');
rep('<div class="brand-logo">&#9889; SECOND BRAIN OS</div>', '<div class="brand-logo">b<span style="color:#fff">.</span>m &nbsp;BRAIN MAP OS</div>');
rep("Second Brain OS v3.0<br>Replace 10+ Apps With One System", 'Brain Map OS v3.1<br>Replace 10+ Apps With One System<br><span style="font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--t3)">created by creativebee.app</span>');
rep("You are a personal AI coach for Second Brain OS.", "You are a personal AI coach for Brain Map OS.");

// ── storage -> sync hooks
rep(
  "set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},\n  del:function(k){localStorage.removeItem(k);}",
  "set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v));if(window.Vault)Vault.touch(k);}catch(e){}},\n  del:function(k){localStorage.removeItem(k);if(window.Vault)Vault.touch(k);}"
);

// ── export (complete) / import / reset
repLine(
  "function exportData(){",
  "var EXPORT_KEYS=['sb_profile','sb_tasks','sb_goals','sb_habits','sb_habitlogs','sb_notes','sb_journal','sb_finance','sb_projects','sb_vision','sb_routines','sb_achievements','sb_weekly_review','sb_currency'];\n" +
    "function exportData(){var o={app:'brain-map-os',version:2,exported:new Date().toISOString(),data:{}};EXPORT_KEYS.forEach(function(k){var v=DB.get(k);if(v!==null)o.data[k]=v;});var b=new Blob([JSON.stringify(o,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='brain-map-backup.json';a.click();toast('Data exported!','success');}\n" +
    "function importData(){var inp=document.createElement('input');inp.type='file';inp.accept='application/json,.json';inp.onchange=function(ev){var f=ev.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var j=JSON.parse(r.result);var d=j.data||j;var n=0;EXPORT_KEYS.forEach(function(k){if(d[k]!==undefined){DB.set(k,d[k]);n++;}});if(!n){toast('Nothing to import','error');return;}toast('Imported '+n+' sections','success');setTimeout(function(){location.reload();},700);}catch(e){toast('Not a valid backup file','error');}};r.readAsText(f);};inp.click();}"
);
repLine(
  "function resetApp(){",
  "function resetApp(){if(!confirm('Delete ALL data permanently (including your cloud copy)?'))return;if(!confirm('Last chance \\u2014 this cannot be undone!'))return;var fin=function(){Object.keys(localStorage).forEach(function(k){if(/^sb_/.test(k)&&k!=='sb_ai_key')localStorage.removeItem(k);});location.reload();};if(window.Vault)Vault.wipeCloud().then(fin,fin);else fin();}"
);

// ── profile + settings entries
rep(
  '<button class="btn-s" onclick="exportData()">\\ud83d\\udce4 Export Data</button>',
  '<button class="btn-s" onclick="exportData()">\\ud83d\\udce4 Export Data</button><button class="btn-s" onclick="importData()">\\ud83d\\udce5 Import Backup</button><button class="btn-s" onclick="Vault.openSecurity()">\\ud83d\\udd10 Security &amp; Recovery</button><button class="btn-s" onclick="Vault.logout()">\\ud83d\\udeaa Sign Out</button>'
);
rep(
  "mkSI('\\ud83d\\udce4','Export Data','Backup as JSON',\"exportData()\")",
  "mkSI('\\ud83d\\udd10','Security & Recovery','Password, recovery code, sign out',\"Vault.openSecurity()\")+mkSI('\\ud83d\\udce4','Export Data','Backup as JSON',\"exportData()\")+mkSI('\\ud83d\\udce5','Import Backup','Restore from JSON',\"importData()\")"
);

// ── PWA: drop the in-code manifest + service worker (real files now)
{
  const a = h.indexOf("(function(){var m={name:'Second Brain OS'");
  const b = h.indexOf("// ── ONBOARDING");
  if (a < 0 || b < 0) throw new Error("pwa block");
  h = h.slice(0, a) + "if('serviceWorker' in navigator){navigator.serviceWorker.register('/app/sw.js',{scope:'/app'}).catch(function(){});}\n" + h.slice(b);
}

// ── boot: gate behind login + encrypted sync
rep(
  "  if(DB.get('sb_profile')){var ob=ge('ob');if(ob)ob.style.display='none';initApp();}",
  "  window.BM_refresh=function(){loadState();updateAvatar();showPage(S.currentPage||'home');};\n" +
    "  var ob0=ge('ob');if(ob0)ob0.style.display='none';\n" +
    "  Vault.boot(function(){if(DB.get('sb_profile')){initApp();}else{var ob=ge('ob');if(ob){ob.style.opacity='1';ob.style.display='flex';}}});"
);

// ── desktop fix: centre the bottom sheet (the original shifted it half off-screen)
rep(
  "@media(min-width:600px){.page,.modal{max-width:480px;left:50%!important}.page{transform:translateX(-50%)}.page.active{transform:translateX(-50%) translateY(0)}#nav,#install-banner{max-width:480px;left:50%;transform:translateX(-50%)}.modal-bg .modal{left:50%;transform:translateX(-50%) translateY(100%)}.modal-bg.open .modal{transform:translateX(-50%) translateY(0)}}",
  "@media(min-width:600px){.page{max-width:480px;left:50%!important}.page{transform:translateX(-50%)}.page.active{transform:translateX(-50%) translateY(0)}#nav,#install-banner{max-width:480px;left:50%;transform:translateX(-50%)}#install-banner{transform:translateX(-50%) translateY(20px)}#install-banner.show{transform:translateX(-50%) translateY(0)}.modal-bg{justify-content:center}.modal{max-width:480px}}"
);

fs.mkdirSync("public/app", { recursive: true });
fs.writeFileSync(out, h);
console.log("wrote", out, h.length);
