// One-off: adds the responsive desktop/tablet layout to public/app/index.html (idempotent; safe to re-run).
//   node scripts/desktop-layout.cjs
const fs = require("fs");
const F = "public/app/index.html";
let h = fs.readFileSync(F, "utf8");
if (h.includes("/* ── DESKTOP LAYOUT")) { console.log("already applied"); process.exit(0); }
const rep = (a, b) => { if (!h.includes(a)) throw new Error("missing: " + a.slice(0, 80)); h = h.replace(a, () => b); };

// ── 1. tablet: same mobile design, wider column (was 480px)
rep("@media(min-width:600px){.page{max-width:480px;left:50%!important}", "@media(min-width:600px){.page{width:100%;max-width:640px;left:50%!important;right:auto}");
rep("#nav,#install-banner{max-width:480px;left:50%;transform:translateX(-50%)}", "#nav,#install-banner{width:100%;max-width:640px;left:50%;right:auto;transform:translateX(-50%)}");

// ── 2. desktop CSS (>=1024px): sidebar + centred content, dialogs instead of bottom sheets
const css = `
/* ── DESKTOP LAYOUT (>=1024px): left sidebar, wide centred content, centred dialogs. Phones/tablets are unaffected. */
.nav-brand,.nav-sep,.nav-more{display:none}
.hp{display:contents}.hgrid2{display:contents}
@media(min-width:1024px){
:root{--sw:256px;--cw:1120px}
#page-tasks,#page-ai,#page-habits,#page-finance,#page-journal,#page-routines{--cw:900px}
#page-achievements,#page-profile,#page-settings,#page-review,#page-areas{--cw:760px}
::-webkit-scrollbar{width:8px}
/* sidebar */
#nav{top:0;bottom:0;left:0;right:auto;width:var(--sw);max-width:none;height:auto;transform:none;flex-direction:column;align-items:stretch;padding:20px 14px 14px;border-top:0;border-right:1px solid var(--b);background:#090909;backdrop-filter:none;-webkit-backdrop-filter:none;overflow-y:auto}
.nav-brand{display:block;padding:2px 10px 16px}
.nav-brand b{display:block;white-space:nowrap;font-family:"Syne",sans-serif;font-size:14.5px;font-weight:800;letter-spacing:-.2px;color:var(--p)}
.nav-brand b i{font-style:normal;color:#fff}
.nav-brand small{display:block;margin-top:5px;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--t3)}
.nav-items{flex:none;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:2px}
.nav-fab{order:-1;width:100%;height:44px;border-radius:12px;margin:0 0 10px;gap:8px;box-shadow:0 6px 22px var(--pg)}
.nav-fab::after{content:"Quick add";font-size:14px;font-weight:600;color:#fff}
.nav-item{flex-direction:row;justify-content:flex-start;gap:12px;padding:8px 12px;min-width:0;width:100%;border-radius:12px;font-size:14px}
.nav-item:hover{background:rgba(255,255,255,.05);color:var(--t)}
.nav-item.active{background:var(--pd);color:var(--p)}
.nav-item span{font-size:14px;font-weight:500;letter-spacing:0}
.nav-item svg{flex-shrink:0}
.nav-sep{display:block;padding:14px 12px 4px;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--t3)}
.nav-more{display:flex}
.nav-emo{width:22px;text-align:center;font-size:16px;line-height:22px;flex-shrink:0;filter:grayscale(.2)}
/* content: the page is the scroller; padding centres a column of --cw */
.page{left:var(--sw)!important;right:0;width:auto;max-width:none;transform:none!important;padding:0 max(16px,calc((100vw - var(--sw) - var(--cw))/2)) 56px}
.page.active{transform:none!important}
.brand-hdr>div:first-child{display:none}.brand-hdr{justify-content:flex-end}
.topbar{padding-top:24px}
.greet-name{font-size:32px}
.qstats{overflow:visible}.qstat{flex:1;min-width:0;padding:12px 8px}.qstat-v{font-size:20px;white-space:nowrap}
/* home: cards flow in two columns */
.hgrid2{display:block;column-gap:0}
.hp{display:block;break-inside:avoid;padding-top:20px}
.hp>.sec-title{margin-top:0}
/* multi-column lists */
#goals-list,#notes-list{column-gap:0}
#goals-list>*,#notes-list>*{break-inside:avoid}
#goals-list .empty-state,#notes-list .empty-state{column-span:all}
.sec-title{break-after:avoid}
/* wider grids */
.ai-grid{grid-template-columns:repeat(4,1fr)}
.vision-grid{grid-template-columns:repeat(4,1fr)}
.kanban-scroll .kcol{flex:1 1 0;min-width:240px}
/* dialogs instead of bottom sheets */
.modal-bg{align-items:center;justify-content:center;padding:24px}
.modal{max-width:520px;max-height:86vh;border-radius:20px;padding-bottom:24px;transform:translateY(16px) scale(.98)}
.modal-bg.open .modal{transform:none}
.mhandle{display:none}
/* quick-add menu pops out next to the sidebar button; install banner sits bottom-right */
#fab-menu{left:calc(var(--sw) + 10px);bottom:auto;top:78px;transform:none;align-items:flex-start}
#install-banner{left:auto;right:24px;bottom:24px;width:auto;max-width:420px;transform:translateY(20px)}
#install-banner.show{transform:none}
}
@media(min-width:1280px){#goals-list,#notes-list,.hgrid2{column-count:2}}
@media(min-width:1600px){:root{--sw:272px;--cw:1240px}#goals-list,#notes-list,.hgrid2{column-count:3}}
`;
rep("</style>\n</head>", css + "</style>\n</head>");

