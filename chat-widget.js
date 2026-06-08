/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
   Baden Report Chat Widget
   РЈРЅРёРІРµСЂСЃР°Р»СЊРЅС‹Р№ AI-С‡Р°С‚ РґР»СЏ РґР°С€Р±РѕСЂРґРѕРІ Baden Uktus.
   РџРѕРґРєР»СЋС‡РµРЅРёРµ: <script src="chat-widget.js" data-report="finance"></script>
   РђРІС‚РѕРѕРїСЂРµРґРµР»РµРЅРёРµ report_id вЂ” РїРѕ РёРјРµРЅРё С„Р°Р№Р»Р° СЃС‚СЂР°РЅРёС†С‹.
   в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */
(function() {
  'use strict';

  // в”Ђв”Ђ РљРѕРЅС„РёРі в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  // РЎРµСЂРІРµСЂ С‡Р°С‚Р° (cloudflared URL). РњРµРЅСЏРµС‚СЃСЏ РїСЂРё РїРµСЂРµР·Р°РїСѓСЃРєРµ С‚РѕРЅРЅРµР»СЏ.
  const SERVER_URL_KEY = 'baden_chat_server_url';
  // Р”РµС„РѕР»С‚РЅС‹Р№ URL вЂ” Р·Р°РјРµРЅРёРј РїСЂРё РїРµСЂРІРѕРј Р·Р°РїСѓСЃРєРµ С‚РѕРЅРЅРµР»СЏ Рё РІСЃС‚СЂРѕРёРј РІ HTML
  const DEFAULT_SERVER = 'https://trader-graphical-atom-writers.trycloudflare.com';

  function getServerUrl() {
    // 1. data-server Р°С‚СЂРёР±СѓС‚ СЃРєСЂРёРїС‚Р° (РµСЃР»Рё Р·Р°РґР°РЅ РІСЂСѓС‡РЅСѓСЋ)
    const script = document.currentScript || document.querySelector('script[data-report]');
    if (script && script.dataset.server) return script.dataset.server;
    // 2. window.__chatServerUrl (РµСЃР»Рё Р·Р°РґР°РЅ РґРѕ РїРѕРґРєР»СЋС‡РµРЅРёСЏ)
    if (window.__chatServerUrl) return window.__chatServerUrl;
    // 3. localStorage (Р·Р°РїРѕРјРЅРёР»Рё РІ РїСЂРѕС€Р»С‹Р№ СЂР°Р·)
    const stored = localStorage.getItem(SERVER_URL_KEY);
    if (stored) return stored;
    return DEFAULT_SERVER;
  }

  // в”Ђв”Ђ РћРїСЂРµРґРµР»РµРЅРёРµ report_id в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  function detectReportId() {
    const script = document.currentScript || document.querySelector('script[data-report]');
    if (script && script.dataset.report) return script.dataset.report;
    // РђРІС‚Рѕ вЂ” РїРѕ РёРјРµРЅРё С„Р°Р№Р»Р°
    const path = location.pathname.toLowerCase();
    if (path.includes('finance')) return 'finance';
    if (path.includes('sales')) return 'sales';
    if (path.includes('forecast')) return 'forecast';
    if (path.includes('loyalty')) return 'loyalty';
    return null;
  }

  const REPORT_ID = detectReportId();
  if (!REPORT_ID) {
    console.warn('[chat-widget] report_id РЅРµ РѕРїСЂРµРґРµР»С‘РЅ вЂ” РІРёРґР¶РµС‚ РЅРµ РїРѕРєР°Р·Р°РЅ');
    return;
  }

  // в”Ђв”Ђ Р—Р°РіРѕР»РѕРІРєРё РЅР° РєР°Р¶РґС‹Р№ РѕС‚С‡С‘С‚ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  const REPORT_TITLES = {
    finance: 'РџРѕРјРѕС‰РЅРёРє РїРѕ Р‘Р”Р”РЎ',
    sales:   'РџРѕРјРѕС‰РЅРёРє РїРѕ РџСЂРѕРґР°Р¶Р°Рј',
    forecast:'РџРѕРјРѕС‰РЅРёРє РїРѕ РџСЂРѕРіРЅРѕР·Сѓ',
    loyalty: 'РџРѕРјРѕС‰РЅРёРє РїРѕ Р›РѕСЏР»СЊРЅРѕСЃС‚Рё',
  };

  // в”Ђв”Ђ РР·РІР»РµС‡РµРЅРёРµ РґР°РЅРЅС‹С… РёР· РґР°С€Р±РѕСЂРґР° в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  function extractDashboardData() {
    // 1) РЎРїРµС†РёР°Р»СЊРЅР°СЏ РїРµСЂРµРјРµРЅРЅР°СЏ (РґР»СЏ loyalty.html)
    if (window.__preloaded) {
      try {
        const p = window.__preloaded;
        const parts = [];
        if (p.updatedAt) parts.push('РћР±РЅРѕРІР»РµРЅРѕ: ' + p.updatedAt);
        if (p.guests)   parts.push('=== GUESTS.CSV ===\n' + p.guests);
        if (p.visits)   parts.push('=== VISITS.CSV ===\n' + p.visits);
        if (p.surveys)  parts.push('=== SURVEYS.CSV ===\n' + p.surveys);
        return parts.join('\n\n');
      } catch (e) {}
    }
    // 2) Р•СЃР»Рё РµСЃС‚СЊ РєР°СЃС‚РѕРјРЅС‹Р№ extractor вЂ” РёСЃРїРѕР»СЊР·СѓРµРј РµРіРѕ
    if (typeof window.__reportData === 'function') {
      try { return window.__reportData(); } catch (e) {}
    }
    if (typeof window.__reportData === 'string') return window.__reportData;
    // 3) Generic вЂ” СЃРѕР±РёСЂР°РµРј РІРµСЃСЊ РІРёРґРёРјС‹Р№ С‚РµРєСЃС‚ С‚Р°Р±Р»РёС†, Р·Р°РіРѕР»РѕРІРєРѕРІ Рё РёРЅРїСѓС‚РѕРІ СЃ РґР°РЅРЅС‹РјРё
    const parts = [];
    const title = document.querySelector('h1, h2');
    if (title) parts.push('# ' + title.innerText.trim());
    document.querySelectorAll('table').forEach((t, i) => {
      if (i < 8) parts.push('### РўР°Р±Р»РёС†Р° ' + (i+1) + ':\n' + t.innerText.replace(/\t/g, ' | '));
    });
    // Р•СЃР»Рё С‚Р°Р±Р»РёС† РЅРµС‚ вЂ” РІРѕР·СЊРјС‘Рј body innerText
    if (parts.length < 2) {
      const txt = (document.body.innerText || '').replace(/\s+\n/g, '\n').trim();
      parts.push(txt.slice(0, 60000));
    }
    return parts.join('\n\n');
  }

  // в”Ђв”Ђ UI в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  const STYLE = `
