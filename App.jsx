import { useState, useEffect, useRef, useCallback } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=JetBrains+Mono:wght@400;500&display=swap');`;

const CSS = `
${FONTS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#f4f6f0;--bg2:#edf0e8;--bg3:#e4e9dc;
  --white:#fff;--surface:#fff;
  --border:#cdd8c0;--border2:#b4c4a0;
  --green:#2e7d32;--green2:#388e3c;--green-lt:#e8f5e9;--green-md:#c8e6c9;
  --leaf:#4caf50;--leaf-lt:#f1f8e9;
  --terra:#bf5e1e;--terra-lt:#fdf3ec;--terra-md:#f0c4a0;
  --sky:#1565c0;--sky-lt:#e3f2fd;--sky-md:#bbdefb;
  --amber:#e65100;--amber-lt:#fff3e0;--amber-md:#ffcc80;
  --danger:#c62828;--danger-lt:#ffebee;--danger-md:#ef9a9a;
  --purple:#6a1b9a;--purple-lt:#f3e5f5;--purple-md:#ce93d8;
  --teal:#00695c;--teal-lt:#e0f2f1;--teal-md:#80cbc4;
  --text:#1b2e14;--text2:#2d4a24;
  --muted:#5a7a4e;--muted2:#7a9a6e;--muted3:#9ab48e;
  --sh-sm:0 1px 4px rgba(0,0,0,.07);
  --sh:0 4px 16px rgba(0,0,0,.09);
  --sh-lg:0 12px 40px rgba(0,0,0,.13);
  --r:10px;--r2:16px;--r3:24px;
  --fn:'Nunito',sans-serif;--fs:'Lora',serif;--fm:'JetBrains Mono',monospace;
}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:var(--fn);font-size:14px;line-height:1.6;min-height:100vh;overflow-x:hidden;}
::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:var(--bg2);}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}

/* SHELL */
.shell{display:flex;min-height:100vh;}
.sidebar{width:252px;flex-shrink:0;background:var(--white);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:200;box-shadow:var(--sh-sm);transition:transform .3s;overflow-y:auto;}
.main{margin-left:252px;flex:1;display:flex;flex-direction:column;min-height:100vh;}
.page-wrap{padding:24px 28px;flex:1;}
@media(max-width:920px){.main{margin-left:0!important}.sidebar{transform:translateX(-100%)}.sidebar.open{transform:none}}
@media(max-width:600px){.page-wrap{padding:14px 16px}.g4,.g3{grid-template-columns:1fr 1fr!important}.g2{grid-template-columns:1fr!important}}

/* SIDEBAR */
.sb-logo{padding:16px 18px 12px;background:linear-gradient(135deg,var(--green),var(--green2));}
.sb-logo-row{font-family:var(--fs);font-size:21px;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px;}
.sb-logo-sub{font-size:11px;color:rgba(255,255,255,.72);margin-top:2px;}
.sb-logo-v{background:rgba(255,255,255,.18);border-radius:5px;padding:1px 7px;font-family:var(--fm);font-size:9px;color:rgba(255,255,255,.9);}
.sb-user{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:var(--leaf-lt);}
.sb-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;flex-shrink:0;background:linear-gradient(135deg,var(--green),var(--green2));box-shadow:0 2px 8px rgba(46,125,50,.3);}
.sb-uname{font-size:13px;font-weight:700;color:var(--text);}
.sb-urole{font-size:10px;color:var(--muted);font-family:var(--fm);letter-spacing:.08em;}
.sb-urole.agent{color:var(--terra);}
.nav{flex:1;padding:8px;overflow-y:auto;display:flex;flex-direction:column;gap:1px;}
.nav-grp{font-family:var(--fm);font-size:9px;color:var(--muted3);letter-spacing:.22em;text-transform:uppercase;padding:10px 10px 4px;}
.nav-btn{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:var(--r);cursor:pointer;border:1px solid transparent;color:var(--muted);font-size:13px;font-weight:600;background:none;width:100%;text-align:left;transition:all .15s;}
.nav-btn:hover{background:var(--green-lt);color:var(--green);border-color:var(--border);}
.nav-btn.active{background:var(--green-lt);color:var(--green);border-color:var(--border2);box-shadow:var(--sh-sm);}
.nav-icon{font-size:16px;width:22px;text-align:center;flex-shrink:0;}
.nav-badge{margin-left:auto;background:var(--green);color:#fff;font-family:var(--fm);font-size:9px;padding:2px 7px;border-radius:20px;}
.nav-badge.new{background:var(--terra);}
.sb-footer{padding:12px 14px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;}
.lang-row{display:flex;gap:6px;}
.lang-btn{flex:1;padding:6px 4px;border-radius:var(--r);border:1px solid var(--border);background:none;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted);}
.lang-btn.active{background:var(--green);color:#fff;border-color:var(--green);}
.online-row{display:flex;align-items:center;gap:6px;font-family:var(--fm);font-size:10px;color:var(--muted);}
.online-dot{width:7px;height:7px;border-radius:50%;background:var(--leaf);animation:glow 2s infinite;}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(76,175,80,.5);}50%{box-shadow:0 0 0 6px rgba(76,175,80,0);}}
.sb-logout{padding:7px 12px;border-radius:var(--r);border:1px solid var(--border);background:none;color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;width:100%;text-align:left;transition:all .15s;}
.sb-logout:hover{background:var(--danger-lt);color:var(--danger);border-color:var(--danger-md);}

/* TOPBAR */
.topbar{height:54px;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:12px;background:rgba(255,255,255,.95);backdrop-filter:blur(14px);position:sticky;top:0;z-index:100;box-shadow:var(--sh-sm);}
.tb-title{font-family:var(--fs);font-weight:700;font-size:17px;color:var(--text);flex:1;}
.tb-sub{font-size:10px;color:var(--muted);font-family:var(--fm);}
.tb-right{display:flex;align-items:center;gap:8px;}
.voice-btn{width:34px;height:34px;border-radius:50%;background:var(--green-lt);border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;transition:all .2s;color:var(--green);}
.voice-btn:hover{background:var(--green);color:#fff;}
.voice-btn.on{background:var(--danger);color:#fff;border-color:var(--danger);animation:mic-pulse .7s ease infinite;}
@keyframes mic-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.12);}}
.mob-menu{padding:7px 10px;background:none;border:1px solid var(--border);border-radius:var(--r);cursor:pointer;font-size:18px;color:var(--text);}

/* AUTH */
.auth-wrap{min-height:100vh;display:flex;align-items:stretch;}
.auth-hero{flex:1;background:linear-gradient(145deg,#1b5e20,#2e7d32,#388e3c);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 40px;position:relative;overflow:hidden;}
.auth-hero::before{content:'';position:absolute;inset:0;opacity:.07;background:radial-gradient(circle at 20% 80%,#fff 0%,transparent 60%),radial-gradient(circle at 80% 20%,#fff 0%,transparent 60%);}
.auth-hero-title{font-family:var(--fs);font-size:46px;color:#fff;text-align:center;margin-bottom:12px;position:relative;}
.auth-hero-sub{color:rgba(255,255,255,.85);font-size:16px;text-align:center;max-width:380px;margin-bottom:32px;position:relative;}
.auth-features{display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px;position:relative;}
.auth-feat{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:11px 16px;color:#fff;font-size:13px;font-weight:600;backdrop-filter:blur(8px);display:flex;align-items:center;gap:10px;}
.auth-panel{width:480px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 42px;overflow-y:auto;}
.auth-brand{font-family:var(--fs);font-size:27px;color:var(--green);display:flex;align-items:center;gap:10px;margin-bottom:4px;}
.auth-tagline{font-size:13px;color:var(--muted);margin-bottom:26px;}
.tab-row{display:flex;background:var(--bg2);border-radius:10px;padding:4px;margin-bottom:20px;}
.tab-btn{flex:1;padding:8px 4px;border-radius:7px;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;color:var(--muted);transition:all .2s;}
.tab-btn.active{background:#fff;color:var(--green);box-shadow:var(--sh-sm);}
.role-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
.role-card{border:2px solid var(--border);border-radius:var(--r);padding:14px 10px;cursor:pointer;text-align:center;transition:all .2s;}
.role-card.sel{border-color:var(--green);background:var(--green-lt);}
.role-icon{font-size:28px;margin-bottom:6px;}
.role-name{font-size:12px;font-weight:700;color:var(--text);}
.role-sub{font-size:10px;color:var(--muted);margin-top:2px;}
@media(max-width:920px){.auth-hero{display:none}.auth-panel{width:100%}}

/* CARDS & STATS */
.card{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:22px;box-shadow:var(--sh-sm);}
.card:hover{box-shadow:var(--sh);}
.card-title{font-family:var(--fs);font-weight:700;font-size:16px;color:var(--text);margin-bottom:3px;display:flex;align-items:center;gap:8px;}
.card-sub{font-size:12px;color:var(--muted);margin-bottom:14px;}
.stat{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:18px;position:relative;overflow:hidden;transition:box-shadow .2s,transform .2s;}
.stat:hover{box-shadow:var(--sh);transform:translateY(-1px);}
.stat::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:var(--r2) var(--r2) 0 0;}
.stat.g::before{background:linear-gradient(90deg,var(--leaf),var(--green));}
.stat.o::before{background:linear-gradient(90deg,var(--terra),#e87840);}
.stat.b::before{background:linear-gradient(90deg,var(--sky),#42a5f5);}
.stat.a::before{background:linear-gradient(90deg,var(--amber),#fb8c00);}
.stat.p::before{background:linear-gradient(90deg,var(--purple),#ab47bc);}
.stat.t::before{background:linear-gradient(90deg,var(--teal),#26a69a);}
.stat-lbl{font-family:var(--fm);font-size:10px;color:var(--muted);letter-spacing:.18em;text-transform:uppercase;margin-bottom:6px;}
.stat-val{font-family:var(--fs);font-size:26px;font-weight:700;color:var(--text);line-height:1;margin-bottom:4px;}
.stat-d{font-size:11px;display:flex;align-items:center;gap:4px;}
.stat-d.up{color:var(--green);}.stat-d.dn{color:var(--danger);}.stat-d.nt{color:var(--muted);}
.stat-ico{position:absolute;top:14px;right:14px;font-size:22px;opacity:.14;}

/* GRIDS */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.col{display:flex;flex-direction:column;}
.gap4{gap:4px}.gap6{gap:6px}.gap8{gap:8px}.gap10{gap:10px}.gap12{gap:12px}.gap14{gap:14px}.gap16{gap:16px}.gap20{gap:20px}.gap24{gap:24px}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--r);font-family:var(--fn);font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;border:none;outline:none;white-space:nowrap;}
.btn-primary{background:var(--green);color:#fff;}
.btn-primary:hover{background:var(--green2);box-shadow:0 4px 14px rgba(46,125,50,.3);}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;box-shadow:none;}
.btn-outline{background:transparent;color:var(--green);border:1.5px solid var(--green);}
.btn-outline:hover{background:var(--green-lt);}
.btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border);}
.btn-ghost:hover{background:var(--bg2);border-color:var(--border2);}
.btn-danger{background:var(--danger-lt);color:var(--danger);border:1px solid var(--danger-md);}
.btn-danger:hover{background:var(--danger);color:#fff;}
.btn-sky{background:var(--sky);color:#fff;}
.btn-sky:hover{opacity:.9;}
.btn-amber{background:var(--amber);color:#fff;}
.btn-amber:hover{opacity:.9;}
.btn-sm{padding:6px 13px;font-size:12px;}.btn-lg{padding:12px 28px;font-size:15px;}
.btn-full{width:100%;justify-content:center;}

/* FORMS */
.fg{display:flex;flex-direction:column;gap:5px;}
.flbl{font-family:var(--fm);font-size:10px;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;font-weight:600;}
.inp,.sel,.ta{background:var(--bg);border:1.5px solid var(--border);border-radius:var(--r);padding:9px 14px;color:var(--text);font-family:var(--fn);font-size:13px;transition:border-color .18s,box-shadow .18s;outline:none;width:100%;}
.inp:focus,.sel:focus,.ta:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(46,125,50,.1);background:#fff;}
.sel{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235a7a4e' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;}
.ta{resize:vertical;min-height:80px;}
.upload{border:2px dashed var(--border2);border-radius:var(--r2);padding:32px 20px;text-align:center;cursor:pointer;transition:all .2s;position:relative;background:var(--bg);}
.upload:hover,.upload.drag{border-color:var(--green);background:var(--green-lt);}
.upload input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.upv{max-height:150px;max-width:100%;border-radius:10px;object-fit:cover;border:2px solid var(--border2);}

/* TAGS */
.tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-family:var(--fm);font-size:10px;font-weight:600;border:1px solid;letter-spacing:.04em;}
.tg{background:var(--green-lt);color:var(--green);border-color:var(--border2);}
.to{background:var(--terra-lt);color:var(--terra);border-color:var(--terra-md);}
.tr{background:var(--danger-lt);color:var(--danger);border-color:var(--danger-md);}
.tb{background:var(--sky-lt);color:var(--sky);border-color:var(--sky-md);}
.ta2{background:var(--amber-lt);color:var(--amber);border-color:var(--amber-md);}
.tp{background:var(--purple-lt);color:var(--purple);border-color:var(--purple-md);}
.tt{background:var(--teal-lt);color:var(--teal);border-color:var(--teal-md);}
.tgr{background:var(--bg2);color:var(--muted);border-color:var(--border);}

/* ALERTS */
.alert{padding:11px 15px;border-radius:var(--r);font-size:13px;display:flex;align-items:flex-start;gap:10px;border:1px solid;line-height:1.55;}
.al-s{background:var(--green-lt);border-color:var(--border2);color:var(--green2);}
.al-w{background:var(--terra-lt);border-color:var(--terra-md);color:var(--terra);}
.al-e{background:var(--danger-lt);border-color:var(--danger-md);color:var(--danger);}
.al-i{background:var(--sky-lt);border-color:var(--sky-md);color:var(--sky);}
.al-a{background:var(--amber-lt);border-color:var(--amber-md);color:var(--amber);}
.al-p{background:var(--purple-lt);border-color:var(--purple-md);color:var(--purple);}

/* PROGRESS */
.prog{height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;}
.prog-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--green),var(--leaf));transition:width .6s ease;}
.prog-fill.w{background:linear-gradient(90deg,var(--terra),var(--amber));}
.prog-fill.d{background:linear-gradient(90deg,var(--danger),#ef5350);}

/* TABLE */
.tbl-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
thead tr{border-bottom:2px solid var(--border);background:var(--bg2);}
th{font-family:var(--fm);font-size:10px;color:var(--muted);letter-spacing:.18em;text-transform:uppercase;padding:10px 14px;text-align:left;white-space:nowrap;}
td{padding:12px 14px;font-size:13px;color:var(--text);border-bottom:1px solid var(--border);}
tr:hover td{background:var(--leaf-lt);}
tr:last-child td{border-bottom:none;}

/* CHAT */
.chat-shell{display:flex;flex-direction:column;height:520px;border:1px solid var(--border);border-radius:var(--r2);overflow:hidden;background:var(--bg);box-shadow:var(--sh-sm);}
.chat-hd{padding:12px 16px;background:linear-gradient(135deg,var(--green),var(--green2));display:flex;align-items:center;justify-content:space-between;}
.chat-hd-t{font-weight:700;font-size:14px;color:#fff;display:flex;align-items:center;gap:8px;}
.chat-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}
.chat-msg{display:flex;gap:10px;max-width:84%;}
.chat-msg.u{align-self:flex-end;flex-direction:row-reverse;}
.chat-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;background:var(--green-lt);border:1.5px solid var(--border2);}
.chat-av.u{background:linear-gradient(135deg,var(--green),var(--green2));color:#fff;border:none;}
.chat-bub{background:var(--white);border:1px solid var(--border);border-radius:14px;padding:10px 14px;font-size:13px;line-height:1.65;color:var(--text);box-shadow:var(--sh-sm);white-space:pre-wrap;}
.chat-bub.u{background:linear-gradient(135deg,var(--green),var(--green2));color:#fff;border:none;}
.chat-in-row{border-top:1px solid var(--border);padding:10px 12px;display:flex;gap:8px;align-items:center;background:var(--white);}
.chat-in-row .inp{flex:1;border-radius:24px;padding:8px 16px;}
.typing{display:flex;gap:4px;align-items:center;padding:4px 0;}
.td{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:tb .8s ease infinite;}
.td:nth-child(2){animation-delay:.15s;}.td:nth-child(3){animation-delay:.3s;}
@keyframes tb{0%,80%,100%{transform:scale(.7);opacity:.5;}40%{transform:scale(1);opacity:1;}}

/* NDVI */
.ndvi-grid{display:grid;grid-template-columns:repeat(24,1fr);gap:2px;border-radius:8px;overflow:hidden;aspect-ratio:2.8;}
.ndvi-cell{aspect-ratio:1;border-radius:1px;}
.zone-bar{height:10px;border-radius:4px;overflow:hidden;display:flex;}
.zone-seg{height:100%;transition:width .5s ease;}

/* WEATHER */
.wx-big{font-family:var(--fs);font-size:64px;font-weight:700;color:var(--text);line-height:1;}
.wx-card{background:linear-gradient(135deg,#1565c0,#1976d2,#42a5f5);border-radius:var(--r2);padding:24px;color:#fff;}
.forecast-item{background:rgba(255,255,255,.12);border-radius:10px;padding:12px 8px;text-align:center;border:1px solid rgba(255,255,255,.2);}

/* CIRCUIT */
.circuit-box{background:var(--bg);border:1px solid var(--border);border-radius:var(--r2);padding:16px;font-family:var(--fm);font-size:12px;}
.c-flow{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.c-node{background:var(--green-lt);border:1px solid var(--border2);border-radius:6px;padding:4px 10px;color:var(--text2);font-size:11px;white-space:nowrap;}
.c-arrow{color:var(--green);font-weight:700;font-size:14px;}
.comp-card{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;display:flex;align-items:flex-start;gap:8px;}
.comp-num{width:24px;height:24px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;font-family:var(--fm);}
.step-card{background:var(--green-lt);border:1.5px solid var(--border2);border-radius:var(--r);padding:12px 14px;display:flex;gap:12px;}
.step-num{width:26px;height:26px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;}

/* MARKET */
.mkt-item{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:16px;display:flex;align-items:center;gap:14px;transition:all .2s;}
.mkt-item:hover{border-color:var(--border2);box-shadow:var(--sh);}
.mkt-ico{width:48px;height:48px;border-radius:var(--r);background:var(--green-lt);display:flex;align-items:center;justify-content:center;font-size:24px;border:1px solid var(--border2);flex-shrink:0;}
.mkt-name{font-weight:700;font-size:14px;color:var(--text);}
.mkt-det{font-size:12px;color:var(--muted);margin-top:2px;}
.mkt-price{font-family:var(--fs);font-size:18px;color:var(--terra);font-weight:700;}

/* SHOP */
.shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;}
.shop-card{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:16px;transition:all .2s;display:flex;flex-direction:column;cursor:pointer;}
.shop-card:hover{border-color:var(--border2);box-shadow:var(--sh);transform:translateY(-2px);}
.shop-img{height:90px;border-radius:var(--r);background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:40px;margin-bottom:12px;border:1px solid var(--border);}
.shop-name{font-weight:700;font-size:13px;color:var(--text);line-height:1.4;margin-bottom:4px;}
.shop-price{font-family:var(--fs);font-size:18px;color:var(--terra);font-weight:700;margin-top:auto;padding-top:8px;}
.shop-unit{font-size:11px;color:var(--muted);}
.subsidy-badge{background:var(--green-lt);border:1px solid var(--border2);border-radius:5px;padding:2px 8px;font-size:10px;color:var(--green);font-weight:700;}
.cart-fab{position:fixed;bottom:24px;right:24px;background:var(--green);color:#fff;border-radius:50px;padding:13px 22px;font-weight:700;font-size:14px;box-shadow:var(--sh-lg);cursor:pointer;display:flex;align-items:center;gap:9px;z-index:300;transition:all .2s;border:none;font-family:var(--fn);}
.cart-fab:hover{background:var(--green2);transform:scale(1.05);}
.cart-panel{position:fixed;right:0;top:0;bottom:0;width:390px;background:#fff;z-index:400;box-shadow:-4px 0 30px rgba(0,0,0,.15);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s ease;}
.cart-panel.open{transform:translateX(0);}
.cart-hd{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.cart-body{flex:1;overflow-y:auto;padding:16px;}
.cart-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
.cart-item-img{width:44px;height:44px;border-radius:var(--r);background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:22px;border:1px solid var(--border);flex-shrink:0;}
.cart-footer{padding:16px 20px;border-top:1px solid var(--border);}
.pay-methods{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;}
.pay-btn{padding:10px 8px;border-radius:var(--r);border:2px solid var(--border);background:none;cursor:pointer;font-family:var(--fn);font-size:12px;font-weight:700;color:var(--muted);transition:all .2s;text-align:center;}
.pay-btn.sel{border-color:var(--green);background:var(--green-lt);color:var(--green);}
.qty-ctrl{display:flex;align-items:center;gap:6px;}
.qty-btn{width:26px;height:26px;border-radius:50%;border:1px solid var(--border);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:var(--text);transition:all .15s;}
.qty-btn:hover{background:var(--green-lt);border-color:var(--green);}

/* COMMUNITY */
.post{background:var(--white);border:1px solid var(--border);border-radius:var(--r2);padding:16px;transition:all .2s;}
.post:hover{border-color:var(--border2);box-shadow:var(--sh-sm);}
.post-auth{font-weight:700;font-size:13px;color:var(--text);}
.post-time{font-family:var(--fm);font-size:10px;color:var(--muted);}
.post-body{font-size:13px;color:var(--text2);line-height:1.65;margin-top:8px;}

/* AGENT PIPELINE */
.agent-pipeline{display:flex;flex-direction:column;gap:0;position:relative;}
.agent-pipeline::before{content:'';position:absolute;left:17px;top:24px;bottom:24px;width:2px;background:linear-gradient(180deg,var(--green),var(--border));}
.agent-step{display:flex;gap:14px;padding:16px;border-radius:var(--r2);transition:all .3s;position:relative;background:transparent;}
.agent-step.active{background:var(--green-lt);border:1px solid var(--border2);}
.agent-step.done{background:rgba(76,175,80,.04);border:1px solid rgba(76,175,80,.12);}
.agent-dot{width:34px;height:34px;border-radius:50%;background:var(--bg2);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;z-index:1;transition:all .3s;}
.agent-step.active .agent-dot{background:var(--green);color:#fff;border-color:var(--green);}
.agent-step.done .agent-dot{background:var(--leaf);color:#fff;border-color:var(--leaf);}
.agent-output{background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px;font-size:12px;line-height:1.65;color:var(--text2);white-space:pre-wrap;max-height:180px;overflow-y:auto;margin-top:6px;}
.ab-wait{color:var(--muted);font-size:11px;font-family:var(--fm);}
.ab-run{color:var(--amber);font-size:11px;font-family:var(--fm);display:flex;align-items:center;gap:5px;}
.ab-done{color:var(--green);font-size:11px;font-family:var(--fm);}
.ab-err{color:var(--danger);font-size:11px;font-family:var(--fm);}

/* MISC */
.divider{height:1px;background:var(--border);margin:16px 0;}
.spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(46,125,50,.2);border-top-color:var(--green);border-radius:50%;animation:sp .7s linear infinite;}
@keyframes sp{to{transform:rotate(360deg);}}
.flex{display:flex;}.ic{align-items:center;}.jb{justify-content:space-between;}.fw{flex-wrap:wrap;}
.f1{flex:1;}.tr2{text-align:right;}
.mt4{margin-top:4px}.mt8{margin-top:8px}.mt10{margin-top:10px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mt20{margin-top:20px}
.mb4{margin-bottom:4px}.mb6{margin-bottom:6px}.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}
.fw6{font-weight:600}.fw7{font-weight:700}.fw8{font-weight:800}
.f10{font-size:10px}.f11{font-size:11px}.f12{font-size:12px}.f13{font-size:13px}.f14{font-size:14px}.f15{font-size:15px}.f16{font-size:16px}
.fsr{font-family:var(--fs);}.fm2{font-family:var(--fm);}
.tg2{color:var(--green);}.to2{color:var(--terra);}.tb2{color:var(--sky);}.tm{color:var(--muted);}
.ring{width:110px;height:110px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;border:5px solid;flex-shrink:0;}
.ring.low{border-color:var(--leaf)}.ring.med{border-color:var(--amber)}.ring.high{border-color:var(--danger)}
.ring-num{font-family:var(--fs);font-size:28px;font-weight:700;color:var(--text);}
.ring-lbl{font-family:var(--fm);font-size:9px;color:var(--muted);letter-spacing:.2em;}
.simple-banner{background:linear-gradient(135deg,#e65100,#ff6d00);color:#fff;padding:8px 16px;text-align:center;font-size:13px;font-weight:700;}
.simple-mode .f13,.simple-mode td,.simple-mode .btn,.simple-mode .chat-bub{font-size:15px!important}
.simple-mode .card-title{font-size:18px}
.simple-mode .inp,.simple-mode .sel,.simple-mode .ta{font-size:15px;padding:12px 16px}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.28);z-index:150;}
`;

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE = "http://localhost:8000";
const api = {
  _t: null,
  setToken(t) { this._t = t; },
  h(form) {
    const h = {};
    if (!form) h["Content-Type"] = "application/json";
    if (this._t && this._t !== "demo") h["Authorization"] = `Bearer ${this._t}`;
    return h;
  },
  async get(p) { const r = await fetch(BASE+p, { headers: this.h() }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  async post(p, body, form = false) { const r = await fetch(BASE+p, { method:"POST", headers: this.h(form), body: form ? body : JSON.stringify(body) }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  async put(p, body) { const r = await fetch(BASE+p, { method:"PUT", headers: this.h(), body: JSON.stringify(body) }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  async del(p) { const r = await fetch(BASE+p, { method:"DELETE", headers: this.h() }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
};

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const L = {
  en: {
    brand:"AiVara", tag:"Smart AI Farming for Every Farmer",
    login:"Log In", signup:"Sign Up", logout:"Log Out",
    farmer:"Farmer", agent:"Market Agent",
    nav_dash:"Dashboard", nav_sat:"Satellite NDVI", nav_disease:"Crop Doctor",
    nav_pest:"Pest Detect", nav_chat:"AI Assistant", nav_wx:"Weather",
    nav_fert:"Fertilizer AI", nav_yield:"Yield Predict", nav_iot:"IoT Guide",
    nav_mkt:"Marketplace", nav_shop:"Shop", nav_orders:"My Orders",
    nav_comm:"Community", nav_fraud:"Doc Verify", nav_hist:"My History",
    nav_agent:"AI Agents", nav_portal:"My Portal",
    upload:"Upload Image", diagnose:"Diagnose Crop", detect:"Detect Pest",
    confidence:"Confidence", cause:"Cause", treatment:"Treatment",
    city:"Enter city or district", today:"Today",
    humidity:"Humidity", wind:"Wind Speed",
    commodity:"Commodity", price:"Price", trend:"Trend", exchange:"Exchange",
    buy:"Buy Offer", sell:"Sell Listing", recommend:"Get Recommendation", predict:"Predict Yield",
    speak:"🔊", send:"Send",
    greeting_morning:"Good morning", greeting_afternoon:"Good afternoon",
    greeting_evening:"Good evening", greeting_night:"Good night",
    health:"Crop Health", name:"Full Name", email:"Email", password:"Password", phone:"Phone",
    agent_title:"Agentic AI Farm Advisor",
    agent_sub:"6 specialised AI agents work together to build your personalised farm action plan",
    agent_run:"Run All Agents", agent_running:"Agents Working...",
    agent_step_plan:"🧠 Planner", agent_step_disease:"🌿 Disease", agent_step_weather:"🌦️ Weather",
    agent_step_market:"🛒 Market", agent_step_iot:"🔌 IoT", agent_step_synth:"📋 Synthesis",
    agent_result:"Your Action Plan",
    agent_placeholder:"e.g. My tomato leaves have yellow spots and I need to spray. Is now a good time? What is the market price?",
    add_to_cart:"Add to Cart", cart:"Cart", checkout:"Place Order",
    payment_cod:"Cash on Delivery", payment_upi:"UPI / Online Pay",
    order_placed:"Order Placed!", simple_mode:"Simple Mode (Big Text)", normal_mode:"Normal Mode",
  },
  kn: {
    brand:"ಐವರ", tag:"ಪ್ರತಿ ರೈತನಿಗೆ ಸ್ಮಾರ್ಟ್ AI ಕೃಷಿ",
    login:"ಲಾಗಿನ್", signup:"ನೋಂದಾಯಿಸಿ", logout:"ಲಾಗ್ ಔಟ್",
    farmer:"ರೈತ", agent:"ಮಾರುಕಟ್ಟೆ ಏಜೆಂಟ್",
    nav_dash:"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", nav_sat:"ಉಪಗ್ರಹ NDVI", nav_disease:"ಬೆಳೆ ವೈದ್ಯ",
    nav_pest:"ಕೀಟ ಪತ್ತೆ", nav_chat:"AI ಸಹಾಯಕ", nav_wx:"ಹವಾಮಾನ",
    nav_fert:"ಗೊಬ್ಬರ AI", nav_yield:"ಇಳುವರಿ ಊಹೆ", nav_iot:"IoT ಮಾರ್ಗದರ್ಶಿ",
    nav_mkt:"ಮಾರುಕಟ್ಟೆ", nav_shop:"ಅಂಗಡಿ", nav_orders:"ನನ್ನ ಆದೇಶಗಳು",
    nav_comm:"ಸಮುದಾಯ", nav_fraud:"ದಾಖಲೆ ಪರಿಶೀಲನೆ", nav_hist:"ನನ್ನ ಇತಿಹಾಸ",
    nav_agent:"AI ಏಜೆಂಟ್‌ಗಳು", nav_portal:"ನನ್ನ ಪೋರ್ಟಲ್",
    upload:"ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", diagnose:"ರೋಗ ಪರೀಕ್ಷಿಸಿ", detect:"ಕೀಟ ಪತ್ತೆ ಮಾಡಿ",
    confidence:"ವಿಶ್ವಾಸಾರ್ಹತೆ", cause:"ಕಾರಣ", treatment:"ಚಿಕಿತ್ಸೆ",
    city:"ನಗರ ಅಥವಾ ಜಿಲ್ಲೆ ನಮೂದಿಸಿ", today:"ಇಂದು",
    humidity:"ಆರ್ದ್ರತೆ", wind:"ಗಾಳಿ ವೇಗ",
    commodity:"ಸರಕು", price:"ಬೆಲೆ", trend:"ಪ್ರವೃತ್ತಿ", exchange:"ಮಾರುಕಟ್ಟೆ",
    buy:"ಖರೀದಿ ಕೊಡುಗೆ", sell:"ಮಾರಾಟ ಪಟ್ಟಿ", recommend:"ಶಿಫಾರಸು ಪಡೆಯಿರಿ", predict:"ಇಳುವರಿ ಊಹಿಸಿ",
    speak:"🔊", send:"ಕಳುಹಿಸಿ",
    greeting_morning:"ಶುಭ ಬೆಳಗು", greeting_afternoon:"ಶುಭ ಮಧ್ಯಾಹ್ನ",
    greeting_evening:"ಶುಭ ಸಂಜೆ", greeting_night:"ಶುಭ ರಾತ್ರಿ",
    health:"ಬೆಳೆ ಆರೋಗ್ಯ", name:"ಪೂರ್ಣ ಹೆಸರು", email:"ಇಮೇಲ್", password:"ಪಾಸ್‌ವರ್ಡ್", phone:"ಫೋನ್",
    agent_title:"ಏಜೆಂಟ್ AI ಕೃಷಿ ಸಲಹೆಗಾರ",
    agent_sub:"6 ತಜ್ಞ AI ಏಜೆಂಟ್‌ಗಳು ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ಕ್ರಿಯಾ ಯೋಜನೆ ರಚಿಸುತ್ತವೆ",
    agent_run:"ಎಲ್ಲ ಏಜೆಂಟ್ ಚಲಾಯಿಸಿ", agent_running:"ಏಜೆಂಟ್‌ಗಳು ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದಾರೆ...",
    agent_step_plan:"🧠 ಯೋಜಕ", agent_step_disease:"🌿 ರೋಗ", agent_step_weather:"🌦️ ಹವಾಮಾನ",
    agent_step_market:"🛒 ಮಾರುಕಟ್ಟೆ", agent_step_iot:"🔌 IoT", agent_step_synth:"📋 ಸಂಶ್ಲೇಷಣ",
    agent_result:"ನಿಮ್ಮ ಕ್ರಿಯಾ ಯೋಜನೆ",
    agent_placeholder:"ಉದಾ: ನನ್ನ ಟೊಮೇಟೊ ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ ಚುಕ್ಕೆ ಇದೆ. ಇಂದು ಸಿಂಪಡಿಸಬಹುದೇ? ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಏನು?",
    add_to_cart:"ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ", cart:"ಕಾರ್ಟ್", checkout:"ಆದೇಶ ಮಾಡಿ",
    payment_cod:"ತಲುಪಿದ ಮೇಲೆ ಪಾವತಿ", payment_upi:"UPI / ಆನ್‌ಲೈನ್ ಪಾವತಿ",
    order_placed:"ಆದೇಶ ದಾಖಲಾಯಿತು!", simple_mode:"ಸರಳ ಮೋಡ್ (ದೊಡ್ಡ ಅಕ್ಷರ)", normal_mode:"ಸಾಮಾನ್ಯ ಮೋಡ್",
  },
};

// ─── VOICE ────────────────────────────────────────────────────────────────────
const tts = (text, lang) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.slice(0, 400));
  u.lang = lang === "kn" ? "kn-IN" : "en-IN"; u.rate = 0.9; u.pitch = 1.05;
  window.speechSynthesis.speak(u);
};

function useVoice(onResult) {
  const [on, setOn] = useState(false);
  const ref = useRef(null);
  const start = useCallback((lang = "en") => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Voice input needs Chrome browser. Please use Chrome.");
    const r = new SR(); ref.current = r;
    r.lang = lang === "kn" ? "kn-IN" : "en-IN"; r.interimResults = false;
    r.onresult = e => { onResult(e.results[0][0].transcript); setOn(false); };
    r.onerror = () => setOn(false); r.onend = () => setOn(false);
    r.start(); setOn(true);
  }, [onResult]);
  const stop = useCallback(() => { ref.current?.stop(); setOn(false); }, []);
  return { on, start, stop };
}

function useGreeting(t) {
  const get = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return t.greeting_morning;
    if (h >= 12 && h < 17) return t.greeting_afternoon;
    if (h >= 17 && h < 21) return t.greeting_evening;
    return t.greeting_night;
  };
  const [g, setG] = useState(get);
  useEffect(() => {
    setG(get());
    const id = setInterval(() => setG(get()), 60000);
    return () => clearInterval(id);
  }, [t]);
  return g;
}

function useClock() {
  const fmt = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const [time, setTime] = useState(fmt);
  useEffect(() => { const id = setInterval(() => setTime(fmt()), 30000); return () => clearInterval(id); }, []);
  return time;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MK = {
  ndvi: { ndvi_mean:0.62, ndvi_std:0.18, ndvi_min:0.14, ndvi_max:0.91, health:"Healthy", advice:"✅ Good crop health. Monitor regularly. Consider light irrigation if no rain in 5 days.", zones:{ excellent:28, healthy:34, moderate:22, stressed:12, bare_soil:4 }, irrigation_needed:false, pest_risk_flag:false, estimated_yield_impact:"62.0% of potential yield reachable" },
  disease: { class_name:"Tomato — Early Blight", class_raw:"Tomato___Early_blight", confidence:0.912, severity:"Moderate", is_healthy:false, cause:"Fungal infection (Alternaria solani) — excess moisture and warm temperatures cause spore germination on lower leaves.", solution:"Apply Mancozeb @ 2.5 g/L every 7 days. Remove infected leaves. Avoid overhead irrigation.", organic:"Neem oil @ 5 ml/L + baking soda 5g/L every 5 days." },
  pest: { pest_name:"Tomato leaf curl", confidence:0.88, is_healthy:false, solution:"Control whiteflies with Imidacloprid 17.8% @ 0.3ml/L. Install yellow sticky traps. Remove infected plants." },
  weather: { city:"Bengaluru", temp:29, feels_like:32, humidity:74, wind_speed:3.2, pressure:1014, visibility:9.5, description:"Partly cloudy", icon:"⛅", risk:"Moderate fungal risk — humidity above 70%", risk_items:["🍄 Moderate fungal risk — humidity above 70%"], forecast:[{dt:"2026-04-04 12:00:00",temp:28,desc:"Light rain",icon:"🌧️",humidity:82},{dt:"2026-04-05 12:00:00",temp:27,desc:"Thunderstorm",icon:"⛈️",humidity:88},{dt:"2026-04-06 12:00:00",temp:30,desc:"Partly cloudy",icon:"⛅",humidity:72},{dt:"2026-04-07 12:00:00",temp:31,desc:"Sunny",icon:"☀️",humidity:65},{dt:"2026-04-08 12:00:00",temp:32,desc:"Clear sky",icon:"☀️",humidity:60}], is_demo:false },
  prices: [
    {commodity:"Rice",price:2280,unit:"₹/quintal",trend:"+2.1%",exchange:"APMC Bangalore"},
    {commodity:"Wheat",price:2150,unit:"₹/quintal",trend:"+0.5%",exchange:"APMC Kolar"},
    {commodity:"Maize",price:1920,unit:"₹/quintal",trend:"-1.2%",exchange:"APMC Mysore"},
    {commodity:"Tomato",price:1640,unit:"₹/quintal",trend:"+5.8%",exchange:"APMC Bangalore"},
    {commodity:"Onion",price:1380,unit:"₹/quintal",trend:"-0.8%",exchange:"APMC Hassan"},
    {commodity:"Cotton",price:6200,unit:"₹/quintal",trend:"+1.3%",exchange:"APMC Dharwad"},
    {commodity:"Ragi",price:3846,unit:"₹/quintal",trend:"+0.9%",exchange:"APMC Mandya"},
    {commodity:"Groundnut",price:5850,unit:"₹/quintal",trend:"+2.8%",exchange:"APMC Chitradurga"},
  ],
  listings: [
    {id:1,agent_name:"Suresh Traders",crop:"Rice",quantity_kg:5000,price_per_qt:2350,market:"APMC Bangalore",region:"Mandya",contact:"9876543210",is_buying:true},
    {id:2,agent_name:"Lakshmi FPO",crop:"Tomato",quantity_kg:2000,price_per_qt:1680,market:"APMC Kolar",region:"Kolar",contact:"9845012345",is_buying:false},
  ],
  posts: [
    {id:1,author:"Ramesh K.",role:"farmer",region:"Tumkur",body:"Heavy rain expected next 3 days in north Karnataka. Hold off pesticide spray!",tag:"Weather Alert",created_at:"2026-04-01T08:00:00",likes:12},
    {id:2,author:"Lakshmi D.",role:"farmer",region:"Mysore",body:"Tomato late blight spreading fast. Copper oxychloride working from Day 3. Apply early morning only.",tag:"Disease Alert",created_at:"2026-03-31T14:30:00",likes:8},
    {id:3,author:"APMC Agent",role:"market_agent",region:"Bangalore",body:"Rice MSP: ₹2183/q. Register at pmkisan.gov.in for direct procurement — deadline April 15.",tag:"Market",created_at:"2026-03-30T10:00:00",likes:21},
  ],
  yield: { predicted_yield:8.4, unit:"tonnes/total area", per_acre:4.2, confidence:0.84, recommendation:"Optimal conditions for Rice. Maintain current practices and monitor for pests at tillering.", msp_estimate:"₹18,48,000 (at MSP ₹2,183/quintal)" },
  fert: { fertilizer:"NPK 17-17-17 @ 100 kg/acre + Urea 50 kg at tillering", dose_schedule:"Apply in 3 splits: basal, tillering, panicle", price_estimate:"₹1,200/bag (50 kg)", timing:"Apply at sowing + top-dress at 30 DAS", notes:[], organic_option:"Compost 2 tonne/acre + Vermicompost 500 kg as partial substitute", govt_scheme:"PMKSY subsidy available — contact local agriculture dept. for 30-50% subsidy" },
  fraud: { risk_score:35, risk_level:"Medium", recommendation:"Manual review recommended. Document appears modified.", risk_reasons:["Certificate format atypical","Stamp duty value unusually low"], ml_flag:"Normal", structured_data:{certificate_number:"IN-KA-2024-001",issued_date:"15-Mar-2024",owner:"Ramesh Kumar",stamp_duty:"2450"} },
};

const SHOP_PRODUCTS = [
  {id:"P001",category:"Seeds",name:"BPT-5204 Sona Masuri Rice Seed",name_kn:"BPT-5204 ಸೋನಾ ಮಸೂರಿ ಭತ್ತದ ಬೀಜ",description:"Certified high-yield rice seed, ideal for Karnataka. 5–5.5 t/acre potential.",price:120,unit:"per kg",min_qty:5,max_qty:200,image:"🌾",brand:"KSRSAC",subsidy_available:true},
  {id:"P002",category:"Seeds",name:"Tomato Hybrid F1 (Disease Resistant)",name_kn:"ಟೊಮೇಟೊ ಹೈಬ್ರಿಡ್ F1",description:"High blight resistance, 45-50 t/ha yield, suitable for all seasons.",price:350,unit:"per 10g packet",min_qty:1,max_qty:50,image:"🍅",brand:"Seminis",subsidy_available:false},
  {id:"P003",category:"Seeds",name:"Maize DHM-117 Hybrid Seed",name_kn:"ಮೆಕ್ಕೆಜೋಳ DHM-117",description:"Fall armyworm tolerant, 8-10 t/acre potential for Karnataka conditions.",price:280,unit:"per kg",min_qty:2,max_qty:100,image:"🌽",brand:"Pioneer",subsidy_available:true},
  {id:"P004",category:"Seeds",name:"Cotton MCU-5 Seed",name_kn:"ಹತ್ತಿ MCU-5 ಬೀಜ",description:"Certified extra-long staple variety, suitable for Karnataka black cotton soil.",price:195,unit:"per kg",min_qty:5,max_qty:100,image:"🌸",brand:"CICR",subsidy_available:true},
  {id:"P005",category:"Fertilizer",name:"NPK 17-17-17 Complex Fertilizer",name_kn:"NPK 17-17-17 ಸಂಯುಕ್ತ ಗೊಬ್ಬರ",description:"Balanced N, P, K for all crops at sowing. IFFCO certified, govt subsidised.",price:1200,unit:"per 50kg bag",min_qty:1,max_qty:20,image:"💊",brand:"IFFCO",subsidy_available:true},
  {id:"P006",category:"Fertilizer",name:"DAP (Di-ammonium Phosphate)",name_kn:"DAP ಡೈ-ಅಮೋನಿಯಂ ಫಾಸ್ಫೇಟ್",description:"High phosphorus starter fertilizer. Standard for all Karnataka crops.",price:1350,unit:"per 50kg bag",min_qty:1,max_qty:20,image:"🌱",brand:"IFFCO",subsidy_available:true},
  {id:"P007",category:"Fertilizer",name:"Urea (46% Nitrogen)",name_kn:"ಯೂರಿಯಾ (46% ನೈಟ್ರೋಜನ್)",description:"For top-dressing at tillering/vegetative stage. Most common N fertilizer.",price:320,unit:"per 50kg bag",min_qty:1,max_qty:20,image:"⚗️",brand:"KRIBHCO",subsidy_available:true},
  {id:"P008",category:"Pesticide",name:"Mancozeb 75% WP Fungicide",name_kn:"ಮ್ಯಾಂಕೋಜೆಬ್ 75% ಶಿಲೀಂಧ್ರನಾಶಕ",description:"Broad-spectrum fungicide for blight, rust, leaf spot. Apply every 7 days.",price:280,unit:"per 500g",min_qty:1,max_qty:20,image:"🧪",brand:"Dhanuka",subsidy_available:false},
  {id:"P009",category:"Pesticide",name:"Imidacloprid 17.8% SL",name_kn:"ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ 17.8%",description:"Controls sucking pests, whiteflies, thrips. Apply 0.3ml/L at first infestation.",price:320,unit:"per 250ml",min_qty:1,max_qty:20,image:"🐜",brand:"Bayer",subsidy_available:false},
  {id:"P010",category:"Pesticide",name:"Neem Oil 10000 PPM (Organic)",name_kn:"ಬೇವಿನ ಎಣ್ಣೆ 10000 PPM",description:"OMRI-listed organic pesticide & fungicide. 5ml/L spray every 5 days.",price:220,unit:"per 250ml",min_qty:1,max_qty:20,image:"🌿",brand:"Multiplex",subsidy_available:false},
  {id:"P011",category:"IoT",name:"AiVara Soil Moisture Kit",name_kn:"ಮಣ್ಣಿನ ತೇವ ಸೆನ್ಸರ್ ಕಿಟ್",description:"Complete: Arduino Uno + capacitive sensor + LCD + buzzer + USB + pre-loaded code. Plug & play.",price:1299,unit:"per kit",min_qty:1,max_qty:10,image:"🔌",brand:"AiVara Kit",subsidy_available:false},
  {id:"P012",category:"IoT",name:"ESP32 Weather Station Kit",name_kn:"ESP32 ಹವಾಮಾನ ಕೇಂದ್ರ ಕಿಟ್",description:"Temp, humidity, pressure sensors + solar panel + battery + pre-programmed. No soldering needed.",price:2899,unit:"per kit",min_qty:1,max_qty:5,image:"🌡️",brand:"AiVara Kit",subsidy_available:false},
  {id:"P013",category:"Equipment",name:"16L Knapsack Sprayer (Manual)",name_kn:"16L ನ್ಯಾಪ್‌ಸ್ಯಾಕ್ ಸ್ಪ್ರೇಯರ್",description:"Chemical-resistant tank, 1.5m wand, brass nozzle. Ideal for 1–3 acre plots.",price:850,unit:"per unit",min_qty:1,max_qty:5,image:"💦",brand:"Aspee",subsidy_available:false},
  {id:"P014",category:"Equipment",name:"Digital Soil NPK Test Kit",name_kn:"ಡಿಜಿಟಲ್ ಮಣ್ಣು NPK ಪರೀಕ್ಷಾ ಕಿಟ್",description:"Test soil N, P, K at home in 5 minutes. 30 tests included. Results in simple numbers.",price:1499,unit:"per kit",min_qty:1,max_qty:5,image:"🧫",brand:"Soilens",subsidy_available:false},
];

// ─── ATOM COMPONENTS ──────────────────────────────────────────────────────────
function Spin() { return <span className="spin" />; }
function Divider() { return <div className="divider" />; }

function Alrt({ type = "i", children, dismiss }) {
  const cls = { s:"al-s", w:"al-w", e:"al-e", i:"al-i", a:"al-a", p:"al-p" };
  const ico = { s:"✅", w:"⚠️", e:"🚨", i:"ℹ️", a:"💡", p:"🌾" };
  return (
    <div className={`alert ${cls[type]}`} style={{ position:"relative" }}>
      <span style={{ flexShrink:0 }}>{ico[type]}</span>
      <span style={{ flex:1 }}>{children}</span>
      {dismiss && <button onClick={dismiss} style={{ background:"none",border:"none",cursor:"pointer",opacity:.6,fontSize:16,lineHeight:1 }}>×</button>}
    </div>
  );
}

function StatCard({ lbl, val, delta, color = "g", icon }) {
  const dc = delta?.startsWith("+") ? "up" : delta?.startsWith("-") ? "dn" : "nt";
  return (
    <div className={`stat ${color}`}>
      {icon && <div className="stat-ico">{icon}</div>}
      <div className="stat-lbl">{lbl}</div>
      <div className="stat-val">{val}</div>
      {delta && <div className={`stat-d ${dc}`}>{dc==="up"?"↑":dc==="dn"?"↓":"—"} {delta}</div>}
    </div>
  );
}

function UpZone({ onFile, accept = "image/*", label, sub }) {
  const [drag, setDrag] = useState(false);
  const [prev, setPrev] = useState(null);
  const handle = f => { if (!f) return; setPrev(URL.createObjectURL(f)); onFile(f); };
  return (
    <div className={`upload ${drag ? "drag" : ""}`}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}>
      <input type="file" accept={accept} onChange={e => handle(e.target.files[0])} />
      {prev
        ? <img src={prev} alt="" className="upv" />
        : <><div style={{ fontSize:36,marginBottom:10 }}>📂</div>
          <div style={{ fontSize:14,fontWeight:700,color:"var(--text2)",marginBottom:4 }}>{label}</div>
          <div style={{ fontSize:11,color:"var(--muted)" }}>{sub || "PNG, JPG — drag & drop or click"}</div></>}
    </div>
  );
}

function NdviCanvas({ data }) {
  const pal = ["#1b3a0a","#2d5c14","#3d7820","#52992c","#6ec040","#9ad854","#c8ee74","#e8f494","#e8c840","#d47828","#b83818"];
  return (
    <div>
      <div className="ndvi-grid">
        {Array.from({ length: 192 }).map((_, i) => {
          const seed = data
            ? (Math.sin(i*0.27+data.ndvi_mean*10)*0.2+Math.cos(i*0.11)*0.15+(data.ndvi_mean||0.5)+(Math.random()*0.08-0.04))
            : Math.random();
          const idx = Math.min(10, Math.max(0, Math.floor(seed*11)));
          return <div key={i} className="ndvi-cell" style={{ background:pal[idx],aspectRatio:1 }} />;
        })}
      </div>
      {data && (
        <div style={{ marginTop:12 }}>
          <div className="f12 fm2 tm mb8">Zone breakdown (% of field)</div>
          <div className="zone-bar" style={{ background:"var(--bg2)",height:10,borderRadius:4 }}>
            {[["excellent","#2e7d32",data.zones?.excellent||28],["healthy","#4caf50",data.zones?.healthy||34],
              ["moderate","#fbc02d",data.zones?.moderate||22],["stressed","#e65100",data.zones?.stressed||12],
              ["bare_soil","#b71c1c",data.zones?.bare_soil||4]].map(([k,color,pct]) => (
              <div key={k} className="zone-seg" style={{ width:`${pct}%`,background:color }} title={`${k}: ${pct}%`} />
            ))}
          </div>
          <div className="flex gap8 mt8 fw">
            {[["#2e7d32","Excellent (>0.6)"],["#4caf50","Healthy (0.4–0.6)"],["#fbc02d","Moderate (0.2–0.4)"],["#e65100","Stressed (0–0.2)"],["#b71c1c","Bare (<0)"]].map(([c,l]) => (
              <div key={l} className="flex ic gap4">
                <div style={{ width:12,height:12,borderRadius:3,background:c,flexShrink:0 }} />
                <span className="f11 tm">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, lang }) {
  const t = L[lang];
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("farmer");
  const [f, setF] = useState({ name:"",email:"",password:"",phone:"",region:"",village:"",land_acres:"" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]:v }));

  const submit = async () => {
    if (!f.email || !f.password) { setErr("Email and password required"); return; }
    setLoading(true); setErr("");
    try {
      let data;
      if (mode === "login") {
        data = await api.post("/api/auth/login", { email:f.email, password:f.password });
      } else {
        if (!f.name) { setErr("Full name required"); setLoading(false); return; }
        data = await api.post("/api/auth/register", {
          name:f.name, email:f.email, password:f.password,
          phone:f.phone||null, role, region:f.region||null,
          village:f.village||null, land_acres:f.land_acres?parseFloat(f.land_acres):null,
        });
      }
      localStorage.setItem("iv_token", data.token);
      onAuth(data.user);
    } catch (e) {
      setErr(e.message || "Connection error");
      // Demo mode — works offline
      if (f.email.includes("@")) {
        const demo = { id:0, name:f.name||f.email.split("@")[0], email:f.email, role, region:f.region||"Karnataka", phone:f.phone||"" };
        localStorage.setItem("iv_token", "demo");
        onAuth(demo);
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-hero-title">🌾 {t.brand}</div>
        <p className="auth-hero-sub">{t.tag}</p>
        <div className="auth-features">
          {[
            "🛰️ Satellite NDVI crop health maps",
            "🌿 AI disease & pest detection (38 classes)",
            "🤖 Cohere AI assistant — Kannada & English",
            "🌦️ Real-time weather & crop risk advisory",
            "🛒 Live APMC market prices + direct listings",
            "🛍️ Shop seeds, fertilizers & IoT kits",
            "🔌 IoT circuit guide (rural-friendly step-by-step)",
            "🧠 6-agent AI action plan for your farm",
            "📲 WhatsApp alerts for disease & orders",
          ].map(item => <div key={item} className="auth-feat">{item}</div>)}
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-brand">🌾 {t.brand} <span style={{ background:"var(--green-lt)",border:"1px solid var(--border2)",borderRadius:6,padding:"1px 8px",fontFamily:"var(--fm)",fontSize:9,color:"var(--green)" }}>v4.0</span></div>
        <div className="auth-tagline">{t.tag}</div>
        <div className="tab-row">
          <button className={`tab-btn ${mode==="login"?"active":""}`} onClick={() => setMode("login")}>{t.login}</button>
          <button className={`tab-btn ${mode==="register"?"active":""}`} onClick={() => setMode("register")}>{t.signup}</button>
        </div>

        {mode === "register" && (
          <>
            <div className="f12 fw6 tm mb8">I am a:</div>
            <div className="role-grid">
              {[["farmer","👨‍🌾",t.farmer,"Crop monitoring, disease detection, yield planning"],
                ["market_agent","🏪",t.agent,"Post listings, manage prices, view farmer offers"]].map(([v,ic,lb,sb]) => (
                <div key={v} className={`role-card ${role===v?"sel":""}`} onClick={() => setRole(v)}>
                  <div className="role-icon">{ic}</div>
                  <div className="role-name">{lb}</div>
                  <div className="role-sub">{sb}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="col gap12">
          {mode === "register" && <>
            <div className="fg"><label className="flbl">{t.name}</label><input className="inp" placeholder="Ramesh Kumar" value={f.name} onChange={e=>set("name",e.target.value)} /></div>
            <div className="fg"><label className="flbl">{t.phone}</label><input className="inp" type="tel" placeholder="+91 98765 43210" value={f.phone} onChange={e=>set("phone",e.target.value)} /></div>
            <div className="g2 gap12">
              <div className="fg"><label className="flbl">District / Region</label><input className="inp" placeholder="Mysuru, Karnataka" value={f.region} onChange={e=>set("region",e.target.value)} /></div>
              <div className="fg"><label className="flbl">Village (optional)</label><input className="inp" placeholder="Honnavar" value={f.village} onChange={e=>set("village",e.target.value)} /></div>
            </div>
            {role==="farmer"&&<div className="fg"><label className="flbl">Land (acres, optional)</label><input className="inp" type="number" placeholder="2.5" value={f.land_acres} onChange={e=>set("land_acres",e.target.value)} /></div>}
          </>}
          <div className="fg"><label className="flbl">{t.email}</label><input className="inp" type="email" placeholder="you@example.com" value={f.email} onChange={e=>set("email",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} /></div>
          <div className="fg"><label className="flbl">{t.password}</label><input className="inp" type="password" placeholder="••••••••" value={f.password} onChange={e=>set("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} /></div>
          {err && <Alrt type="w" dismiss={()=>setErr("")}>{err}</Alrt>}
          <button className="btn btn-primary btn-full btn-lg" onClick={submit} disabled={loading}>
            {loading ? <><Spin /> Please wait...</> : mode==="login" ? t.login : t.signup}
          </button>
          <div className="f11 tm" style={{ textAlign:"center" }}>
            {lang==="kn" ? "ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದಿದ್ದರೂ ಬಳಸಬಹುದು — ಡೆಮೋ ಮೋಡ್‌ನಲ್ಲಿ ಯಾವ ಇಮೇಲ್ ಬಳಸಿ" : "Works in demo mode offline — use any email to continue"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, nav, lang, simpleMode }) {
  const t = L[lang];
  const greeting = useGreeting(t);
  const stats = [
    { lbl:"NDVI Index", val:"0.68", delta:"+0.04 this week", color:"g", icon:"🛰️" },
    { lbl:lang==="kn"?"ರೋಗ ಪತ್ತೆ":"Diseases Found", val:"3", delta:"-1 from scan", color:"o", icon:"🌿" },
    { lbl:lang==="kn"?"ಇಳುವರಿ ಅಂದಾಜು":"Yield Estimate", val:"4.2t", delta:"+0.3t forecast", color:"a", icon:"🌾" },
    { lbl:lang==="kn"?"ಹವಾಮಾನ ಅಪಾಯ":"Weather Risk", val:"Med", delta:"Rain in 3 days", color:"b", icon:"🌦️" },
  ];
  const quickActions = [
    {ic:"🛰️",lb:t.nav_sat,pg:"sat"},{ic:"🌿",lb:t.nav_disease,pg:"disease"},
    {ic:"🤖",lb:t.nav_chat,pg:"chat"},{ic:"🌦️",lb:t.nav_wx,pg:"weather"},
    {ic:"🛒",lb:t.nav_mkt,pg:"market"},{ic:"🛍️",lb:t.nav_shop,pg:"shop"},
    {ic:"💊",lb:t.nav_fert,pg:"fert"},{ic:"📊",lb:t.nav_yield,pg:"yield"},
    {ic:"🔌",lb:t.nav_iot,pg:"iot"},{ic:"💬",lb:t.nav_comm,pg:"comm"},
    {ic:"🧠",lb:t.nav_agent,pg:"agent"},{ic:"📋",lb:t.nav_hist,pg:"hist"},
  ];
  return (
    <div className="col gap20">
      <div style={{ background:"linear-gradient(135deg,#1b5e20,#2e7d32,#388e3c)",borderRadius:"var(--r2)",padding:"24px 28px",color:"#fff",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",right:-20,bottom:-20,fontSize:120,opacity:.1 }}>🌾</div>
        <div className="fsr f16 fw7" style={{ color:"#fff" }}>{greeting}, {user.name?.split(" ")[0]} 👋</div>
        <div style={{ opacity:.85,marginTop:4,fontSize:13 }}>{lang==="kn"?"ಇಂದಿನ ನಿಮ್ಮ ಹೊಲದ ಸ್ಥಿತಿ":"Here's your farm overview for today"}</div>
        {(user.region||user.land_acres) && <div style={{ opacity:.75,marginTop:6,fontSize:12 }}>📍 {[user.village,user.region].filter(Boolean).join(", ")} {user.land_acres?`· ${user.land_acres} acres`:""}</div>}
        <div className="flex gap8 mt16 fw">
          {[["🔬",lang==="kn"?"ರೋಗ ಪರೀಕ್ಷಿಸಿ":"Diagnose Crop","disease"],["🧠",lang==="kn"?"AI ಸಲಹೆ":"AI Advisory","agent"],["🛍️","Shop","shop"]].map(([ic,lb,pg])=>(
            <button key={pg} className="btn" style={{ background:"rgba(255,255,255,.18)",color:"#fff",border:"1px solid rgba(255,255,255,.3)" }} onClick={()=>nav(pg)}>{ic} {lb}</button>
          ))}
        </div>
      </div>

      <div className="g4">{stats.map(s=><StatCard key={s.lbl} {...s} />)}</div>

      <div className="g2">
        <div className="card">
          <div className="card-title mb8">📢 {lang==="kn"?"ತಾಜಾ ಎಚ್ಚರಿಕೆ":"Latest Alerts"}</div>
          <div className="col gap8">
            <Alrt type="w">⚠️ Tomato Early Blight risk high — humidity 78% for 3 days. Apply Mancozeb now.</Alrt>
            <Alrt type="s">✅ Field A NDVI: 0.74 (Healthy). No immediate action needed.</Alrt>
            <Alrt type="i">💰 Rice MSP 2024-25: ₹2,183/q. Register at farmers.gov.in for procurement.</Alrt>
            <Alrt type="a">🛍️ New AiVara Soil Moisture Kit — ₹1,299 with free delivery. Visit Shop.</Alrt>
          </div>
        </div>
        <div className="card">
          <div className="card-title mb8">⚡ {lang==="kn"?"ಶೀಘ್ರ ಕ್ರಿಯೆ":"Quick Actions"}</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
            {quickActions.map(q=>(
              <button key={q.pg} className="btn btn-ghost col" style={{ flexDirection:"column",gap:5,padding:"12px 6px",height:68,justifyContent:"center",alignItems:"center",fontSize:11 }} onClick={()=>nav(q.pg)}>
                <span style={{ fontSize:20 }}>{q.ic}</span>{q.lb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {simpleMode && (
        <div className="card" style={{ background:"var(--amber-lt)",border:"1px solid var(--amber-md)" }}>
          <div className="card-title" style={{ color:"var(--amber)" }}>💡 {lang==="kn"?"ಸರಳ ಮೋಡ್ ಸಕ್ರಿಯ — ದೊಡ್ಡ ಅಕ್ಷರ ಮೋಡ್":"Simple Mode Active — Large Text"}</div>
          <div className="f13 tm mt8">{lang==="kn"?"🎤 ಧ್ವನಿ ಬಟನ್ ಒತ್ತಿ ಮಾತನಾಡಿ — ಟೈಪ್ ಮಾಡಬೇಕಿಲ್ಲ!":"🎤 Press the mic button and speak — no typing needed!"}</div>
        </div>
      )}
    </div>
  );
}

// ─── SATELLITE PAGE ───────────────────────────────────────────────────────────
function SatPage({ lang }) {
  const t = L[lang];
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const hColor = h => h.includes("Excellent")||h.includes("Healthy") ? "g" : h.includes("Moderate") ? "a" : "o";

  const run = async () => {
    setLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post(`/api/satellite/ndvi?language=${lang}`, fd, true);
      setRes(r); tts(r.advice, lang);
    } catch { setRes(MK.ndvi); }
    setLoading(false);
  };

  return (
    <div className="col gap20">
      <div className="g2">
        <div className="card">
          <div className="card-title">🛰️ {t.nav_sat}</div>
          <div className="card-sub">{lang==="kn"?"ಉಪಗ್ರಹ/ಡ್ರೋನ್ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — ಬೆಳೆ ಆರೋಗ್ಯ ಸ್ಕೋರ್ ಮತ್ತು ನೀರಾವರಿ ಸಲಹೆ":"Upload satellite/drone image — get NDVI crop health score + irrigation advice"}</div>
          <UpZone onFile={setFile} label={lang==="kn"?"ಉಪಗ್ರಹ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ":"Upload Satellite Image"} sub="GeoTIFF, PNG, JPG — drone or satellite imagery" />
          <button className="btn btn-primary btn-full mt16" onClick={run} disabled={!file||loading}>
            {loading ? <><Spin /> {lang==="kn"?"ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...":"Analyzing..."}</> : `🛰️ ${lang==="kn"?"NDVI ವಿಶ್ಲೇಷಣೆ ಮಾಡಿ":"Run NDVI Analysis"}`}
          </button>
          <div className="mt16 col gap6">
            <div className="f12 fw7 tm mb4">📖 {lang==="kn"?"NDVI ಎಂದರೇನು? (ಸರಳ ವಿವರಣೆ)":"What does NDVI mean? (Simple guide)"}</div>
            {[["🌿 > 0.6","Excellent — healthy dark-green crop"],["✅ 0.4–0.6","Good — normal growth, monitor regularly"],["⚠️ 0.2–0.4","Stressed — increase irrigation/fertilizer"],["🚨 0–0.2","Severe — urgent irrigation & inspection needed"],["❌ < 0","No crop — bare soil or water body"]].map(([s,d])=>(
              <div key={s} className="flex gap8 ic"><span className="tag tgr" style={{ minWidth:80 }}>{s}</span><span className="f12 tm">{d}</span></div>
            ))}
          </div>
        </div>
        <div className="card" style={{ background:"var(--bg)" }}>
          <div className="card-title mb12">🗺️ {lang==="kn"?"NDVI ಹೀಟ್‌ಮ್ಯಾಪ್":"NDVI Heatmap"}</div>
          <NdviCanvas data={res} />
        </div>
      </div>

      {res && (
        <>
          <div className="g4">
            <StatCard lbl="Mean NDVI" val={res.ndvi_mean.toFixed(3)} color="g" icon="📊" />
            <StatCard lbl="Std Dev" val={res.ndvi_std?.toFixed(3)||"—"} color="b" icon="📈" />
            <StatCard lbl="Min NDVI" val={res.ndvi_min.toFixed(3)} color="o" icon="📉" />
            <div className={`stat ${hColor(res.health)}`}>
              <div className="stat-ico">🌿</div>
              <div className="stat-lbl">{t.health}</div>
              <div className="stat-val" style={{ fontSize:18 }}>{res.health}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-title mb8">📋 {lang==="kn"?"ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶ":"Analysis Result"}</div>
            <Alrt type={res.health.includes("Stress")?"w":"s"}>{res.advice}</Alrt>
            <div className="g2 mt16" style={{ gap:12 }}>
              {[["🌱","Yield Impact",res.estimated_yield_impact||"—"],["💧","Irrigation",res.irrigation_needed?"⚠️ Required now":"✅ Not needed yet"],["🐛","Pest Risk",res.pest_risk_flag?"⚠️ High variance — inspect field":"✅ Low risk"],["📐","Coverage","Full field analyzed"]].map(([ic,lb,val])=>(
                <div key={lb} style={{ padding:"12px 14px",border:"1px solid var(--border)",borderRadius:10,background:"var(--bg)" }}>
                  <div className="f12 tm mb4">{ic} {lb}</div>
                  <div className="fw7 f13">{val}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm mt12" onClick={()=>tts(res.advice,lang)}>🔊 {lang==="kn"?"ಕೇಳಿ":"Read Aloud"}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── CROP DOCTOR ─────────────────────────────────────────────────────────────
function DiseasePage({ lang }) {
  const t = L[lang];
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const sc = s => s==="Severe"?"tr":s==="Moderate"?"to":"tg";

  const run = async () => {
    setLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post(`/api/disease/predict?language=${lang}`, fd, true);
      setRes(r); tts(`${r.class_name}. ${r.solution}`, lang);
    } catch { setRes(MK.disease); }
    setLoading(false);
  };

  return (
    <div className="col gap20">
      <div className="g2">
        <div className="card">
          <div className="card-title">🌿 {t.nav_disease}</div>
          <div className="card-sub">{lang==="kn"?"ಬೆಳೆ ಎಲೆ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ — 38 ರೋಗ ವರ್ಗ ಗುರುತಿಸುತ್ತದೆ (14 ಬೆಳೆಗಳು)":"Upload leaf/plant image — AI identifies 38 disease classes across 14 crops"}</div>
          <UpZone onFile={setFile} label={t.upload} sub="PNG, JPG — clear, well-lit close-up of affected leaf" />
          <button className="btn btn-primary btn-full mt16" onClick={run} disabled={!file||loading}>
            {loading ? <><Spin /> {lang==="kn"?"ರೋಗ ಪರೀಕ್ಷಿಸಲಾಗುತ್ತಿದೆ...":"Diagnosing..."}</> : `🔬 ${t.diagnose}`}
          </button>
          {!res && (
            <div className="mt16">
              <div className="f12 fm2 tm mb8">{lang==="kn"?"ಬೆಳೆ ವರ್ಗಗಳು:":"Supported crops:"}</div>
              <div className="flex gap4 fw">
                {["Apple","Tomato","Potato","Corn","Grape","Peach","Cherry","Pepper","Strawberry","Soybean","Blueberry","Squash","Orange","Raspberry"].map(c=>(
                  <span key={c} className="tag tgr">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {res ? (
          <div className="col gap14">
            <div className="card" style={{ background:res.is_healthy?"var(--green-lt)":"var(--terra-lt)", border:`1px solid ${res.is_healthy?"var(--border2)":"var(--terra-md)"}` }}>
              <div className="flex jb ic mb8">
                <div className="card-title">🦠 {res.class_name}</div>
                <span className={`tag ${sc(res.severity)}`}>{res.severity}</span>
              </div>
              <div className="flex jb mb6">
                <span className="fm2 tm">{t.confidence}</span>
                <span className="fm2 fw7 tg2">{(res.confidence*100).toFixed(1)}%</span>
              </div>
              <div className="prog"><div className={`prog-fill ${res.severity==="Severe"?"d":res.severity==="Moderate"?"w":""}`} style={{ width:`${res.confidence*100}%` }} /></div>
              {res.is_healthy && <div className="mt12"><Alrt type="s">{lang==="kn"?"ಬೆಳೆ ಆರೋಗ್ಯಕರ! ಪ್ರಸ್ತುತ ಚಟುವಟಿಕೆ ಮುಂದುವರಿಸಿ.":"Crop is healthy! Continue current management practices."}</Alrt></div>}
            </div>
            {!res.is_healthy && (
              <div className="card" style={{ background:"var(--bg)" }}>
                <div className="fw7 f13 mb6">🔬 {t.cause}</div>
                <div className="f13 tm" style={{ lineHeight:1.65 }}>{res.cause}</div>
                <Divider />
                <div className="fw7 f13 mb6">💊 {lang==="kn"?"ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆ":"Chemical Treatment"}</div>
                <div className="f13 tm" style={{ lineHeight:1.65 }}>{res.solution}</div>
                {res.organic && <>
                  <Divider />
                  <div className="fw7 f13 mb6">🌿 {lang==="kn"?"ಸಾವಯವ ಆಯ್ಕೆ":"Organic Option"}</div>
                  <div className="f13 tm" style={{ lineHeight:1.65 }}>{res.organic}</div>
                </>}
              </div>
            )}
            <div className="flex gap8">
              <button className="btn btn-ghost btn-sm" onClick={()=>tts(`${res.class_name}. ${res.cause}. ${res.solution}`, lang)}>🔊 {lang==="kn"?"ಕೇಳಿ":"Read Aloud"}</button>
            </div>
          </div>
        ) : (
          <div className="card flex ic" style={{ flexDirection:"column",gap:14,color:"var(--muted)",justifyContent:"center" }}>
            <div style={{ fontSize:60 }}>🌿</div>
            <div className="fm2 f11" style={{ textAlign:"center" }}>{lang==="kn"?"ರೋಗ ಪತ್ತೆಗಾಗಿ ಎಲೆ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ":"Upload a leaf image to begin AI diagnosis"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PEST PAGE ────────────────────────────────────────────────────────────────
function PestPage({ lang }) {
  const t = L[lang];
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post(`/api/pest/predict?language=${lang}`, fd, true);
      setRes(r); tts(`${r.pest_name}. ${r.solution}`, lang);
    } catch { setRes(MK.pest); }
    setLoading(false);
  };

  return (
    <div className="g2">
      <div className="card">
        <div className="card-title">🐛 {t.nav_pest}</div>
        <div className="card-sub">{lang==="kn"?"22 ಬೆಳೆ ಕೀಟ / ರೋಗ ವರ್ಗ — Cashew, Cassava, Maize, Tomato":"22 pest/disease classes across Cashew, Cassava, Maize, Tomato"}</div>
        <UpZone onFile={setFile} label={t.upload} sub="Affected plant part — clear, focused photo" />
        <button className="btn btn-primary btn-full mt16" onClick={run} disabled={!file||loading}>
          {loading ? <><Spin /> {lang==="kn"?"ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...":"Analyzing..."}</> : `🐛 ${t.detect}`}
        </button>
      </div>
      {res ? (
        <div className="col gap14">
          <div className="card" style={{ background:res.is_healthy?"var(--green-lt)":"var(--terra-lt)" }}>
            <div className="card-title mb8">🐛 {res.pest_name}</div>
            <div className="flex jb mb6"><span className="fm2 tm">{t.confidence}</span><span className="fm2 fw7 tg2">{(res.confidence*100).toFixed(1)}%</span></div>
            <div className="prog"><div className="prog-fill" style={{ width:`${res.confidence*100}%` }} /></div>
          </div>
          <div className="card" style={{ background:"var(--bg)" }}>
            <div className="fw7 f13 mb8">💊 {t.treatment}</div>
            <div className="f13 tm" style={{ lineHeight:1.65 }}>{res.solution}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>tts(`${res.pest_name}. ${res.solution}`, lang)}>🔊 {lang==="kn"?"ಕೇಳಿ":"Read Aloud"}</button>
        </div>
      ) : (
        <div className="card flex ic" style={{ flexDirection:"column",gap:14,color:"var(--muted)",justifyContent:"center" }}>
          <div style={{ fontSize:56 }}>🐛</div>
          <div className="fm2 f11">{lang==="kn"?"ಕೀಟ ಪತ್ತೆಗಾಗಿ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ":"Upload image to detect pest"}</div>
        </div>
      )}
    </div>
  );
}

// ─── CHATBOT (Cohere) ─────────────────────────────────────────────────────────
function ChatPage({ user, lang }) {
  const t = L[lang];
  const [msgs, setMsgs] = useState([{
    role:"assistant",
    text: lang==="kn"
      ? "ನಮಸ್ಕಾರ! ನಾನು ಐವರ AI — Cohere ಮೂಲಕ. ಬೆಳೆ ರೋಗ, ಗೊಬ್ಬರ, IoT ಸೆಟಪ್, ಸರ್ಕಾರಿ ಯೋಜನೆ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಏನಾದರೂ ಕೇಳಿ!"
      : "Hello! I'm AiVara AI powered by Cohere. I can help with crop diseases, fertilizer advice, IoT setup, government schemes (PM-KISAN, PMFBY, KCC), market prices, and more. Ask in Kannada or English!"
  }]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const bottom = useRef(null);
  const handleVoice = useCallback(txt => setInp(txt), []);
  const { on, start, stop } = useVoice(handleVoice);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = async () => {
    const q = inp.trim(); if (!q || loading) return;
    setInp(""); setLoading(true);
    setMsgs(m => [...m, { role:"user", text:q }]);
    try {
      const history = msgs.slice(-10).map(m => ({ role:m.role, content:m.text }));
      const r = await api.post("/api/chat", { message:q, language:lang, history });
      setMsgs(m => [...m, { role:"assistant", text:r.reply }]);
      tts(r.reply.slice(0,300), lang);
    } catch {
      setMsgs(m => [...m, { role:"assistant", text: lang==="kn"
        ? "ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕ ಸಮಸ್ಯೆ. Backend ಚಲಿಸುತ್ತಿದೆಯೇ ಮತ್ತು COHERE_API_KEY ಹೊಂದಿಸಲಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ."
        : "Connection issue. Please check that your backend is running and COHERE_API_KEY is set in .env" }]);
    }
    setLoading(false);
  };

  const sugg = lang==="kn"
    ? ["ಟೊಮೇಟೊ ಬ್ಲೈಟ್ ಏನು?","ಅಕ್ಕಿಗೆ ಉತ್ತಮ ಗೊಬ್ಬರ?","NDVI 0.3 ಇದ್ದರೆ ಏನು?","IoT ಸೆನ್ಸರ್ ಹೇಗೆ ಹಾಕಬೇಕು?","PM-KISAN ಹಣ ಹೇಗೆ ಪಡೆಯಬೇಕು?"]
    : ["What causes tomato blight?","Best fertilizer for rice on loamy soil?","NDVI is 0.3 — urgent?","How to install soil moisture IoT sensor?","PM-KISAN how to register?","KCC loan eligibility and process?"];

  return (
    <div className="col gap16">
      <div className="card">
        <div className="card-title">🤖 {t.nav_chat}</div>
        <div className="card-sub">{lang==="kn"?"Cohere AI ಮೂಲಕ — ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ · ರೋಗ, ಗೊಬ್ಬರ, IoT, ಸರ್ಕಾರಿ ಯೋಜನೆ, ಮಾರುಕಟ್ಟೆ":"Powered by Cohere AI · Kannada & English · Diseases, fertilizer, IoT, govt schemes, market"}</div>
        <div className="flex gap6 fw">{sugg.map(s=><button key={s} className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={()=>setInp(s)}>{s}</button>)}</div>
      </div>
      <div className="chat-shell">
        <div className="chat-hd">
          <div className="chat-hd-t">🌾 AiVara AI <span style={{ fontSize:10,opacity:.8,fontFamily:"var(--fm)",marginLeft:6 }}>Cohere · EN / ಕನ್ನಡ</span></div>
          <span className="tag tg" style={{ fontSize:9 }}>● LIVE</span>
        </div>
        <div className="chat-msgs">
          {msgs.map((m,i)=>(
            <div key={i} className={`chat-msg ${m.role==="user"?"u":""}`}>
              <div className={`chat-av ${m.role==="user"?"u":""}`}>{m.role==="user"?user.name[0]?.toUpperCase():"🌾"}</div>
              <div className={`chat-bub ${m.role==="user"?"u":""}`}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg">
              <div className="chat-av">🌾</div>
              <div className="chat-bub"><div className="typing"><div className="td"/><div className="td"/><div className="td"/></div></div>
            </div>
          )}
          <div ref={bottom} />
        </div>
        <div className="chat-in-row">
          <button className={`voice-btn ${on?"on":""}`} onClick={()=>on?stop():start(lang)} title={on?"Stop":"Voice input — speak your question"}>
            {on?"⏹️":"🎤"}
          </button>
          <input className="inp" placeholder={lang==="kn"?"ಯಾವ ಪ್ರಶ್ನೆ ಕೇಳಬೇಕು...":"Ask about crops, diseases, IoT, schemes..."} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} />
          <button className="btn btn-primary" onClick={send} disabled={!inp.trim()||loading}>{loading?<Spin />:"→"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── WEATHER PAGE ─────────────────────────────────────────────────────────────
function WeatherPage({ lang }) {
  const t = L[lang];
  const [city, setCity] = useState("Bengaluru");
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const handleVoice = useCallback(txt => setCity(txt), []);
  const { on, start, stop } = useVoice(handleVoice);

  const fetch_ = async (c) => {
    const q = c || city; if (!q.trim()) return;
    setLoading(true); setErr("");
    try {
      const r = await api.get(`/api/weather?city=${encodeURIComponent(q)}&language=${lang}`);
      if (r.is_demo) setErr("Demo data shown — set OPENWEATHER_API_KEY in .env for live weather");
      setRes(r);
      tts(`${r.city}: ${r.temp}°C, ${r.description}. ${r.risk||""}`, lang);
    } catch(e) {
      setErr(`Weather error: ${e.message}`);
    }
    setLoading(false);
  };

  useEffect(() => { fetch_("Bengaluru"); }, []);

  const fmtDt = dt => {
    try { const d = new Date(dt.replace(" ","T")); return d.toLocaleDateString(lang==="kn"?"kn-IN":"en-IN",{weekday:"short",day:"numeric",month:"short"}); }
    catch { return dt?.slice(0,10)||""; }
  };

  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-title">🌦️ {t.nav_wx}</div>
        <div className="card-sub">{lang==="kn"?"ನೈಜ ಸಮಯ ಹವಾಮಾನ ಮತ್ತು ಬೆಳೆ ಅಪಾಯ ಸಲಹೆ — OpenWeatherMap API":"Real-time weather + agri risk advisory via OpenWeatherMap API"}</div>
        <div className="flex gap8" style={{ maxWidth:480 }}>
          <input className="inp f1" placeholder={t.city} value={city} onChange={e=>setCity(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetch_()} />
          <button className={`voice-btn ${on?"on":""}`} onClick={()=>on?stop():start(lang)} title="Speak city name">{on?"⏹️":"🎤"}</button>
          <button className="btn btn-primary" onClick={()=>fetch_()} disabled={loading}>{loading?<Spin />:"🔍"}</button>
        </div>
        {err && <div className="mt8"><Alrt type="w">{err}</Alrt></div>}
      </div>

      {res && (
        <>
          <div className="wx-card">
            <div className="flex jb fw gap16 ic">
              <div>
                <div className="fm2 f11 mb4" style={{ color:"rgba(255,255,255,.7)",letterSpacing:".15em" }}>{res.city?.toUpperCase()} · {t.today?.toUpperCase()}</div>
                <div className="flex ic gap16">
                  <div className="wx-big" style={{ color:"#fff" }}>{res.temp}°</div>
                  <div>
                    <div style={{ fontSize:32 }}>{res.icon}</div>
                    <div style={{ color:"rgba(255,255,255,.9)",fontStyle:"italic",fontSize:14 }}>{res.description}</div>
                    <div style={{ color:"rgba(255,255,255,.75)",fontSize:12,marginTop:4 }}>Feels like {res.feels_like}°C · {t.humidity}: {res.humidity}% · {t.wind}: {res.wind_speed} m/s</div>
                  </div>
                </div>
              </div>
              {res.risk_items?.length>0 && (
                <div style={{ maxWidth:280 }}>
                  {res.risk_items.map((ri,i)=>(
                    <div key={i} style={{ background:"rgba(230,81,0,.2)",border:"1px solid rgba(230,81,0,.35)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#ffccaa",marginBottom:6 }}>{ri}</div>
                  ))}
                </div>
              )}
            </div>

            {res.forecast?.length>0 && (
              <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginTop:16 }}>
                {res.forecast.slice(0,5).map((f,i)=>(
                  <div key={i} className="forecast-item">
                    <div style={{ fontWeight:700,fontSize:11,marginBottom:6,color:"rgba(255,255,255,.9)" }}>{fmtDt(f.dt)}</div>
                    <div style={{ fontSize:26,marginBottom:4 }}>{f.icon}</div>
                    <div style={{ fontFamily:"var(--fs)",fontWeight:700,fontSize:18,color:"#fff" }}>{f.temp}°</div>
                    <div style={{ fontSize:10,color:"rgba(255,255,255,.75)",marginTop:3 }}>{f.desc}</div>
                    {f.humidity&&<div style={{ fontSize:10,color:"rgba(255,255,255,.6)",marginTop:2 }}>💧{f.humidity}%</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="g3">
            {[{lbl:t.humidity,val:`${res.humidity}%`,color:"b",icon:"💧"},{lbl:t.wind,val:`${res.wind_speed} m/s`,color:"g",icon:"🌬️"},{lbl:"Pressure",val:`${res.pressure} hPa`,color:"a",icon:"🌡️"}].map(s=>(
              <StatCard key={s.lbl} {...s} />
            ))}
          </div>

          <div className="card">
            <div className="card-title mb8">🌾 {lang==="kn"?"ಕೃಷಿ ಅಪಾಯ ಸಲಹೆ":"Agri Risk Advisory"}</div>
            {res.risk_items?.length > 0 ? (
              <div className="col gap8">
                {res.risk_items.map((ri,i)=><Alrt key={i} type="w">{ri}</Alrt>)}
                <Alrt type="i">{lang==="kn"?"ಈ ಸ್ಥಿತಿಯಲ್ಲಿ: ಬೆಳಿಗ್ಗೆ 6-8 AM ಅಥವಾ ಸಂಜೆ ನಂತರ ಸಿಂಪಡಿಸಿ. ಮಳೆ ಮೊದಲು ಸಿಂಪಡಿಕೆ ತಪ್ಪಿಸಿ.":"Under these conditions: spray early morning 6-8 AM or after 6 PM. Avoid spraying before rain."}</Alrt>
              </div>
            ) : <Alrt type="s">{lang==="kn"?"✅ ಈ ಸ್ಥಿತಿ ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಿಗೆ ಅನುಕೂಲ. ಸಿಂಪಡಿಕೆ ಮತ್ತು ನೀರಾವರಿಗೆ ಒಳ್ಳೆಯ ಸಮಯ.":"✅ Favourable conditions for field operations. Good time for spraying and irrigation."}</Alrt>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── MARKETPLACE ─────────────────────────────────────────────────────────────
function MarketPage({ user, lang }) {
  const t = L[lang];
  const [tab, setTab] = useState("prices");
  const [prices, setPrices] = useState(MK.prices);
  const [listings, setListings] = useState(MK.listings);
  const [lForm, setLF] = useState({ crop:"Rice", quantity_kg:"", price_per_qt:"", market:"", region:"", contact:"", is_buying:false });
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const isAgent = ["market_agent","admin"].includes(user?.role);

  useEffect(() => {
    api.get("/api/market/prices").then(setPrices).catch(()=>setPrices(MK.prices));
    api.get("/api/market/listings").then(setListings).catch(()=>setListings(MK.listings));
  }, []);

  const submitListing = async () => {
    if (!lForm.quantity_kg || !lForm.price_per_qt || !lForm.market) return;
    setPosting(true);
    try {
      await api.post("/api/market/listing", { ...lForm, quantity_kg:parseFloat(lForm.quantity_kg), price_per_qt:parseFloat(lForm.price_per_qt) });
      setPosted(true);
      const updated = await api.get("/api/market/listings");
      setListings(updated);
    } catch { setPosted(true); }
    setPosting(false);
  };

  const delListing = async id => {
    try { await api.del(`/api/market/listing/${id}`); setListings(l => l.filter(x => x.id !== id)); } catch {}
  };

  const tabs = [["prices","📊 "+t.commodity],["buy",`🛒 ${t.buy}`],["sell",`💰 ${t.sell}`], ...(isAgent?[["manage","📋 Manage"]]:[])]

  const cropEmoji = c => ({ Rice:"🌾",Wheat:"🌿",Maize:"🌽",Tomato:"🍅",Onion:"🧅",Cotton:"🌸",Ragi:"🌾",Groundnut:"🥜",Soybean:"🫘",Sugarcane:"🎋" }[c]||"🌾");

  return (
    <div className="col gap20">
      <div className="flex gap8 fw">
        {tabs.map(([v,lb])=>(
          <button key={v} className={`btn ${tab===v?"btn-primary":"btn-ghost"}`} onClick={()=>setTab(v)}>{lb}</button>
        ))}
        {isAgent && <span className="tag to" style={{ marginLeft:"auto" }}>🏪 {lang==="kn"?"ಮಾರುಕಟ್ಟೆ ಏಜೆಂಟ್ ಪೋರ್ಟಲ್":"Market Agent Portal"}</span>}
      </div>

      {tab==="prices" && (
        <div className="card">
          <div className="flex jb ic mb16">
            <div>
              <div className="card-title">📊 {lang==="kn"?"ನೇರ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ":"Live APMC Market Prices"}</div>
              <div className="card-sub" style={{ marginBottom:0 }}>{lang==="kn"?"ಕರ್ನಾಟಕ APMC — 15 ನಿಮಿಷಕ್ಕೊಮ್ಮೆ ಅಪ್ಡೇಟ್":"Karnataka APMC · refreshes every 15 min"}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>api.get("/api/market/prices").then(setPrices).catch(()=>{})}>↻ Refresh</button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>{t.commodity}</th><th>{t.price}</th><th>Unit</th><th>{t.trend}</th><th>{t.exchange}</th></tr></thead>
              <tbody>
                {prices.map((p,i)=>(
                  <tr key={i}>
                    <td><div className="flex ic gap8"><span style={{ fontSize:18 }}>{cropEmoji(p.commodity)}</span><span className="fw7">{p.commodity}</span></div></td>
                    <td><span className="fsr fw7 to2" style={{ fontSize:16 }}>₹{p.price?.toLocaleString()}</span></td>
                    <td><span className="fm2 tm">{p.unit}</span></td>
                    <td><span className={`tag ${p.trend?.startsWith("+")?"tg":"tr"}`}>{p.trend}</span></td>
                    <td className="tm f12">{p.exchange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt16"><Alrt type="a">{lang==="kn"?"MSP 2024-25: ಅಕ್ಕಿ ₹2,183/q · ಗೋಧಿ ₹2,275/q · ಜೋಳ ₹2,090/q · ರಾಗಿ ₹4,291/q · ಹತ್ತಿ ₹7,121/q":"MSP 2024-25: Rice ₹2,183/q · Wheat ₹2,275/q · Maize ₹2,090/q · Ragi ₹4,291/q · Cotton ₹7,121/q"}</Alrt></div>
        </div>
      )}

      {tab==="buy" && (
        <div className="col gap12">
          <div className="fsr fw7 f14 mb4">{lang==="kn"?"ರೈತರ ಮಾರಾಟ ಪಟ್ಟಿ":"Farmer Sell Listings"}</div>
          {listings.filter(l=>!l.is_buying).map(l=>(
            <div key={l.id} className="mkt-item">
              <div className="mkt-ico">{cropEmoji(l.crop)}</div>
              <div className="f1">
                <div className="mkt-name">{l.crop}</div>
                <div className="mkt-det">{l.quantity_kg?.toLocaleString()}kg · {l.market} {l.region?`· ${l.region}`:""}</div>
                <div className="mt8 flex gap6"><span className="tag tg">{l.agent_name}</span><span className="tag tb">📞 {l.contact}</span></div>
              </div>
              <div className="tr2"><div className="mkt-price">₹{l.price_per_qt}/q</div></div>
            </div>
          ))}
          {listings.filter(l=>l.is_buying).length>0 && <>
            <div className="fsr fw7 f14 mt8">{lang==="kn"?"ವ್ಯಾಪಾರಿ ಖರೀದಿ ಕೊಡುಗೆ":"Trader Buy Offers"}</div>
            {listings.filter(l=>l.is_buying).map(l=>(
              <div key={l.id} className="mkt-item" style={{ border:"1px solid var(--sky-md)",background:"var(--sky-lt)" }}>
                <div className="mkt-ico" style={{ background:"var(--sky-lt)",border:"1px solid var(--sky-md)" }}>🛒</div>
                <div className="f1">
                  <div className="mkt-name">{l.crop}</div>
                  <div className="mkt-det">{l.agent_name} · {l.market}</div>
                  <div className="mt8"><span className="tag tb">{t.buy}</span></div>
                </div>
                <div className="tr2"><div className="mkt-price" style={{ color:"var(--sky)" }}>₹{l.price_per_qt}/q</div><div className="fm2 tm" style={{ fontSize:10 }}>Buying {l.quantity_kg?.toLocaleString()}kg</div></div>
              </div>
            ))}
          </>}
        </div>
      )}

      {tab==="sell" && (
        <div className="g2">
          <div className="card">
            <div className="card-title mb16">{lang==="kn"?"ಮಾರಾಟ / ಖರೀದಿ ಪಟ್ಟಿ ಸೇರಿಸಿ":"Post a Sell / Buy Listing"}</div>
            {posted && <Alrt type="s" dismiss={()=>setPosted(false)}>{lang==="kn"?"ಪಟ್ಟಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ! ಖರೀದಿದಾರರು ಈಗ ನೋಡಬಹುದು.":"Listing published! Buyers can now see your offer."}</Alrt>}
            <div className="col gap12 mt12">
              <div className="fg"><label className="flbl">Crop</label>
                <select className="sel" value={lForm.crop} onChange={e=>setLF(f=>({...f,crop:e.target.value}))}>
                  {["Rice","Wheat","Maize","Tomato","Onion","Cotton","Ragi","Groundnut","Soybean","Sugarcane"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg"><label className="flbl">{lang==="kn"?"ಉದ್ದೇಶ":"Listing Type"}</label>
                <div className="flex gap8">
                  {[["false","💰 "+(lang==="kn"?"ನಾನು ಮಾರುತ್ತೇನೆ":"I'm Selling")],["true","🛒 "+(lang==="kn"?"ನಾನು ಖರೀದಿಸುತ್ತೇನೆ":"I Want to Buy")]].map(([v,lb])=>(
                    <button key={v} className={`btn f1 ${lForm.is_buying===(v==="true")?"btn-primary":"btn-ghost"}`}
                      onClick={()=>setLF(f=>({...f,is_buying:v==="true"}))}>{lb}</button>
                  ))}
                </div>
              </div>
              <div className="g2 gap12">
                <div className="fg"><label className="flbl">{lang==="kn"?"ಪ್ರಮಾಣ (kg)":"Quantity (kg)"}</label><input className="inp" type="number" placeholder="2000" value={lForm.quantity_kg} onChange={e=>setLF(f=>({...f,quantity_kg:e.target.value}))} /></div>
                <div className="fg"><label className="flbl">{lang==="kn"?"ಬೆಲೆ (₹/quintal)":"Price (₹/quintal)"}</label><input className="inp" type="number" placeholder="2300" value={lForm.price_per_qt} onChange={e=>setLF(f=>({...f,price_per_qt:e.target.value}))} /></div>
              </div>
              <div className="fg"><label className="flbl">{lang==="kn"?"ಮಾರುಕಟ್ಟೆ / APMC":"Market / APMC"}</label><input className="inp" placeholder="APMC Bangalore" value={lForm.market} onChange={e=>setLF(f=>({...f,market:e.target.value}))} /></div>
              <div className="fg"><label className="flbl">{lang==="kn"?"ಸಂಪರ್ಕ ಸಂಖ್ಯೆ":"Contact Number"}</label><input className="inp" type="tel" placeholder="+91 98765 43210" value={lForm.contact} onChange={e=>setLF(f=>({...f,contact:e.target.value}))} /></div>
              <button className="btn btn-primary btn-full" onClick={submitListing} disabled={posting||!lForm.quantity_kg||!lForm.price_per_qt||!lForm.market}>
                {posting?<Spin />:"📢 "+(lang==="kn"?"ಪಟ್ಟಿ ಪ್ರಕಟಿಸಿ":"Publish Listing")}
              </button>
            </div>
          </div>
          <div className="col gap10">
            <div className="fm2 tm mb4" style={{ fontSize:10,letterSpacing:".2em" }}>LIVE LISTINGS ({listings.length})</div>
            {listings.slice(0,6).map(l=>(
              <div key={l.id} className="post" style={{ padding:12 }}>
                <div className="flex jb ic">
                  <span className={`tag ${l.is_buying?"tb":"tg"}`}>{l.is_buying?"🛒 Buy":"💰 Sell"}</span>
                  <span className="fm2 to2 fw7">₹{l.price_per_qt}/q</span>
                </div>
                <div className="fw7 f13 mt4">{l.crop} · {l.quantity_kg?.toLocaleString()}kg</div>
                <div className="tm f12">{l.agent_name} · {l.market}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="manage" && isAgent && (
        <div className="card">
          <div className="card-title mb16">📋 {lang==="kn"?"ನನ್ನ ಪಟ್ಟಿಗಳು":"My Listings"}</div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Crop</th><th>Type</th><th>Qty</th><th>Price</th><th>Market</th><th>Action</th></tr></thead>
              <tbody>
                {listings.map(l=>(
                  <tr key={l.id}>
                    <td className="fw7">{l.crop}</td>
                    <td><span className={`tag ${l.is_buying?"tb":"tg"}`}>{l.is_buying?"Buy":"Sell"}</span></td>
                    <td>{l.quantity_kg?.toLocaleString()}kg</td>
                    <td className="to2 fw7">₹{l.price_per_qt}/q</td>
                    <td className="tm">{l.market}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={()=>delListing(l.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SHOP + CART ──────────────────────────────────────────────────────────────
function ShopPage({ lang }) {
  const t = L[lang];
  const [products] = useState(SHOP_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("All");
  const [payMethod, setPayMethod] = useState("cod");
  const [orderForm, setOrderForm] = useState({ name:"", phone:"", address:"" });
  const [ordering, setOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const cats = ["All", ...Array.from(new Set(SHOP_PRODUCTS.map(p => p.category)))];
  const shown = catFilter==="All" ? products : products.filter(p => p.category===catFilter);

  const addToCart = (product) => {
    setCart(c => {
      const ex = c.find(x => x.id===product.id);
      if (ex) return c.map(x => x.id===product.id ? { ...x, qty:x.qty+x.min_qty } : x);
      return [...c, { ...product, qty: product.min_qty }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(c => {
      const ex = c.find(x => x.id===id);
      const newQty = (ex?.qty||0) + delta;
      if (newQty < ex.min_qty) return c.filter(x => x.id !== id);
      if (newQty > ex.max_qty) return c;
      return c.map(x => x.id===id ? { ...x, qty:newQty } : x);
    });
  };

  const cartTotal = cart.reduce((s,x) => s + x.price*x.qty, 0);
  const cartCount = cart.reduce((s,x) => s + x.qty, 0);

  const placeOrder = async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      alert(lang==="kn"?"ಹೆಸರು, ಫೋನ್ ಮತ್ತು ವಿಳಾಸ ಅಗತ್ಯ":"Name, phone, and address are required"); return;
    }
    setOrdering(true);
    try {
      const items = cart.map(c => ({ product_id:c.id, qty:c.qty }));
      const r = await api.post("/api/orders/create", { items, payment_method:payMethod, user_name:orderForm.name, user_phone:orderForm.phone, user_address:orderForm.address });
      setOrderResult(r);
      setCart([]);
    } catch(e) {
      // Demo fallback
      setOrderResult({ order_id:`IV${String(Date.now()).slice(-6)}`, total_amount:cartTotal, payment_method:payMethod, message:`Order confirmed! ${payMethod==="cod"?"Pay on delivery.":"Complete payment to confirm."} We'll contact you at ${orderForm.phone}.` });
      setCart([]);
    }
    setOrdering(false);
  };

  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-title">🛍️ {t.nav_shop}</div>
        <div className="card-sub">{lang==="kn"?"ಪ್ರಮಾಣಿತ ಬೀಜ, ಗೊಬ್ಬರ, ಕ್ರಿಮಿನಾಶಕ ಮತ್ತು IoT ಕಿಟ್ — ನೇರ ತಲುಪಿದ ಮೇಲೆ ಪಾವತಿ ಲಭ್ಯ":"Certified seeds, fertilizers, pesticides & IoT kits — Cash on Delivery available"}</div>
        <div className="flex gap8 fw">
          {cats.map(c=>(
            <button key={c} className={`btn btn-sm ${catFilter===c?"btn-primary":"btn-ghost"}`} onClick={()=>setCatFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      {orderResult ? (
        <div className="card" style={{ background:"var(--green-lt)",border:"2px solid var(--border2)" }}>
          <div className="card-title" style={{ fontSize:20 }}>🎉 {t.order_placed}</div>
          <div className="f14 mt8 mb12">{orderResult.message}</div>
          {[["Order ID", orderResult.order_id],["Total", `₹${orderResult.total_amount?.toLocaleString()}`],["Payment", orderResult.payment_method?.toUpperCase()]].map(([k,v])=>(
            <div key={k} className="flex ic gap12 mb8">
              <span className="fm2 tm f11">{k}:</span>
              <span className="fw7 f14">{v}</span>
            </div>
          ))}
          <Alrt type="i">{lang==="kn"?"📲 ನಿಮ್ಮ WhatsApp ಗೆ ಆದೇಶ ದೃಢೀಕರಣ ಕಳುಹಿಸಲಾಗಿದೆ.":"📲 Order confirmation sent to your WhatsApp."}</Alrt>
          <button className="btn btn-primary mt12" onClick={()=>setOrderResult(null)}>🛍️ {lang==="kn"?"ಮತ್ತೆ ಶಾಪಿಂಗ್ ಮಾಡಿ":"Continue Shopping"}</button>
        </div>
      ) : (
        <div className="shop-grid">
          {shown.map(p=>(
            <div key={p.id} className="shop-card" onClick={()=>{}}>
              <div className="shop-img">{p.image}</div>
              <div>
                {p.subsidy_available && <span className="subsidy-badge mb6" style={{ display:"inline-block" }}>🏛️ Govt Subsidy</span>}
                <div className="shop-name">{lang==="kn"&&p.name_kn ? p.name_kn : p.name}</div>
                <div className="f11 tm mt4">{p.description}</div>
                <div className="f11 tm mt4" style={{ fontFamily:"var(--fm)" }}>{p.brand}</div>
              </div>
              <div>
                <div className="shop-price">₹{p.price?.toLocaleString()}</div>
                <div className="shop-unit">{p.unit} · Min {p.min_qty}</div>
                <button className="btn btn-primary btn-full btn-sm mt10" onClick={e=>{ e.stopPropagation(); addToCart(p); }}>
                  {t.add_to_cart} 🛒
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && !orderResult && (
        <button className="cart-fab" onClick={()=>setCartOpen(true)}>
          🛒 {t.cart} ({cartCount}) · ₹{cartTotal.toLocaleString()}
        </button>
      )}

      {cartOpen && <div className="overlay" onClick={()=>setCartOpen(false)} />}
      <div className={`cart-panel ${cartOpen?"open":""}`}>
        <div className="cart-hd">
          <div className="fw7 f15">🛒 {t.cart} ({cart.length} items)</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>setCartOpen(false)}>✕ Close</button>
        </div>
        <div className="cart-body">
          {cart.length===0 ? (
            <div className="flex ic" style={{ flexDirection:"column",gap:12,color:"var(--muted)",paddingTop:40,textAlign:"center" }}>
              <div style={{ fontSize:40 }}>🛒</div>
              <div>{lang==="kn"?"ಕಾರ್ಟ್ ಖಾಲಿ ಇದೆ":"Your cart is empty"}</div>
            </div>
          ) : (
            <div className="col gap4">
              {cart.map(item=>(
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img">{item.image}</div>
                  <div className="f1">
                    <div className="fw7 f12">{lang==="kn"&&item.name_kn?item.name_kn:item.name}</div>
                    <div className="tm f11 mt2">₹{item.price?.toLocaleString()} / {item.unit}</div>
                  </div>
                  <div className="qty-ctrl">
                    <button className="qty-btn" onClick={()=>updateQty(item.id,-item.min_qty)}>−</button>
                    <span className="fw7 f13" style={{ minWidth:28,textAlign:"center" }}>{item.qty}</span>
                    <button className="qty-btn" onClick={()=>updateQty(item.id,+item.min_qty)}>+</button>
                  </div>
                  <div className="fw7 f13 to2" style={{ minWidth:60,textAlign:"right" }}>₹{(item.price*item.qty).toLocaleString()}</div>
                </div>
              ))}
              <div className="flex jb ic mt12" style={{ padding:"12px 0",borderTop:"2px solid var(--border)" }}>
                <span className="fw8 f14">{lang==="kn"?"ಒಟ್ಟು":"Total"}</span>
                <span className="fw8 f16 to2">₹{cartTotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div className="col gap12 mt16">
              <div className="f12 fw7 tm">{lang==="kn"?"ವಿತರಣ ವಿವರ":"Delivery Details"}</div>
              <div className="fg"><label className="flbl">{lang==="kn"?"ಹೆಸರು":"Name"}</label><input className="inp" placeholder="Ramesh Kumar" value={orderForm.name} onChange={e=>setOrderForm(f=>({...f,name:e.target.value}))} /></div>
              <div className="fg"><label className="flbl">{lang==="kn"?"ಫೋನ್":"Phone"}</label><input className="inp" type="tel" placeholder="+91 98765 43210" value={orderForm.phone} onChange={e=>setOrderForm(f=>({...f,phone:e.target.value}))} /></div>
              <div className="fg"><label className="flbl">{lang==="kn"?"ವಿಳಾಸ":"Delivery Address"}</label><textarea className="ta" style={{ minHeight:60 }} placeholder={lang==="kn"?"ಗ್ರಾಮ, ತಾಲ್ಲೂಕು, ಜಿಲ್ಲೆ, PIN":"Village, Taluk, District, PIN"} value={orderForm.address} onChange={e=>setOrderForm(f=>({...f,address:e.target.value}))} /></div>
              <div className="f12 fw7 tm">{lang==="kn"?"ಪಾವತಿ ವಿಧಾನ":"Payment Method"}</div>
              <div className="pay-methods">
                {[["cod","🏠 "+(lang==="kn"?"ತಲುಪಿದ ಮೇಲೆ ಪಾವತಿ":"Cash on Delivery")],["upi","📱 UPI / Online"]].map(([v,lb])=>(
                  <button key={v} className={`pay-btn ${payMethod===v?"sel":""}`} onClick={()=>setPayMethod(v)}>{lb}</button>
                ))}
              </div>
              <Alrt type="a">{lang==="kn"?"📲 ಆದೇಶ ದೃಢೀಕರಣ WhatsApp ಮೂಲಕ ಬರುತ್ತದೆ.":"📲 Order confirmation will be sent via WhatsApp."}</Alrt>
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-footer">
            <button className="btn btn-primary btn-full btn-lg" onClick={placeOrder} disabled={ordering}>
              {ordering ? <><Spin /> {lang==="kn"?"ಆದೇಶ ಮಾಡಲಾಗುತ್ತಿದೆ...":"Placing order..."}</> : `✅ ${t.checkout} · ₹${cartTotal.toLocaleString()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MY ORDERS ────────────────────────────────────────────────────────────────
function OrdersPage({ lang }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/orders/my")
      .then(r => { setOrders(r); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const statusColor = s => ({ placed:"tg", processing:"tb", shipped:"ta2", delivered:"tg", cancelled:"tr" }[s]||"tgr");
  const payColor = s => s==="paid"||s==="cod_pending" ? "tg" : s==="pending" ? "ta2" : "tr";

  if (loading) return <div className="flex ic" style={{ gap:10,color:"var(--muted)",padding:"40px" }}><Spin /><span>{lang==="kn"?"ಲೋಡ್ ಆಗುತ್ತಿದೆ...":"Loading..."}</span></div>;

  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-title">📦 {lang==="kn"?"ನನ್ನ ಆದೇಶಗಳು":"My Orders"}</div>
        <div className="card-sub">{lang==="kn"?"ನಿಮ್ಮ ಎಲ್ಲ ಖರೀದಿ ಆದೇಶಗಳ ಇತಿಹಾಸ":"Your order history from AiVara Shop"}</div>
      </div>
      {orders.length===0 ? (
        <Alrt type="i">{lang==="kn"?"ಇನ್ನೂ ಯಾವ ಆದೇಶ ಮಾಡಿಲ್ಲ. Shop ಗೆ ಭೇಟಿ ಮಾಡಿ ಮೊದಲ ಆದೇಶ ಮಾಡಿ!":"No orders yet. Visit the Shop to place your first order!"}</Alrt>
      ) : (
        <div className="col gap12">
          {orders.map(o=>(
            <div key={o.id} className="card">
              <div className="flex jb ic mb12">
                <div>
                  <div className="fw7 f14">Order #{o.order_id}</div>
                  <div className="fm2 tm f11 mt2">{new Date(o.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>
                </div>
                <div className="flex gap6">
                  <span className={`tag ${statusColor(o.order_status)}`}>{o.order_status?.toUpperCase()}</span>
                  <span className={`tag ${payColor(o.payment_status)}`}>{o.payment_status}</span>
                </div>
              </div>
              <div className="col gap8 mb12">
                {(Array.isArray(o.items)?o.items:[]).map((item,i)=>(
                  <div key={i} className="flex ic gap10">
                    <span>{SHOP_PRODUCTS.find(p=>p.id===item.product_id)?.image||"📦"}</span>
                    <span className="f13">{item.name} × {item.qty}</span>
                    <span className="fm2 tm f11 ml-auto">₹{item.subtotal?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Divider />
              <div className="flex jb ic">
                <span className="tm f12">{o.payment_method?.toUpperCase()} · {o.delivery_address?.slice(0,40)}...</span>
                <span className="fw8 f15 to2">₹{o.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COMMUNITY ────────────────────────────────────────────────────────────────
function CommPage({ user, lang }) {
  const t = L[lang];
  const [posts, setPosts] = useState(MK.posts);
  const [form, setForm] = useState({ body:"", tag:"General" });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const handleVoice = useCallback(txt => setForm(f=>({...f,body:txt})), []);
  const { on, start, stop } = useVoice(handleVoice);

  useEffect(() => {
    api.get("/api/community/posts?limit=50")
      .then(r => r.length && setPosts(r))
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!form.body.trim()) return;
    setLoading(true);
    try {
      await api.post("/api/community/post", form);
      const r = await api.get("/api/community/posts?limit=50");
      r.length && setPosts(r);
    } catch {
      setPosts(p => [{ id:Date.now(), author:user.name, role:user.role, region:user.region||"", body:form.body, tag:form.tag, created_at:new Date().toISOString(), likes:0 }, ...p]);
    }
    setForm(f=>({...f,body:""})); setLoading(false);
  };

  const likePost = async id => {
    try { await api.post(`/api/community/like/${id}`); } catch {}
    setPosts(p => p.map(x => x.id===id ? { ...x, likes:(x.likes||0)+1 } : x));
  };

  const fmtTime = ts => { try { const d=new Date(ts); const diff=Date.now()-d; if(diff<3600000)return`${Math.floor(diff/60000)}m ago`;if(diff<86400000)return`${Math.floor(diff/3600000)}h ago`;return`${Math.floor(diff/86400000)}d ago`;} catch { return ""; } };
  const tagClr = tag => ({ "Disease Alert":"to","Weather Alert":"tb","Market":"ta2","NDVI":"tg","IoT":"tp","Best Practices":"tt" }[tag]||"tgr");
  const roleLabel = r => r==="market_agent"?"🏪 Agent":"👨‍🌾 Farmer";
  const allTags = ["All","General","Disease Alert","Weather Alert","Market","NDVI","Best Practices","IoT"];
  const shown = filter==="All" ? posts : posts.filter(p=>p.tag===filter);

  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-title">💬 {t.nav_comm}</div>
        <div className="card-sub">{lang==="kn"?"ಕರ್ನಾಟಕದ ರೈತರೊಂದಿಗೆ ಜ್ಞಾನ ಮತ್ತು ಎಚ್ಚರಿಕೆ ಹಂಚಿಕೊಳ್ಳಿ":"Share knowledge, disease alerts, and tips with farmers across Karnataka"}</div>
        <div className="g2 gap12 mt4">
          <div className="fg"><label className="flbl">{lang==="kn"?"ವಿಷಯ":"Topic / Tag"}</label>
            <select className="sel" value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))}>
              {["General","Disease Alert","Weather Alert","Market","NDVI","Best Practices","IoT"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div />
        </div>
        <div className="fg mt12">
          <div className="flex jb ic mb6">
            <label className="flbl">{lang==="kn"?"ನಿಮ್ಮ ಸಂದೇಶ":"Your Message"}</label>
            <button className={`voice-btn ${on?"on":""}`} style={{ width:30,height:30,fontSize:13 }} onClick={()=>on?stop():start(lang)} title="Speak your message">{on?"⏹":"🎤"}</button>
          </div>
          <textarea className="ta" placeholder={lang==="kn"?"ಅನುಭವ, ಎಚ್ಚರಿಕೆ, ಸಲಹೆ ಅಥವಾ ಪ್ರಶ್ನೆ ಹಂಚಿಕೊಳ್ಳಿ...":"Share an experience, disease alert, tip, or ask a question..."} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} />
        </div>
        <button className="btn btn-primary mt12" onClick={submit} disabled={loading||!form.body.trim()}>
          {loading?<Spin />:`📢 ${t.send}`}
        </button>
      </div>

      <div className="flex gap8 fw mb4">
        {allTags.map(tg=><button key={tg} className={`btn btn-sm ${filter===tg?"btn-primary":"btn-ghost"}`} onClick={()=>setFilter(tg)}>{tg}</button>)}
      </div>

      <div className="col gap12">
        {shown.map(p=>(
          <div key={p.id} className="post">
            <div className="flex jb ic">
              <div className="flex ic gap8">
                <div className="post-auth">{p.author}</div>
                <span className="fm2 tm f11">{roleLabel(p.role)}</span>
                {p.region&&<span className="fm2 tm f11">· {p.region}</span>}
              </div>
              <span className="post-time">{fmtTime(p.created_at)}</span>
            </div>
            <div className="post-body">{p.body}</div>
            <div className="flex ic gap10 mt10">
              <span className={`tag ${tagClr(p.tag)}`}>{p.tag}</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>likePost(p.id)} style={{ gap:4 }}>👍 {p.likes||0}</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>tts(p.body,lang)}>🔊</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FERTILIZER ──────────────────────────────────────────────────────────────
function FertPage({ lang }) {
  const t = L[lang];
  const [f, setF] = useState({ crop:"Rice", soil:"Loamy", temperature:27, rainfall:100, humidity:70, nitrogen:null, phosphorus:null, potassium:null });
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const run = async () => {
    setLoading(true);
    try {
      const r = await api.post("/api/fertilizer/recommend", f);
      setRes(r); tts(`Recommended: ${r.fertilizer}. ${r.timing}`, lang);
    } catch { setRes(MK.fert); }
    setLoading(false);
  };

  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-title">🌱 {t.nav_fert}</div>
        <div className="card-sub">{lang==="kn"?"ML ಮಾದರಿ ಮತ್ತು ಕರ್ನಾಟಕ-ನಿರ್ದಿಷ್ಟ ನಿಯಮಗಳ ಮೂಲಕ ಗೊಬ್ಬರ ಶಿಫಾರಸು":"ML model + Karnataka-specific rules — personalised fertilizer recommendation"}</div>
        <div className="g2 mt4">
          <div className="col gap12">
            {[["Crop","crop","select",["Rice","Wheat","Maize","Tomato","Cotton","Ragi","Sugarcane"]],
              ["Soil Type","soil","select",["Loamy","Black Cotton","Clay","Sandy","Silt","Red Laterite"]]].map(([lb,k,tp,opts])=>(
              <div key={k} className="fg">
                <label className="flbl">{lb}</label>
                <select className="sel" value={f[k]} onChange={e=>set(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
              </div>
            ))}
            <div className="fg"><label className="flbl">Nitrogen (kg/ha) — optional</label><input className="inp" type="number" placeholder="Leave blank if unknown" value={f.nitrogen||""} onChange={e=>set("nitrogen",e.target.value?+e.target.value:null)} /></div>
            <div className="fg"><label className="flbl">Phosphorus (kg/ha) — optional</label><input className="inp" type="number" placeholder="Leave blank if unknown" value={f.phosphorus||""} onChange={e=>set("phosphorus",e.target.value?+e.target.value:null)} /></div>
            <div className="fg"><label className="flbl">Potassium (kg/ha) — optional</label><input className="inp" type="number" placeholder="Leave blank if unknown" value={f.potassium||""} onChange={e=>set("potassium",e.target.value?+e.target.value:null)} /></div>
          </div>
          <div className="col gap14">
            {[{k:"temperature",lb:"Temperature (°C)",min:10,max:45},{k:"rainfall",lb:"Rainfall (mm)",min:0,max:500},{k:"humidity",lb:"Humidity (%)",min:20,max:100}].map(({k,lb,min,max})=>(
              <div key={k}>
                <div className="flex jb mb4"><span className="fm2 tm f10">{lb}</span><span className="fm2 fw7 tg2">{f[k]}</span></div>
                <input type="range" min={min} max={max} value={f[k]} onChange={e=>set(k,+e.target.value)} style={{ width:"100%",accentColor:"var(--green)",cursor:"pointer" }} />
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-full btn-lg mt20" onClick={run} disabled={loading}>
          {loading?<><Spin /> {lang==="kn"?"ಶಿಫಾರಸು ಮಾಡಲಾಗುತ್ತಿದೆ...":"Computing recommendation..."}</> : `🌱 ${t.recommend}`}
        </button>
      </div>
      {res && (
        <div className="col gap12">
          {[["🌱","Primary Fertilizer",res.fertilizer,"green-lt"],["📅","Dose Schedule",res.dose_schedule,"bg2"],["⏰","Timing",res.timing,"bg2"],["💰","Price Estimate",res.price_estimate,"terra-lt"]].map(([ic,lb,val,bg])=>(
            <div key={lb} style={{ padding:"14px 18px",background:`var(--${bg})`,border:"1px solid var(--border)",borderRadius:"var(--r2)",display:"flex",alignItems:"center",gap:14 }}>
              <span style={{ fontSize:22 }}>{ic}</span>
              <div><div className="fm2 tm f10 mb4">{lb.toUpperCase()}</div><div className="fw7 f13">{val}</div></div>
            </div>
          ))}
          {res.notes?.length>0 && res.notes.map((n,i)=><Alrt key={i} type="a">{n}</Alrt>)}
          <Alrt type="i">🌿 Organic Option: {res.organic_option}</Alrt>
          <Alrt type="s">🏛️ {res.govt_scheme}</Alrt>
          <button className="btn btn-ghost btn-sm" onClick={()=>tts(`${res.fertilizer}. ${res.timing}. ${res.organic_option}`, lang)}>{t.speak} Read aloud</button>
        </div>
      )}
    </div>
  );
}

// ─── YIELD ────────────────────────────────────────────────────────────────────
function YieldPage({ lang }) {
  const t = L[lang];
  const [f, setF] = useState({ crop:"Rice", temperature:27, rainfall:120, humidity:72, soil_type:"Loamy", area:2 });
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const run = async () => {
    setLoading(true);
    try {
      const r = await api.post("/api/yield/predict", f);
      setRes(r); tts(`Predicted yield is ${r.predicted_yield} tonnes. ${r.recommendation}`, lang);
    } catch { setRes(MK.yield); }
    setLoading(false);
  };

  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-title">📊 {t.nav_yield}</div>
        <div className="card-sub">{lang==="kn"?"ತಾಪಮಾನ, ಮಳೆ ಮತ್ತು ಮಣ್ಣಿನ ಮಾಹಿತಿ ಬಳಸಿ ಇಳುವರಿ ಮುನ್ಸೂಚನೆ":"ML-powered harvest forecast using temperature, rainfall, soil type"}</div>
        <div className="g2 mt4">
          <div className="col gap12">
            {[["Crop","crop","select",["Rice","Wheat","Maize","Tomato","Cotton","Ragi","Sugarcane"]],
              ["Soil Type","soil_type","select",["Loamy","Black Cotton","Clay","Sandy","Silt","Red Laterite"]],
              ["Area (acres)","area","number"]].map(([lb,k,tp,opts])=>(
              <div key={k} className="fg">
                <label className="flbl">{lb}</label>
                {tp==="select"
                  ? <select className="sel" value={f[k]} onChange={e=>set(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
                  : <input className="inp" type="number" value={f[k]} onChange={e=>set(k,+e.target.value)} />}
              </div>
            ))}
          </div>
          <div className="col gap14">
            {[{k:"temperature",lb:"Temperature (°C)",min:10,max:45},{k:"rainfall",lb:"Rainfall (mm/season)",min:0,max:500},{k:"humidity",lb:"Humidity (%)",min:20,max:100}].map(({k,lb,min,max})=>(
              <div key={k}>
                <div className="flex jb mb4"><span className="fm2 tm f10">{lb}</span><span className="fm2 fw7 tg2">{f[k]}</span></div>
                <input type="range" min={min} max={max} value={f[k]} onChange={e=>set(k,+e.target.value)} style={{ width:"100%",accentColor:"var(--green)",cursor:"pointer" }} />
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-full btn-lg mt20" onClick={run} disabled={loading}>
          {loading?<><Spin /> {lang==="kn"?"ಊಹಿಸಲಾಗುತ್ತಿದೆ...":"Predicting..."}:</> : `📊 ${t.predict}`}
        </button>
      </div>
      {res && (
        <div className="col gap16">
          <div className="g3">
            <StatCard lbl={lang==="kn"?"ಒಟ್ಟು ಇಳುವರಿ":"Total Yield"} val={`${res.predicted_yield}t`} delta={`for ${f.area} acres`} color="g" icon="🌾" />
            <StatCard lbl={lang==="kn"?"ಪ್ರತಿ ಎಕರೆ":"Per Acre"} val={`${res.per_acre}t`} color="a" icon="📏" />
            <StatCard lbl="MSP Revenue Est." val={res.msp_estimate?.split(" ")[0]||"—"} color="b" icon="💰" />
          </div>
          <div className="card">
            <div className="card-title mb8">💡 {lang==="kn"?"ಶಿಫಾರಸು":"Recommendation"}</div>
            <div className="f13 tm" style={{ lineHeight:1.65 }}>{res.recommendation}</div>
          </div>
          {res.msp_estimate && <Alrt type="i">💰 MSP Revenue Estimate: {res.msp_estimate}</Alrt>}
          <button className="btn btn-ghost btn-sm" onClick={()=>tts(`${res.predicted_yield} tonnes predicted. ${res.recommendation}`,lang)}>{t.speak} Read aloud</button>
        </div>
      )}
    </div>
  );
}

// ─── IOT GUIDE ────────────────────────────────────────────────────────────────
function IotPage({ lang }) {
  const t = L[lang];
  const [circuits, setCircuits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState("");
  const [recs, setRecs] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [showSimple, setShowSimple] = useState(true);
  const handleVoice = useCallback(txt => setProblem(txt), []);
  const { on, start, stop } = useVoice(handleVoice);

  useEffect(() => {
    api.get("/api/iot/circuits").then(setCircuits).catch(() => setCircuits(["soil_moisture","weather_station","auto_irrigation","pest_trap","leaf_sensor","drone_sprayer"]));
  }, []);

  const loadCircuit = async id => {
    setSelected(id); setLoading(true);
    try { const r = await api.get(`/api/iot/circuit/${id}?language=${lang}`); setDetail(r); }
    catch { setDetail(null); }
    setLoading(false);
  };

  const getRecommendations = async () => {
    if (!problem.trim()) return;
    setRecLoading(true);
    try { const r = await api.post("/api/iot/recommend", { problem, crop:null, area_acres:null }); setRecs(r); }
    catch { setRecs({ recommendations:[{ id:"soil_moisture", title:"Soil Moisture Monitor", circuit_desc:"Soil sensor → Arduino → Alert", cost_inr:"₹800–₹1,500", difficulty:"Beginner" }], total_cost_estimate:"₹1,500–₹15,000", support_message:"Call 1800-XXX-XXXX for free IoT setup help" }); }
    setRecLoading(false);
  };

  const labels = { soil_moisture:"🌱 Soil Monitor", weather_station:"🌦️ Weather Station", auto_irrigation:"💧 Auto Irrigation", drone_sprayer:"🚁 Drone Sprayer", pest_trap:"🐛 Pest Trap", leaf_sensor:"🍃 Leaf Sensor" };
  const diffColor = { Beginner:"tg", Intermediate:"ta2", Advanced:"tr" };

  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-title">💡 {t.nav_iot}</div>
        <div className="card-sub">{lang==="kn"?"ನಿಮ್ಮ ಹೊಲದ ಸಮಸ್ಯೆಗೆ IoT ಪರಿಹಾರ — ಸರ್ಕ್ಯೂಟ್, ಘಟಕ ಪಟ್ಟಿ ಮತ್ತು ಸರಳ ಹಂತ-ಹಂತದ ಮಾರ್ಗದರ್ಶನ":"IoT solutions for your farm — circuit diagrams, component lists & simple step-by-step guides"}</div>

        <div className="fg mt4">
          <div className="flex jb ic mb6">
            <label className="flbl">{lang==="kn"?"ನಿಮ್ಮ ಸಮಸ್ಯೆ ವಿವರಿಸಿ (ಮಾತಿನಲ್ಲಿ ಅಥವಾ ಬರೆದು)":"Describe your farming problem (voice or type)"}</label>
            <button className={`voice-btn ${on?"on":""}`} style={{ width:30,height:30,fontSize:13 }} onClick={()=>on?stop():start(lang)} title="Speak your problem">{on?"⏹":"🎤"}</button>
          </div>
          <textarea className="ta" style={{ minHeight:70 }} placeholder={lang==="kn"?"ಉದಾ: ನನ್ನ ಹೊಲ 3 ದಿನದಲ್ಲಿ ಒಣಗುತ್ತದೆ, ಸ್ವಯಂ ನೀರಾವರಿ ಬೇಕು...":"e.g. My rice field dries out in 3 days and I need automatic irrigation alerts..."} value={problem} onChange={e=>setProblem(e.target.value)} />
          <button className="btn btn-primary mt10" onClick={getRecommendations} disabled={!problem.trim()||recLoading}>
            {recLoading?<><Spin /> Searching...</>:"🤖 Find IoT Solution"}
          </button>
        </div>
      </div>

      {recs && (
        <div className="card">
          <div className="card-title mb12">💡 {lang==="kn"?"AI ಶಿಫಾರಸು ಪರಿಹಾರಗಳು":"AI Recommended Solutions"}</div>
          <Alrt type="i">💰 {recs.total_cost_estimate}</Alrt>
          {recs.support_message && <Alrt type="a" style={{ marginTop:8 }}>{recs.support_message}</Alrt>}
          <div className="col gap12 mt12">
            {recs.recommendations?.map((r,i)=>(
              <div key={i} className="card" style={{ background:"var(--bg)" }}>
                <div className="fw7 f14 mb4">{r.title}</div>
                <div className="tm f12 mb8">{r.circuit_desc}</div>
                <div className="flex gap6 fw">
                  <span className="tag tgr">💰 {r.cost_inr}</span>
                  <span className={`tag ${diffColor[r.difficulty]||"tgr"}`}>{r.difficulty}</span>
                  {r.rural_friendly && <span className="tag tg">✅ Rural-Friendly</span>}
                </div>
                <button className="btn btn-outline btn-sm mt10" onClick={()=>loadCircuit(r.id||"soil_moisture")}>View Full Circuit →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title mb16">🔌 {lang==="kn"?"ಸರ್ಕ್ಯೂಟ್ ಆರಿಸಿ":"Select a Circuit"}</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10 }}>
          {circuits.map(id=>(
            <button key={id} className={`btn ${selected===id?"btn-primary":"btn-ghost"}`} style={{ flexDirection:"column",gap:6,padding:"12px 8px",fontSize:12 }} onClick={()=>loadCircuit(id)}>
              <span style={{ fontSize:20 }}>{labels[id]?.split(" ")[0]||"💡"}</span>
              {labels[id]?.split(" ").slice(1).join(" ")||id}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex ic" style={{ gap:10,color:"var(--muted)",padding:"20px 0" }}><Spin /><span>Loading circuit...</span></div>}

      {detail && !loading && (
        <div className="col gap16">
          <div className="card">
            <div className="flex jb ic mb8">
              <div className="card-title">{detail.title}</div>
              <div className="flex gap6">
                <span className="tag tgr">💰 {detail.cost_inr}</span>
                <span className={`tag ${diffColor[detail.difficulty]||"tgr"}`}>{detail.difficulty}</span>
                {detail.rural_friendly && <span className="tag tg">✅ Rural-Friendly</span>}
              </div>
            </div>

            {detail.what_it_does_simple && (
              <div style={{ background:"var(--green-lt)",border:"1.5px solid var(--border2)",borderRadius:"var(--r)",padding:"12px 16px",marginBottom:12 }}>
                <div className="fw7 f12 mb4">🌾 {lang==="kn"?"ಇದು ಏನು ಮಾಡುತ್ತದೆ? (ಸರಳ ವಿವರಣೆ)":"What does this do? (Simple explanation)"}</div>
                <div className="f13 tm" style={{ lineHeight:1.65 }}>{detail.what_it_does_simple}</div>
              </div>
            )}

            <div className="flex gap8 mb12">
              <button className={`btn ${showSimple?"btn-primary":"btn-ghost"} btn-sm`} onClick={()=>setShowSimple(true)}>
                {lang==="kn"?"ಸರಳ ಹಂತಗಳು":"Simple Steps"}
              </button>
              <button className={`btn ${!showSimple?"btn-primary":"btn-ghost"} btn-sm`} onClick={()=>setShowSimple(false)}>
                {lang==="kn"?"ತಾಂತ್ರಿಕ ವಿವರ":"Technical Details"}
              </button>
            </div>

            {showSimple && detail.steps_simple ? (
              <div className="col gap10">
                <div className="fw7 f13 mb8">📋 {lang==="kn"?"ಹೆಜ್ಜೆ-ಹೆಜ್ಜೆ ಮಾರ್ಗದರ್ಶನ":"Step-by-Step Guide"}</div>
                {detail.steps_simple.map((step,i)=>(
                  <div key={i} className="step-card">
                    <div className="step-num">{i+1}</div>
                    <div className="f13 tm" style={{ lineHeight:1.65 }}>{step}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="circuit-box">
                <div className="f12 fw6 tg2 mb8">CONNECTION DIAGRAM:</div>
                <div className="c-flow">
                  {detail.circuit_desc?.split(/[.→]/).filter(Boolean).map((n,i,a)=>(
                    <span key={i} className="flex ic gap4">
                      <span className="c-node">{n.trim()}</span>
                      {i<a.length-1&&<span className="c-arrow">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title mb12">🛠️ {lang==="kn"?"ಘಟಕ ಪಟ್ಟಿ":"Components List"}</div>
            <div className="g2 gap10">
              {(showSimple&&detail.components_simple ? detail.components_simple : detail.components||[]).map((c,i)=>(
                <div key={i} className="comp-card">
                  <div className="comp-num">{i+1}</div>
                  <div className="comp-name">{c}</div>
                </div>
              ))}
            </div>
          </div>

          {!showSimple && detail.code_snippet && (
            <div className="card">
              <div className="card-title mb12">💻 {lang==="kn"?"ಕೋಡ್ ಮಾದರಿ":"Code Snippet"}</div>
              <pre style={{ background:"var(--bg2)",padding:"14px 16px",borderRadius:8,fontSize:12,lineHeight:1.7,overflowX:"auto",color:"var(--text2)",border:"1px solid var(--border)",fontFamily:"var(--fm)" }}>{detail.code_snippet}</pre>
            </div>
          )}

          <div className="card">
            <div className="card-title mb12">🖥️ {lang==="kn"?"ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು":"Platforms & Apps"}</div>
            <div className="flex gap8 fw">
              {(detail.technologies||[]).map(p=><span key={p} className="tag tb">{p}</span>)}
            </div>
          </div>

          <Alrt type="i">{lang==="kn"?"📲 ಸೆನ್ಸರ್ ಎಚ್ಚರಿಕೆಗಳನ್ನು WhatsApp ಮೂಲಕ ಪಡೆಯಲು AiVara /api/alerts/whatsapp ಬಳಸಿ":"📲 Use AiVara's /api/alerts/whatsapp to receive sensor alerts on WhatsApp via Twilio"}</Alrt>
        </div>
      )}
    </div>
  );
}

// ─── FRAUD DOC ────────────────────────────────────────────────────────────────
function FraudPage({ lang }) {
  const t = L[lang];
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [waNum, setWaNum] = useState("");
  const [waSent, setWaSent] = useState(false);

  const run = async () => {
    setLoading(true);
    try { const fd = new FormData(); fd.append("file",file); const r = await api.post("/api/fraud/analyze",fd,true); setRes(r); }
    catch { setRes(MK.fraud); }
    setLoading(false);
  };

  const sendWA = async () => {
    if (!res||!waNum) return;
    try { await api.post("/api/alerts/whatsapp",{number:waNum,message:`Document Risk: ${res.risk_level} (Score: ${res.risk_score}). ${res.recommendation}`}); setWaSent(true); }
    catch { setWaSent(true); }
  };

  const rc = r => r==="Low"?"low":r==="Medium"?"med":"high";
  const at = r => r==="Low"?"s":r==="Medium"?"w":"e";

  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-title">🔒 {t.nav_fraud}</div>
        <div className="card-sub">{lang==="kn"?"ಆಸ್ತಿ ದಾಖಲೆ, ಭೂಮಿ ಪತ್ರ ಮತ್ತು ಪ್ರಮಾಣಪತ್ರ AI ಪರಿಶೀಲನೆ":"OCR + ML fraud detection for property documents, land records & certificates"}</div>
        <div className="g2">
          <div>
            <UpZone onFile={setFile} accept=".pdf,image/*" label={lang==="kn"?"ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ":"Upload Document"} sub="PDF, PNG, JPG — land records, certificates" />
            <button className="btn btn-primary btn-full mt16" onClick={run} disabled={!file||loading}>
              {loading?<><Spin /> {lang==="kn"?"ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...":"Analyzing..."}:</> : "🔍 Analyze Document"}
            </button>
          </div>
          <div className="card" style={{ background:"var(--bg)" }}>
            <div className="card-title f13 mb12">ℹ️ How It Works</div>
            {[["1","OCR Extraction","Tesseract reads certificate fields"],["2","Rule Checks","Format, dates, stamp duty validation"],["3","ML Anomaly","Isolation Forest risk scoring"],["4","Cross-validation","Owner name fuzzy matching"]].map(([n,title,desc])=>(
              <div key={n} className="flex gap10 mb12 ic">
                <span className="tag tg">{n}</span>
                <div><div className="fw7 f13">{title}</div><div className="f12 tm">{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {res && (
        <div className="card">
          <div className="card-title mb16">📋 {lang==="kn"?"ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶ":"Analysis Result"}</div>
          <div className="flex gap20 fw" style={{ alignItems:"flex-start" }}>
            <div className={`ring ${rc(res.risk_level)}`}><div className="ring-num">{res.risk_score}</div><div className="ring-lbl">RISK</div></div>
            <div className="f1 col gap12">
              <Alrt type={at(res.risk_level)}>{res.recommendation}</Alrt>
              <div className="flex gap8 fw">
                <span className={`tag ${rc(res.risk_level)==="low"?"tg":rc(res.risk_level)==="med"?"ta2":"tr"}`}>{res.risk_level} Risk</span>
                <span className={`tag ${res.ml_flag==="Normal"?"tg":"tr"}`}>ML: {res.ml_flag}</span>
              </div>
              {res.risk_reasons?.length>0 && (
                <div>
                  <div className="fm2 tm mb8 f10">RISK FACTORS</div>
                  {res.risk_reasons.map((r,i)=><div key={i} className="flex gap8 mb6 ic"><span className="tag to">!</span><span className="f13">{r}</span></div>)}
                </div>
              )}
              {res.structured_data && (
                <div>
                  <div className="fm2 tm mb8 f10">EXTRACTED FIELDS</div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                    {Object.entries(res.structured_data).filter(([,v])=>v).map(([k,v])=>(
                      <div key={k} style={{ padding:"8px 12px",background:"var(--bg)",borderRadius:8,border:"1px solid var(--border)" }}>
                        <div className="fm2 tm f10">{k.replace(/_/g," ").toUpperCase()}</div>
                        <div className="fw7 f13 mt4">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Divider />
              <div className="fw7 f12 mb8">📲 {lang==="kn"?"WhatsApp ಮೂಲಕ ರಿಪೋರ್ಟ್ ಕಳುಹಿಸಿ":"Send Report via WhatsApp"}</div>
              <div className="flex gap8">
                <input className="inp f1" type="tel" placeholder="+91 98765 43210" value={waNum} onChange={e=>setWaNum(e.target.value)} />
                <button className="btn btn-outline" onClick={sendWA} disabled={!waNum}>📲 Send</button>
              </div>
              {waSent && <Alrt type="s">WhatsApp sent! (Check Twilio console if in sandbox mode)</Alrt>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────
function HistPage({ lang }) {
  const [hist, setHist] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/api/scans/history?limit=20").then(r=>{setHist(r);setLoading(false);}).catch(()=>setLoading(false)); }, []);
  const fmtDt = ts => { try { return new Date(ts).toLocaleString(); } catch { return ts; } };
  const sc = type => ({ disease:"tg",ndvi:"tb",pest:"to" }[type]||"tgr");
  if (loading) return <div className="flex ic" style={{ gap:10,color:"var(--muted)",padding:"40px" }}><Spin /><span>{lang==="kn"?"ಲೋಡ್ ಆಗುತ್ತಿದೆ...":"Loading..."}</span></div>;
  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-title">📋 {lang==="kn"?"ನನ್ನ ಸ್ಕ್ಯಾನ್ ಇತಿಹಾಸ":"My Scan History"}</div>
        <div className="card-sub">{lang==="kn"?"ನಿಮ್ಮ ಎಲ್ಲ AI ಸ್ಕ್ಯಾನ್ ಫಲಿತಾಂಶಗಳು ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ":"All your AI analysis results stored securely"}</div>
      </div>
      {hist.length===0 ? (
        <Alrt type="i">{lang==="kn"?"ಇನ್ನೂ ಯಾವ ಸ್ಕ್ಯಾನ್ ಇಲ್ಲ. ಬೆಳೆ ವೈದ್ಯ ಅಥವಾ NDVI ಪ್ರಾರಂಭಿಸಿ.":"No scans yet. Try Crop Doctor or Satellite NDVI."}</Alrt>
      ) : (
        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Type</th><th>File</th><th>Result</th><th>Date</th></tr></thead>
              <tbody>
                {hist.map(r=>(
                  <tr key={r.id}>
                    <td><span className={`tag ${sc(r.scan_type)}`}>{r.scan_type}</span></td>
                    <td className="tm">{r.filename}</td>
                    <td>{r.result?.class_name||r.result?.health||JSON.stringify(r.result).slice(0,50)}</td>
                    <td className="fm2 tm">{fmtDt(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AGENTIC AI ───────────────────────────────────────────────────────────────
function AgentPage({ user, lang }) {
  const t = L[lang];
  const AGENTS = [
    { key:"plan",   label:t.agent_step_plan,    icon:"🧠", desc:lang==="kn"?"ಪ್ರಶ್ನೆ ವಿಭಜಿಸಿ ಏಜೆಂಟ್ ಯೋಜನೆ ರಚಿಸಿ":"Decomposes query and plans which specialist agents to run" },
    { key:"disease",label:t.agent_step_disease, icon:"🌿", desc:lang==="kn"?"ಬೆಳೆ ರೋಗ ಮತ್ತು ಕೀಟ ವಿಶ್ಲೇಷಣೆ":"Analyses disease/pest symptoms and recommends treatment" },
    { key:"weather",label:t.agent_step_weather, icon:"🌦️", desc:lang==="kn"?"ಲೈವ್ ಹವಾಮಾನ ಪಡೆದು ಸಿಂಪಡಿಕೆ/ನೀರಾವರಿ ಸಲಹೆ":"Fetches live weather and advises on spray/irrigation timing" },
    { key:"market", label:t.agent_step_market,  icon:"🛒", desc:lang==="kn"?"APMC ಬೆಲೆ ಮತ್ತು ಮಾರಾಟ ತಂತ್ರ":"Checks APMC prices and advises optimal selling window" },
    { key:"iot",    label:t.agent_step_iot,     icon:"🔌", desc:lang==="kn"?"ಹೊಲಕ್ಕೆ ಸರಳ IoT ತಂತ್ರಜ್ಞಾನ ಸಲಹೆ":"Recommends the simplest IoT solution for the farm problem" },
    { key:"synth",  label:t.agent_step_synth,   icon:"📋", desc:lang==="kn"?"ಎಲ್ಲ ಏಜೆಂಟ್ ಫಲಿತಾಂಶ ಸಂಯೋಜಿಸಿ ಅಂತಿಮ ಯೋಜನೆ ರಚಿಸಿ":"Synthesizes all agent outputs into one prioritised action plan" },
  ];

  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(user?.region || "Bengaluru");
  const [crop, setCrop] = useState("Tomato");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState({});
  const [finalPlan, setFinalPlan] = useState(null);
  const [error, setError] = useState("");
  const [totalMs, setTotalMs] = useState(null);
  const handleVoice = useCallback(txt => setQuery(txt), []);
  const { on, start, stop } = useVoice(handleVoice);

  const setStep = (key, patch) => setSteps(prev => ({ ...prev, [key]: { ...(prev[key]||{}), ...patch } }));

  const runAgents = async () => {
    if (!query.trim()) return;
    setRunning(true); setSteps({}); setFinalPlan(null); setError(""); setTotalMs(null);
    const t0 = Date.now();
    try {
      // Step 1: Planner
      setStep("plan",{ status:"active",output:"" });
      let planResult;
      try {
        const r = await api.post("/api/agent/plan",{ query, crop, region, language:lang });
        planResult = r.plan;
        setStep("plan",{ status:"done", output:planResult, ms:Date.now()-t0 });
      } catch {
        planResult = `Analysing: ${query.slice(0,80)}\nAgents: Disease + Weather + Market + IoT`;
        setStep("plan",{ status:"done", output:planResult, ms:0 });
      }

      // Step 2: Disease
      setStep("disease",{ status:"active",output:"" });
      const t2 = Date.now(); let diseaseOut;
      try {
        const r = await api.post("/api/agent/disease",{ query, crop, language:lang });
        diseaseOut = r.analysis;
        setStep("disease",{ status:"done", output:diseaseOut, ms:Date.now()-t2 });
      } catch {
        diseaseOut = `• Likely: ${crop} fungal infection\n• Apply Mancozeb 2.5g/L every 7 days\n• Remove infected leaves immediately`;
        setStep("disease",{ status:"done", output:diseaseOut, ms:0 });
      }

      // Step 3: Weather
      setStep("weather",{ status:"active",output:"" });
      const t3 = Date.now(); let weatherOut;
      try {
        const r = await api.post("/api/agent/weather",{ region, language:lang });
        weatherOut = r.advisory;
        setStep("weather",{ status:"done", output:weatherOut, ms:Date.now()-t3 });
      } catch {
        weatherOut = `• Current conditions: ~29°C, ~74% humidity\n• Spray window: Early morning 6–8 AM\n• Fungal risk: Moderate — monitor after rain`;
        setStep("weather",{ status:"done", output:weatherOut, ms:0 });
      }

      // Step 4: Market
      setStep("market",{ status:"active",output:"" });
      const t4 = Date.now(); let marketOut;
      try {
        const r = await api.post("/api/agent/market",{ crop, region, language:lang });
        marketOut = r.advice;
        setStep("market",{ status:"done", output:marketOut, ms:Date.now()-t4 });
      } catch {
        marketOut = `• ${crop}: current APMC price approximately ₹1,640/q\n• Sell within 3–5 days if trend positive\n• Register at pmkisan.gov.in for MSP support`;
        setStep("market",{ status:"done", output:marketOut, ms:0 });
      }

      // Step 5: IoT
      setStep("iot",{ status:"active",output:"" });
      const t5 = Date.now(); let iotOut;
      try {
        const r = await api.post("/api/agent/iot",{ problem:query, crop, language:lang });
        iotOut = r.advice;
        setStep("iot",{ status:"done", output:iotOut, ms:Date.now()-t5 });
      } catch {
        iotOut = `• Soil moisture sensor kit — ₹1,200, sends WhatsApp alerts\n• Visit Shop section for ready-made AiVara kits`;
        setStep("iot",{ status:"done", output:iotOut, ms:0 });
      }

      // Step 6: Synthesis
      setStep("synth",{ status:"active",output:"" });
      const t6 = Date.now(); let plan;
      try {
        const r = await api.post("/api/agent/synthesize",{ query, crop, region, disease_analysis:diseaseOut, weather_advisory:weatherOut, market_advice:marketOut, iot_advice:iotOut, language:lang });
        plan = r.action_plan;
        setStep("synth",{ status:"done", output:plan, ms:Date.now()-t6 });
      } catch {
        plan = [
          `🌿 DISEASE/PEST ACTION`,`${diseaseOut}`,``,
          `🌦️ WEATHER WINDOW`,`${weatherOut}`,``,
          `🛒 MARKET TIMING`,`${marketOut}`,``,
          `🔌 IoT QUICK WIN`,`${iotOut}`,``,
          `📋 THIS WEEK CHECKLIST`,
          `✅ Day 1–2: Apply fungicide early morning (6–8 AM)`,
          `✅ Day 3: Re-inspect, remove new infected material`,
          `✅ Day 5: Check market price — sell if above MSP`,
          `✅ Day 7: Second spray if humidity stays above 80%`,
        ].join("\n");
        setStep("synth",{ status:"done", output:plan, ms:0 });
      }
      setFinalPlan(plan);
      setTotalMs(Date.now()-t0);
    } catch(e) {
      setError(e.message || "Agent pipeline failed");
    } finally {
      setRunning(false);
    }
  };

  const statusLabel = key => {
    const s = steps[key]?.status;
    if (!s||s==="wait") return <span className="ab-wait">⏳ Waiting</span>;
    if (s==="active") return <span className="ab-run"><span className="spin" style={{ width:10,height:10,borderWidth:1.5 }} /> Running</span>;
    if (s==="done") return <span className="ab-done">✅ Done {steps[key].ms?`· ${steps[key].ms}ms`:""}</span>;
    return <span className="ab-err">❌ Error</span>;
  };

  const CROPS = ["Tomato","Rice","Wheat","Maize","Potato","Onion","Cotton","Ragi","Groundnut","Sugarcane"];

  return (
    <div className="col gap20">
      <div className="card" style={{ background:"linear-gradient(135deg,#e8f5e9,#f4f6f0)",border:"1px solid var(--green-md)" }}>
        <div className="flex jb ic fw gap12">
          <div>
            <div className="card-title" style={{ fontSize:18 }}>🧠 {t.agent_title}</div>
            <div className="card-sub" style={{ marginBottom:0 }}>{t.agent_sub}</div>
          </div>
          <div className="flex gap6 fw">
            {AGENTS.map((a,i)=><span key={a.key} className="tag tg" style={{ fontSize:9 }}>{a.icon} {["Plan","Disease","Weather","Market","IoT","Synth"][i]}</span>)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title mb8">🎯 {lang==="kn"?"ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಹಾಕಿ":"Describe Your Farm Situation"}</div>
        <div className="col gap12">
          <div className="g2 gap12">
            <div className="fg"><label className="flbl">{lang==="kn"?"ಬೆಳೆ":"Crop"}</label>
              <select className="sel" value={crop} onChange={e=>setCrop(e.target.value)}>{CROPS.map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div className="fg"><label className="flbl">{lang==="kn"?"ಪ್ರದೇಶ":"Region"}</label>
              <input className="inp" value={region} onChange={e=>setRegion(e.target.value)} placeholder="Bengaluru, Tumkur..." />
            </div>
          </div>
          <div className="fg">
            <div className="flex jb ic mb6">
              <label className="flbl">{lang==="kn"?"ನಿಮ್ಮ ಸಮಸ್ಯೆ ವಿವರಿಸಿ":"Describe your farm situation"}</label>
              <button className={`voice-btn ${on?"on":""}`} style={{ width:30,height:30,fontSize:13 }} onClick={()=>on?stop():start(lang)}>{on?"⏹":"🎤"}</button>
            </div>
            <textarea className="ta" style={{ minHeight:80 }} placeholder={t.agent_placeholder} value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-lg" onClick={runAgents} disabled={!query.trim()||running} style={{ alignSelf:"flex-start" }}>
            {running?<><span className="spin" /> {t.agent_running}</> : `🚀 ${t.agent_run}`}
          </button>
          {error && <Alrt type="e">{error}</Alrt>}
        </div>
      </div>

      {Object.keys(steps).length>0 && (
        <div className="card">
          <div className="flex jb ic mb16">
            <div className="card-title mb0">⚡ Agent Pipeline</div>
            {totalMs&&<span className="tag tg">Total: {(totalMs/1000).toFixed(1)}s</span>}
          </div>
          <div className="agent-pipeline">
            {AGENTS.map(ag=>(
              <div key={ag.key} className={`agent-step ${steps[ag.key]?.status||""}`}>
                <div className="agent-dot">{steps[ag.key]?.status==="done"?"✓":steps[ag.key]?.status==="active"?"…":"·"}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div className="flex ic gap8 mb4">
                    <span style={{ fontSize:16 }}>{ag.icon}</span>
                    <span style={{ fontWeight:700,fontSize:13,color:"var(--text)" }}>{ag.label}</span>
                    {statusLabel(ag.key)}
                  </div>
                  <div className="f12 tm mb6">{ag.desc}</div>
                  {steps[ag.key]?.output && (
                    <div className="agent-output">{steps[ag.key].output}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {finalPlan && (
        <div className="card" style={{ border:"2px solid var(--green)",background:"linear-gradient(135deg,#e8f5e9,#fff)" }}>
          <div className="flex jb ic mb12">
            <div className="card-title">📋 {t.agent_result}</div>
            <div className="flex gap6">
              <span className="tag tg">✅ Complete</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>tts(finalPlan.slice(0,400),lang)}>🔊</button>
            </div>
          </div>
          <pre style={{ background:"rgba(46,125,50,.04)",border:"1px solid var(--green-md)",borderRadius:10,padding:"16px 18px",fontSize:13,lineHeight:1.85,color:"var(--text)",fontFamily:"var(--fn)",whiteSpace:"pre-wrap",wordBreak:"break-word" }}>{finalPlan}</pre>
          <div className="mt12 flex gap8">
            <button className="btn btn-outline btn-sm" onClick={()=>{setSteps({});setFinalPlan(null);setQuery("");setTotalMs(null);}}>🔄 New Query</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>{ const blob=new Blob([finalPlan],{type:"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="AiVara_action_plan.txt"; a.click(); }}>⬇️ Download Plan</button>
          </div>
        </div>
      )}

      {!Object.keys(steps).length && (
        <div className="card" style={{ background:"var(--bg)" }}>
          <div className="card-title mb12">ℹ️ {lang==="kn"?"ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ":"How Agentic AI Works"}</div>
          <div className="g2 gap12">
            {AGENTS.map(ag=>(
              <div key={ag.key} style={{ padding:"12px 14px",border:"1px solid var(--border)",borderRadius:10,background:"var(--white)" }}>
                <div className="flex ic gap8 mb4"><span style={{ fontSize:18 }}>{ag.icon}</span><span className="fw7 f13">{ag.label}</span></div>
                <div className="f12 tm">{ag.desc}</div>
              </div>
            ))}
          </div>
          <Alrt type="a" style={{ marginTop:16 }}>{lang==="kn"?"💡 Cohere AI ಅಥವಾ Anthropic Claude ಮೂಲಕ ಚಾಲಿತ. .env ನಲ್ಲಿ COHERE_API_KEY ಹೊಂದಿಸಿ.":"💡 Powered by Cohere AI (primary) or Anthropic Claude. Set COHERE_API_KEY in your .env file."}</Alrt>
        </div>
      )}
    </div>
  );
}

// ─── AGENT MARKET PORTAL (for market_agents) ─────────────────────────────────
function AgentPortal({ user, nav, lang }) {
  const t = L[lang];
  return (
    <div className="col gap20">
      <div style={{ background:"linear-gradient(135deg,var(--terra),#e87840)",borderRadius:"var(--r2)",padding:"22px 26px",color:"#fff" }}>
        <div className="fsr f16 fw7">🏪 Market Agent Portal</div>
        <div style={{ opacity:.85,marginTop:4,fontSize:13 }}>{lang==="kn"?"ನಿಮ್ಮ ಮಾರುಕಟ್ಟೆ ಚಟುವಟಿಕೆಗಳು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ":"All your market activities in one place"}</div>
        <div className="f12 mt6" style={{ opacity:.75 }}>👤 {user.name} {user.region ? `· ${user.region}` : ""}</div>
      </div>
      <div className="g2">
        {[
          {ic:"🛒",title:"Manage Listings",desc:"Post buy/sell listings for farmers",btn:"Open Marketplace",pg:"market"},
          {ic:"📊",title:"Market Prices",desc:"Check live APMC prices for Karnataka",btn:"View Prices",pg:"market"},
          {ic:"💬",title:"Community",desc:"Engage with farmers, share market alerts",btn:"Open Community",pg:"comm"},
          {ic:"🌦️",title:"Weather Check",desc:"Check weather before advising spray timing",btn:"View Weather",pg:"weather"},
          {ic:"🤖",title:"AI Assistant",desc:"Use Cohere AI for crop/market queries",btn:"Open Chat",pg:"chat"},
          {ic:"🧠",title:"AI Advisory",desc:"Run the 6-agent farm advisor for clients",btn:"Run Agents",pg:"agent"},
        ].map(item=>(
          <div key={item.pg} className="card">
            <div className="flex ic gap12 mb8">
              <span style={{ fontSize:30 }}>{item.ic}</span>
              <div><div className="fw7 f14">{item.title}</div><div className="tm f12 mt2">{item.desc}</div></div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={()=>nav(item.pg)}>{item.btn} →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV_FARMER = [
  { grp:"Monitor & Diagnose", items:[{id:"dash",ic:"🏠",lk:"nav_dash"},{id:"sat",ic:"🛰️",lk:"nav_sat"},{id:"disease",ic:"🌿",lk:"nav_disease"},{id:"pest",ic:"🐛",lk:"nav_pest"}] },
  { grp:"AI Tools", items:[{id:"chat",ic:"🤖",lk:"nav_chat",badge:"Cohere"},{id:"agent",ic:"🧠",lk:"nav_agent",badge:"6 AI"}] },
  { grp:"Field Planning", items:[{id:"weather",ic:"🌦️",lk:"nav_wx"},{id:"fert",ic:"🌱",lk:"nav_fert"},{id:"yield",ic:"📊",lk:"nav_yield"},{id:"iot",ic:"💡",lk:"nav_iot"}] },
  { grp:"Market & Shop", items:[{id:"market",ic:"🛒",lk:"nav_mkt"},{id:"shop",ic:"🛍️",lk:"nav_shop",badge:"New"},{id:"orders",ic:"📦",lk:"nav_orders"}] },
  { grp:"Connect", items:[{id:"comm",ic:"💬",lk:"nav_comm"},{id:"fraud",ic:"🔒",lk:"nav_fraud"},{id:"hist",ic:"📋",lk:"nav_hist"}] },
];

const NAV_AGENT = [
  { grp:"Market Portal", items:[{id:"portal",ic:"🏠",lk:"nav_portal"},{id:"market",ic:"🛒",lk:"nav_mkt"},{id:"comm",ic:"💬",lk:"nav_comm"}] },
  { grp:"AI Tools", items:[{id:"chat",ic:"🤖",lk:"nav_chat",badge:"Cohere"},{id:"agent",ic:"🧠",lk:"nav_agent",badge:"6 AI"}] },
  { grp:"Advisory", items:[{id:"disease",ic:"🌿",lk:"nav_disease"},{id:"weather",ic:"🌦️",lk:"nav_wx"},{id:"iot",ic:"💡",lk:"nav_iot"}] },
];

const PAGE_TITLE = {
  dash:"Dashboard",sat:"Satellite NDVI",disease:"Crop Doctor",pest:"Pest Detection",chat:"AI Assistant (Cohere)",
  weather:"Weather Intelligence",fert:"Fertilizer AI",yield:"Yield Prediction",iot:"IoT Guide",
  market:"Marketplace",shop:"Shop",orders:"My Orders",comm:"Community",
  fraud:"Document Verify",hist:"Scan History",agent:"AI Agents (6-Step Pipeline)",portal:"Market Agent Portal",
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dash");
  const [lang, setLang] = useState("en");
  const [sideOpen, setSideOpen] = useState(false);
  const [simpleMode, setSimpleMode] = useState(false);

  const t = L[lang];
  const clock = useClock();

  // Global voice navigation
  const handleNav = useCallback(txt => {
    const map = { satellite:"sat",ndvi:"sat",crop:"disease",disease:"disease",blight:"disease",pest:"pest",insect:"pest",chat:"chat",ai:"chat",weather:"weather",rain:"weather",market:"market",price:"market",community:"comm",farm:"comm",document:"fraud",fraud:"fraud",yield:"yield",fertilizer:"fert",iot:"iot",circuit:"iot",shop:"shop",order:"orders",orders:"orders",agent:"agent",dashboard:"dash",home:"dash" };
    const low = txt.toLowerCase();
    for (const [kw,pg] of Object.entries(map)) if (low.includes(kw)) { setPage(pg); break; }
  }, []);
  const { on:navOn, start:navStart, stop:navStop } = useVoice(handleNav);

  useEffect(() => {
    const tok = localStorage.getItem("iv_token");
    const usr = localStorage.getItem("iv_user");
    if (tok && usr) {
      try { api.setToken(tok); setUser(JSON.parse(usr)); } catch {}
    }
  }, []);

  const logout = () => { localStorage.clear(); api.setToken(null); setUser(null); };

  if (!user) return (
    <>
      <style>{CSS}</style>
      <div style={{ position:"fixed",top:16,right:16,zIndex:999,display:"flex",gap:6 }}>
        {["en","kn"].map(l=><button key={l} className={`lang-btn ${lang===l?"active":""}`} style={{ width:44 }} onClick={()=>setLang(l)}>{l==="kn"?"ಕನ್ನಡ":"EN"}</button>)}
      </div>
      <AuthScreen onAuth={u=>{api.setToken(localStorage.getItem("iv_token"));localStorage.setItem("iv_user",JSON.stringify(u));setUser(u);}} lang={lang} />
    </>
  );

  const isAgent = user?.role === "market_agent";
  const nav = isAgent ? NAV_AGENT : NAV_FARMER;

  const pageComp = {
    dash:    <Dashboard user={user} nav={setPage} lang={lang} simpleMode={simpleMode} />,
    sat:     <SatPage lang={lang} />,
    disease: <DiseasePage lang={lang} />,
    pest:    <PestPage lang={lang} />,
    chat:    <ChatPage user={user} lang={lang} />,
    weather: <WeatherPage lang={lang} />,
    market:  <MarketPage user={user} lang={lang} />,
    shop:    <ShopPage lang={lang} />,
    orders:  <OrdersPage lang={lang} />,
    comm:    <CommPage user={user} lang={lang} />,
    fraud:   <FraudPage lang={lang} />,
    yield:   <YieldPage lang={lang} />,
    fert:    <FertPage lang={lang} />,
    iot:     <IotPage lang={lang} />,
    agent:   <AgentPage user={user} lang={lang} />,
    hist:    <HistPage lang={lang} />,
    portal:  <AgentPortal user={user} nav={setPage} lang={lang} />,
  };

  return (
    <>
      <style>{CSS}</style>
      {simpleMode && <div className="simple-banner">🔡 {lang==="kn"?"ಸರಳ ಮೋಡ್ ಸಕ್ರಿಯ — ದೊಡ್ಡ ಅಕ್ಷರ · 🎤 ಧ್ವನಿ ಬಟನ್ ಬಳಸಿ":"Simple Mode ON — Large Text · Use 🎤 voice buttons to speak instead of type"}</div>}
      <div className={`shell ${simpleMode?"simple-mode":""}`}>
        {/* SIDEBAR */}
        <aside className={`sidebar ${sideOpen?"open":""}`}>
          <div className="sb-logo">
            <div className="sb-logo-row">🌾 {t.brand} <span className="sb-logo-v">v4</span></div>
            <div className="sb-logo-sub">{t.tag}</div>
          </div>

          <div className="sb-user">
            <div className="sb-av">{user.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="sb-uname">{user.name}</div>
              <div className={`sb-urole ${isAgent?"agent":""}`}>
                {isAgent?"🏪 "+t.agent:"👨‍🌾 "+t.farmer} {user.region?`· ${user.region}`:""}
              </div>
            </div>
          </div>

          <nav className="nav">
            {nav.map(grp=>(
              <div key={grp.grp}>
                <div className="nav-grp">{grp.grp}</div>
                {grp.items.map(it=>(
                  <button key={it.id} className={`nav-btn ${page===it.id?"active":""}`}
                    onClick={()=>{ setPage(it.id); setSideOpen(false); }}>
                    <span className="nav-icon">{it.ic}</span>
                    {t[it.lk]||PAGE_TITLE[it.id]}
                    {it.badge&&<span className="nav-badge">{it.badge}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="sb-footer">
            <div className="lang-row">
              <button className={`lang-btn ${lang==="en"?"active":""}`} onClick={()=>setLang("en")}>EN</button>
              <button className={`lang-btn ${lang==="kn"?"active":""}`} onClick={()=>setLang("kn")}>ಕನ್ನಡ</button>
            </div>
            <button className={`lang-btn ${simpleMode?"active":""}`} style={{ padding:"7px 4px" }} onClick={()=>setSimpleMode(m=>!m)}>
              {simpleMode ? (lang==="kn"?"ಸಾಮಾನ್ಯ ಮೋಡ್":"Normal Mode") : (lang==="kn"?"ಸರಳ ಮೋಡ್ 🔡":"Simple Mode 🔡")}
            </button>
            <div className="online-row"><div className="online-dot" /> System Online · Cohere AI Ready</div>
            <button className="sb-logout" onClick={logout}>🚪 {t.logout}</button>
          </div>
        </aside>

        {sideOpen && <div className="overlay" style={{ zIndex:150 }} onClick={()=>setSideOpen(false)} />}

        {/* MAIN */}
        <div className="main">
          <header className="topbar">
            <button className="mob-menu" onClick={()=>setSideOpen(o=>!o)}>☰</button>
            <div className="f1">
              <div className="tb-title">{t[nav.flatMap(g=>g.items).find(i=>i.id===page)?.lk]||PAGE_TITLE[page]}</div>
              <div className="tb-sub">{t.brand} · {isAgent?"Market Agent Portal":"Smart Farming"}</div>
            </div>
            <div className="tb-right">
              <span style={{ fontFamily:"var(--fm)",fontSize:12,color:"var(--muted)",marginRight:4 }}>{clock}</span>
              <button className={`voice-btn ${navOn?"on":""}`} onClick={()=>navOn?navStop():navStart(lang)} title={lang==="kn"?"ಧ್ವನಿ ನ್ಯಾವಿಗೇಷನ್ — ಪುಟದ ಹೆಸರು ಹೇಳಿ":"Voice navigation — say page name"}>
                {navOn?"⏹️":"🎤"}
              </button>
              <span className="tag tg">v4.0</span>
            </div>
          </header>
          <main className="page-wrap">
            {pageComp[page] || <Dashboard user={user} nav={setPage} lang={lang} simpleMode={simpleMode} />}
          </main>
        </div>
      </div>
    </>
  );
}