// ── 3. home: wrap each title+card pair so it can flow in a grid (display:contents on mobile = no visual change)
const a = h.indexOf('  <div class="sec-title ani d2">Life Command Center</div>');
const b = h.indexOf('  <div style="padding:0 16px;margin-bottom:8px"><button class="btn-s" id="h-review-btn"');
if (a < 0 || b < 0) throw new Error("home block");
let block = h.slice(a, b);
const pairs = block.split("\n").filter((l) => l.trim());
if (pairs.length !== 16) throw new Error("expected 16 lines (8 pairs), got " + pairs.length);
let wrapped = '  <div class="hgrid2">\n';
for (let i = 0; i < pairs.length; i += 2) wrapped += '  <div class="hp">\n  ' + pairs[i].trim() + "\n  " + pairs[i + 1].trim() + "\n  </div>\n";
wrapped += "  </div>\n";
h = h.slice(0, a) + wrapped + h.slice(b);

// ── 4. sidebar content: brand + "More" sections (hidden on phones/tablets via CSS)
const more = [["habits", "🔥", "Habits"], ["projects", "🚀", "Projects"], ["finance", "💰", "Finance"], ["journal", "📖", "Journal"], ["vision", "🌟", "Vision Board"], ["routines", "⏰", "Routines"], ["areas", "📊", "Life Areas"], ["achievements", "🏆", "Achievements"], ["review", "📋", "Weekly Review"], ["profile", "👤", "Profile"], ["settings", "⚙️", "Settings"]];
const moreHtml = '    <div class="nav-sep">More</div>\n' + more.map(([p, e, l]) => `    <div class="nav-item nav-more" data-page="${p}" id="nav-${p}"><i class="nav-emo">${e}</i><span>${l}</span></div>`).join("\n") + "\n";
rep('<nav id="nav">\n  <div class="nav-items">', '<nav id="nav">\n  <div class="nav-brand"><b>b<i>.</i>m &nbsp;BRAIN MAP OS</b><small>created by creativebee.app</small></div>\n  <div class="nav-items">');
rep('<span>AI</span></div>\n  </div>\n</nav>', "<span>AI</span></div>\n" + moreHtml + "  </div>\n</nav>");

// ── 5. highlight the active sidebar item for every page (was: only the 5 bottom-nav pages)
rep("['home','goals','tasks','notes','ai'].forEach(function(n){var nav=ge('nav-'+n);if(nav)nav.classList.toggle('active',n===name);});",
    "document.querySelectorAll('.nav-item[data-page]').forEach(function(n){n.classList.toggle('active',n.getAttribute('data-page')===name);});");

fs.writeFileSync(F, h);
console.log("desktop layout applied:", h.length, "bytes");