.bc-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;
  background:#c8a97e;border:none;cursor:pointer;color:#0c0c0c;display:flex;align-items:center;
  justify-content:center;font-size:24px;box-shadow:0 8px 24px rgba(0,0,0,.45);z-index:9999;
  transition:transform .2s,background .2s;font-family:system-ui;}
.bc-btn:hover{transform:translateY(-3px);background:#d8b98e;}
.bc-btn.open{background:#0c0c0c;color:#c8a97e;border:1px solid #c8a97e;}

.bc-panel{position:fixed;bottom:88px;right:24px;width:380px;max-width:calc(100vw - 32px);
  height:560px;max-height:calc(100vh - 120px);background:#0c0c0c;border:1px solid rgba(255,255,255,.08);
  display:none;flex-direction:column;z-index:9998;color:#f0ede8;
  font-family:'DM Sans',-apple-system,system-ui,sans-serif;
  box-shadow:0 24px 64px rgba(0,0,0,.6);}
.bc-panel.open{display:flex;}

.bc-head{padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.08);
  display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}
.bc-head-title{font-family:'Cormorant',Georgia,serif;font-style:italic;font-size:18px;color:#fff;}
.bc-head-sub{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#c8a97e;margin-top:2px;font-weight:500;}
.bc-clear{background:transparent;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:11px;
  text-transform:uppercase;letter-spacing:.1em;padding:4px 8px;font-family:inherit;}
.bc-clear:hover{color:#c8a97e;}

.bc-msgs{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:14px;}
.bc-msgs::-webkit-scrollbar{width:4px;}
.bc-msgs::-webkit-scrollbar-thumb{background:rgba(200,169,126,.4);}

.bc-msg{font-size:14px;line-height:1.55;}
.bc-msg.user{color:rgba(255,255,255,.6);padding-left:14px;border-left:2px solid rgba(200,169,126,.35);}
.bc-msg.ai{color:#f0ede8;white-space:pre-wrap;}
.bc-msg.ai strong{color:#c8a97e;}
.bc-msg.err{color:#e07070;font-size:12px;font-style:italic;}

.bc-typing{display:flex;gap:4px;padding:6px 0;}
.bc-typing span{width:6px;height:6px;border-radius:50%;background:#c8a97e;animation:bcDot 1.2s infinite ease-in-out;}
.bc-typing span:nth-child(2){animation-delay:.2s;}
.bc-typing span:nth-child(3){animation-delay:.4s;}
@keyframes bcDot{0%,80%,100%{opacity:.3;transform:scale(.8);}40%{opacity:1;transform:scale(1);}}

.bc-chips{padding:0 18px 12px;display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0;}
.bc-chip{font-size:11px;color:rgba(255,255,255,.55);background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);padding:6px 12px;cursor:pointer;
  transition:border-color .2s,color .2s;font-family:inherit;border-radius:0;}
.bc-chip:hover{border-color:#c8a97e;color:#c8a97e;}

.bc-input-row{padding:12px 14px;border-top:1px solid rgba(255,255,255,.08);
  display:flex;gap:8px;flex-shrink:0;background:rgba(255,255,255,.02);}
.bc-input{flex:1;background:transparent;border:1px solid rgba(255,255,255,.1);
  padding:10px 12px;color:#fff;font-size:14px;font-family:inherit;outline:none;
  transition:border-color .2s;resize:none;min-height:38px;max-height:120px;}
.bc-input:focus{border-color:#c8a97e;}
.bc-send{background:#c8a97e;color:#0c0c0c;border:none;padding:0 16px;
  font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;
  cursor:pointer;font-family:inherit;transition:background .2s;}
.bc-send:hover:not(:disabled){background:#d8b98e;}
.bc-send:disabled{opacity:.4;cursor:wait;}

.bc-footer{padding:8px 18px;font-size:10px;color:rgba(255,255,255,.25);text-align:center;
  letter-spacing:.08em;border-top:1px solid rgba(255,255,255,.05);flex-shrink:0;}

@media(max-width:480px){
  .bc-panel{right:8px;left:8px;width:auto;bottom:80px;height:calc(100vh - 100px);}
  .bc-btn{right:16px;bottom:16px;}
}
`;

  // РџРѕРґСЃРєР°Р·РєРё (chips) РЅР° РєР°Р¶РґС‹Р№ РѕС‚С‡С‘С‚
  const CHIPS = {
    finance: ['Р“Р»Р°РІРЅС‹Рµ РёР·РјРµРЅРµРЅРёСЏ', 'РќР°Р№РґРё Р°РЅРѕРјР°Р»РёРё', 'РЎР°РјС‹Р№ РїСЂРёР±С‹Р»СЊРЅС‹Р№ РјРµСЃСЏС†'],
    sales:   ['РўРѕРї СѓСЃР»СѓРі РїРѕ РІС‹СЂСѓС‡РєРµ', 'Р”РёРЅР°РјРёРєР° СЃСЂРµРґРЅРµРіРѕ С‡РµРєР°', 'РљР°РєРѕР№ РґРµРЅСЊ РЅРµРґРµР»Рё Р»СѓС‡С€РёР№'],
    forecast:['Р§С‚Рѕ Р¶РґС‘С‚ РІ Р±Р»РёР¶Р°Р№С€РёР№ РјРµСЃСЏС†', 'Р“РґРµ РѕС‚РєР»РѕРЅРµРЅРёСЏ РѕС‚ С„Р°РєС‚Р°', 'РўСЂРµРЅРґС‹ РїРѕСЃРµС‰Р°РµРјРѕСЃС‚Рё'],
    loyalty: ['РЎРєРѕР»СЊРєРѕ Р°РєС‚РёРІРЅС‹С… РіРѕСЃС‚РµР№', 'РўРѕРї-5 РїРѕ РІРёР·РёС‚Р°Рј', 'РЎСЂРµРґРЅРёР№ NPS'],
  };

  // РҐСЂР°РЅРёР»РёС‰Рµ РёСЃС‚РѕСЂРёРё РґРёР°Р»РѕРіР° (per-report)
  const HIST_KEY = 'baden_chat_history_' + REPORT_ID;
  let history = [];
  try {
    const raw = sessionStorage.getItem(HIST_KEY);
    if (raw) history = JSON.parse(raw);
  } catch (e) {}

  function saveHistory() {
    try { sessionStorage.setItem(HIST_KEY, JSON.stringify(history.slice(-20))); } catch (e) {}
  }

  // в”Ђв”Ђ РЎРѕР·РґР°РЅРёРµ DOM в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  // РџРѕРґРєР»СЋС‡РёРј С€СЂРёС„С‚С‹, РµСЃР»Рё РЅРµ РїРѕРґРєР»СЋС‡РµРЅС‹
  if (!document.querySelector('link[href*="DM+Sans"]')) {
    const f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Cormorant:ital,wght@0,400;1,400&display=swap';
    document.head.appendChild(f);
  }

  const btn = document.createElement('button');
  btn.className = 'bc-btn';
  btn.innerHTML = 'вњ¦';
  btn.title = 'РЎРїСЂРѕСЃРёС‚СЊ РР-РїРѕРјРѕС‰РЅРёРєР°';

  const panel = document.createElement('div');
  panel.className = 'bc-panel';
  panel.innerHTML = `
    <div class="bc-head">
      <div>
        <div class="bc-head-title">${REPORT_TITLES[REPORT_ID] || 'AI РџРѕРјРѕС‰РЅРёРє'}</div>
        <div class="bc-head-sub">AI В· Baden Uktus</div>
      </div>
      <button class="bc-clear" title="РћС‡РёСЃС‚РёС‚СЊ РґРёР°Р»РѕРі">РћС‡РёСЃС‚РёС‚СЊ</button>
    </div>
    <div class="bc-msgs"></div>
    <div class="bc-chips"></div>
    <div class="bc-input-row">
      <textarea class="bc-input" placeholder="Р—Р°РґР°Р№С‚Рµ РІРѕРїСЂРѕСЃ РїРѕ РѕС‚С‡С‘С‚Сѓ..." rows="1"></textarea>
      <button class="bc-send">РћС‚РїСЂР°РІРёС‚СЊ</button>
    </div>
    <div class="bc-footer">РћС‚РІРµС‚С‹ РЅРѕСЃСЏС‚ РёРЅС„РѕСЂРјР°С†РёРѕРЅРЅС‹Р№ С…Р°СЂР°РєС‚РµСЂ</div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  const msgs = panel.querySelector('.bc-msgs');
  const input = panel.querySelector('.bc-input');
  const sendBtn = panel.querySelector('.bc-send');
  const chipsRow = panel.querySelector('.bc-chips');
  const clearBtn = panel.querySelector('.bc-clear');

  // Р§РёРїС‹
  (CHIPS[REPORT_ID] || []).forEach(t => {
    const c = document.createElement('button');
    c.className = 'bc-chip';
    c.textContent = t;
    c.onclick = () => { input.value = t; input.focus(); };
    chipsRow.appendChild(c);
  });

  // Render history
  function renderHistory() {
    msgs.innerHTML = '';
    if (history.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'bc-msg ai';
      hint.innerHTML = `<strong>РџСЂРёРІРµС‚!</strong> РЇ РјРѕРіСѓ РѕС‚РІРµС‚РёС‚СЊ РЅР° РІРѕРїСЂРѕСЃС‹ РїРѕ СЌС‚РѕРјСѓ РѕС‚С‡С‘С‚Сѓ вЂ” РґР°РЅРЅС‹Рµ Сѓ РјРµРЅСЏ РїРµСЂРµРґ РіР»Р°Р·Р°РјРё. РЎРїСЂРѕСЃРёС‚Рµ РїСЂРѕ С†РёС„СЂС‹, С‚СЂРµРЅРґС‹, Р°РЅРѕРјР°Р»РёРё вЂ” С‡С‚Рѕ СѓРіРѕРґРЅРѕ.`;
      msgs.appendChild(hint);
    } else {
      history.forEach(m => addMessage(m.role, m.content, false));
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addMessage(role, text, save = true) {
    const el = document.createElement('div');
    el.className = 'bc-msg ' + (role === 'user' ? 'user' : 'ai');
    if (role === 'assistant') {
      // РџСЂРѕСЃС‚Р°СЏ markdown-РѕР±СЂР°Р±РѕС‚РєР°
      text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }
    el.innerHTML = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    if (save) {
      history.push({role, content: text});
      saveHistory();
    }
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'bc-msg ai bc-typing-wrap';
    t.innerHTML = '<div class="bc-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
    return t;
  }

  async function send() {
    const q = input.value.trim();
    if (!q || sendBtn.disabled) return;
    input.value = '';
    addMessage('user', q);
    sendBtn.disabled = true;
    const typingEl = showTyping();

    try {
      const serverUrl = getServerUrl();
      const data = extractDashboardData();
      const resp = await fetch(serverUrl.replace(/\/$/, '') + '/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          report_id: REPORT_ID,
          question: q,
          data: data,
          history: history.slice(-6, -1),  // РїРѕСЃР»РµРґРЅРёРµ 3 РїР°СЂС‹ Р±РµР· С‚РѕР»СЊРєРѕ С‡С‚Рѕ РґРѕР±Р°РІР»РµРЅРЅРѕРіРѕ
        })
      });
      typingEl.remove();
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({error: 'РЎРµСЂРІРµСЂ РІРµСЂРЅСѓР» ' + resp.status}));
        addMessage('assistant', '<span class="bc-msg err">РћС€РёР±РєР°: ' + (err.error || 'РЅРµРёР·РІРµСЃС‚РЅР°СЏ') + '</span>');
        return;
      }
      const j = await resp.json();
      addMessage('assistant', j.answer);
    } catch (e) {
      typingEl.remove();
      addMessage('assistant', '<span class="bc-msg err">РќРµ СѓРґР°Р»РѕСЃСЊ СЃРІСЏР·Р°С‚СЊСЃСЏ СЃ СЃРµСЂРІРµСЂРѕРј С‡Р°С‚Р°. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕРґРєР»СЋС‡РµРЅРёРµ.</span>');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  sendBtn.onclick = send;

  clearBtn.onclick = () => {
    if (confirm('РћС‡РёСЃС‚РёС‚СЊ РёСЃС‚РѕСЂРёСЋ РґРёР°Р»РѕРіР°?')) {
      history = [];
      saveHistory();
      renderHistory();
    }
  };

  btn.onclick = () => {
    const opening = !panel.classList.contains('open');
    panel.classList.toggle('open', opening);
    btn.classList.toggle('open', opening);
    btn.innerHTML = opening ? 'Г—' : 'вњ¦';
    if (opening) {
      renderHistory();
      setTimeout(() => input.focus(), 100);
    }
  };

  // Render initial
  renderHistory();
  console.log('[chat-widget] Loaded for report:', REPORT_ID);
})();
