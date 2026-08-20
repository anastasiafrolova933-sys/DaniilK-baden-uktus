/* ─────────────────────────────────────────────────────────────────────────
   Baden Uktus · Neo — портал отчётов в светлой подаче.
   Один скрипт на два экрана: главная (data-page="home") и «Все отчёты» (="all").

   Цифры настоящие — ../../live.json, тот же файл кормит боевой портал.
   Права: если в браузере есть живая сессия (BadenAuth), берём её; иначе
   работает переключатель «смотреть как» — чтобы черновик можно было
   оценить под разными ролями, не перелогиниваясь.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var PAGE = document.body.dataset.page || 'home';

  var ICON = {
    coin:  '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.6 10h3.4a1.8 1.8 0 0 1 0 3.6h-2.6a1.8 1.8 0 0 0 0 3.6h3.6"/>',
    chart: '<path d="M4 19V5M4 19h16"/><path d="M8 15l3.5-4 3 2.4L20 8"/>',
    wave:  '<path d="M3 14c2.5 0 2.5-5 5-5s2.5 5 5 5 2.5-5 5-5 2.5 5 3 5"/><path d="M3 19h18"/>',
    bars:  '<path d="M4 19V5M4 19h16"/><path d="M8.5 16V11M12.5 16V7M16.5 16v-3"/>',
    heart: '<path d="M12 20s-7-4.4-7-9.2A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.8C19 15.6 12 20 12 20Z"/>',
    users: '<path d="M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11Z"/><path d="M2.5 19c0-3 2.9-4.8 6.5-4.8s6.5 1.8 6.5 4.8"/><path d="M16.5 11.4a3 3 0 0 0 0-6"/><path d="M18 14.6c2.1.6 3.5 1.9 3.5 4.4"/>',
    eye:   '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    calc:  '<rect x="5" y="3.5" width="14" height="17" rx="2.4"/><path d="M8.5 8h7M8.5 12h2M13.5 12h2M8.5 16h2M13.5 16h2"/>',
    pnl:   '<path d="M4 19V5M4 19h16"/><path d="M7.5 15.5 11 12l2.5 2 5-6.5"/><path d="M18.5 7.5h-3.2M18.5 7.5v3.2"/>',
    globe: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4a13 13 0 0 1 0 16 13 13 0 0 1 0-16Z"/>',
    tg:    '<path d="M20.5 4.5 2.8 11.3c-.8.3-.8 1.4 0 1.7l4.4 1.5 1.7 5c.3.8 1.3 1 1.8.3l2.3-2.8 4.4 3.2c.6.4 1.5.1 1.7-.6l3-13.4c.2-.9-.7-1.6-1.6-1.2Z"/>',
    deck:  '<rect x="3.5" y="4.5" width="17" height="11" rx="2"/><path d="M12 15.5V20M8 20h8"/>',
    badge: '<path d="M12 3.5 5 6.5v5c0 4 3 7.4 7 9 4-1.6 7-5 7-9v-5l-7-3Z"/><path d="M9.2 12.2 11 14l3.8-4"/>',
    lock:  '<rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'
  };

  // ── реестр карточек. perm — ключ прав боевого портала ──────────────────
  var REPORTS = [
    { key: 'finance',    perm: 'finance',  name: 'БДДС',            icon: 'coin',  skin: 'olive', group: 'money',    href: '../../finance.html',            slots: [600, 1080] },
    { key: 'sales',      perm: 'sales',    name: 'Продажи',         icon: 'chart', skin: 'rose',  group: 'money',    href: '../../sales.html',              slots: [600, 1080] },
    { key: 'forecast',   perm: 'forecast', name: 'Прогноз',         icon: 'wave',  skin: 'sand',  group: 'guests',   href: '../../forecast.html',           slots: [600, 1080] },
    { key: 'attendance', perm: 'sales',    name: 'Посещения',       icon: 'bars',  skin: 'clay',  group: 'guests',   href: '../../attendance.html',         slots: [620, 1100] },
    { key: 'owner',      perm: 'finance',  name: 'Экран собственника', icon: 'eye', skin: 'plum', group: 'money',    href: '../../owner.html',              slots: [600, 1080] },
    { key: 'calc',       perm: 'forecast', name: 'Калькулятор цен', icon: 'calc',  skin: 'sky',   group: 'guests',   href: '../../pricing-calculator.html', slots: null },
    { key: 'loyalty',    perm: 'loyalty',  name: 'Лояльность',      icon: 'heart', skin: 'sage',  group: 'guests',   href: '../../loyalty.html',            slots: 'hourly' },
    { key: 'staff',      perm: 'staff',    name: 'ФОТ и штат',      icon: 'users', skin: 'slate', group: 'people',   href: '../../staff.html',              slots: [600, 1080] },
    { key: 'operations', perm: 'finance',  name: 'Операционный анализ', icon: 'pnl', skin: 'olive2', group: 'money', href: '../../operations.html',         slots: null }
  ];

  var PROJECTS = [
    { name: 'Главный сайт',    icon: 'globe', href: '../../index.html',                  cap: 'премиум-лендинг комплекса' },
    { name: '@BadenLoyalty_bot', icon: 'tg',  href: 'https://t.me/BadenLoyalty_bot',     cap: 'гостевой бот лояльности', ext: true },
    { name: 'Презентация',     icon: 'deck',  href: '../../presentation.html',           cap: 'цифровая экосистема · 15 слайдов' },
    { name: 'Baden Inside',    icon: 'badge', href: 'https://baden-inside.netlify.app',  cap: 'портал сотрудников', ext: true },
    { name: 'Обучение спасателей', icon: 'badge', href: '../../training-report.html',    cap: 'прогресс и ошибки' }
  ];

  // демо-роли: набор прав один в один с auth.py боевого портала
  var ROLES = {
    admin:    { name: 'Даниил К.',          role: 'admin',    perms: { finance: 1, sales: 1, forecast: 1, loyalty: 1, staff: 1, projects: 1, audit: 1 } },
    finsales: { name: 'Дрожжина Анастасия', role: 'finsales', perms: { finance: 1, sales: 1, forecast: 1, loyalty: 0, staff: 0, projects: 0, audit: 0 } },
    hr:       { name: 'Кадры',              role: 'hr',       perms: { finance: 0, sales: 0, forecast: 1, loyalty: 0, staff: 1, projects: 1, audit: 0 } }
  };

  var L = null;          // live.json
  var WHO = null;        // {name, role, perms, live:boolean}

  /* ── форматирование ──────────────────────────────────────────────────── */
  function nf(v, d) {
    if (v == null || isNaN(v)) return '—';
    var p = Number(v).toFixed(d == null ? 0 : d).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return p.join(',');
  }
  function pct(v) { return v == null ? '—' : (v > 0 ? '+' : '') + nf(v, 1).replace('-', '−') + '%'; }
  function hhmm(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return isNaN(d) ? '—' : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function can(perm) { return !perm || !WHO ? true : !!WHO.perms[perm]; }

  /* ── кто смотрит ─────────────────────────────────────────────────────── */
  function resolveWho() {
    var saved = null;
    try { saved = localStorage.getItem('neo_role'); } catch (e) {}
    if (!saved && window.BadenAuth) {
      var s = BadenAuth.getSession();
      if (s && s.user && s.permissions) {
        WHO = { name: s.user.name, role: s.user.role, perms: s.permissions, live: true };
        return;
      }
    }
    var r = ROLES[saved] || ROLES.admin;
    WHO = { name: r.name, role: r.role, perms: r.perms, live: false };
  }

  function buildWhoSwitch() {
    var host = document.getElementById('whoSwitch');
    if (!host) return;
    host.textContent = '';
    var btn = document.createElement('button');
    btn.className = 'who';
    btn.type = 'button';
    btn.innerHTML = '<span class="who__dot"></span>' +
      '<span class="who__txt">' + WHO.name + '</span>' +
      '<span class="who__role">' + WHO.role + '</span>' +
      (WHO.live ? '' : '<svg viewBox="0 0 24 24"><path d="M6 9.5l6 6 6-6"/></svg>');
    btn.title = WHO.live ? 'Живая сессия портала' : 'Демо-режим: посмотреть глазами другой роли';
    host.appendChild(btn);
    if (WHO.live) { btn.classList.add('who--live'); return; }

    var menu = document.createElement('div');
    menu.className = 'who__menu';
    Object.keys(ROLES).forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'who__item' + (ROLES[k].role === WHO.role ? ' is-on' : '');
      b.innerHTML = ROLES[k].name + '<span>' + ROLES[k].role + '</span>';
      b.addEventListener('click', function () {
        try { localStorage.setItem('neo_role', k); } catch (e) {}
        location.reload();
      });
      menu.appendChild(b);
    });
    host.appendChild(menu);
    btn.addEventListener('click', function (e) { e.stopPropagation(); host.classList.toggle('is-open'); });
    document.addEventListener('click', function () { host.classList.remove('is-open'); });
  }

  /* ── свежесть отчёта ─────────────────────────────────────────────────── */
  function freshness(r, lastUpdate) {
    if (!r.slots) return { p: 1, stale: false, manual: true };
    var now = new Date(), mins = now.getHours() * 60 + now.getMinutes(), prev, next;
    if (r.slots === 'hourly') { prev = Math.floor(mins / 60) * 60; next = prev + 60; }
    else {
      var s = r.slots;
      prev = s[s.length - 1] - 1440; next = s[0];
      for (var i = 0; i < s.length; i++) {
        if (s[i] <= mins) prev = s[i];
        if (s[i] > mins) { next = s[i]; break; }
      }
      if (mins >= s[s.length - 1]) { prev = s[s.length - 1]; next = s[0] + 1440; }
    }
    var lu = lastUpdate ? new Date(lastUpdate) : null;
    var luMin = lu && !isNaN(lu) ? lu.getHours() * 60 + lu.getMinutes() : -1e6;
    return { p: clamp((mins - prev) / (next - prev), 0, 1), stale: (mins - luMin) > (next - prev) + 60 };
  }

  /* ── что показывать на плитке ────────────────────────────────────────── */
  function tileData(r) {
    var t = L.thermal || {}, f = L.finance || {}, fc = L.forecast || {}, a = L.attendance || {};
    var st = (L.reports || {})[r.key] || {};
    var d = { value: '—', unit: '', label: '', side: null, sideCap: '', rows: [] };

    switch (r.key) {
      case 'finance':
        d.value = nf(f.totalRub / 1e6, 2); d.unit = 'млн ₽';
        d.label = 'поступления за ' + (f.yesterday || 'вчера');
        d.side = nf(f.kassaRub / 1e3) + 'к'; d.sideCap = 'касса';
        d.rows = [['Поступило', nf(f.totalRub) + ' ₽'], ['Касса', nf(f.kassaRub) + ' ₽'], ['Расчётный счёт', nf(f.rsRub) + ' ₽']];
        break;
      case 'sales':
        d.value = nf(t.revenueMln, 3); d.unit = 'млн ₽';
        d.label = 'выручка за ' + (t.yesterday || 'вчера');
        d.side = nf(t.guests); d.sideCap = 'гостей';
        d.rows = [['Гостей', nf(t.guests)], ['Средний чек', nf(t.checkRub) + ' ₽'],
                  ['К прошлой неделе', pct(t.revenueDeltaWeek), t.revenueDeltaWeek < 0],
                  ['К 2025 году', pct(t.revenueDelta2025), t.revenueDelta2025 < 0]];
        break;
      case 'forecast':
        d.value = '~' + nf(fc.guests); d.unit = 'гостей';
        d.label = 'ждём сегодня';
        d.side = '~' + nf(fc.revenueMln, 2); d.sideCap = 'млн ₽';
        d.rows = [['Гостей ждём', '~' + nf(fc.guests)], ['Выручка, прогноз', '~' + nf(fc.revenueMln, 2) + ' млн ₽'],
                  ['Вчера по факту', nf(t.guests) + ' гостей']];
        break;
      case 'attendance':
        d.value = pct(a.yoy12);
        d.label = 'отток за 12 месяцев';
        d.side = nf(a.q12); d.sideCap = 'гостей за год';
        d.rows = [['Отток за 12 мес', pct(a.yoy12), a.yoy12 < -10], ['Гостей за 12 мес', nf(a.q12)],
                  ['Данные по', (a.lastDataDate || '').split('-').reverse().join('.')]];
        break;
      case 'owner':
        var pf0 = a.planfact || {};
        d.value = nf(pf0.pct, 1); d.unit = '%';
        d.label = 'плана месяца закрыто';
        d.side = nf(pf0.factMln, 1); d.sideCap = 'млн ₽ факт';
        d.rows = [['Факт месяца', nf(pf0.factMln, 2) + ' млн ₽'], ['План на дату', nf(pf0.planMtdMln, 2) + ' млн ₽'],
                  ['План на месяц', nf(pf0.planMonthMln, 1) + ' млн ₽'], ['Выполнение', nf(pf0.pct, 1) + '%', pf0.pct < 90]];
        break;
      case 'calc':
        d.value = '+300'; d.unit = '₽';
        d.label = 'повышение прайса с 23.07';
        d.side = 'what-if'; d.sideCap = 'инструмент';
        d.rows = [['Режим', 'ручные данные'], ['Данные', '2023–2025'], ['Считает', 'цена ↔ поток ↔ выручка']];
        break;
      case 'loyalty':
        d.value = hhmm(st.lastUpdate);
        d.label = 'последнее обновление · каждый час';
        d.side = '1 ч'; d.sideCap = 'цикл';
        d.rows = [['Обновляется', 'каждый час'], ['Последнее', hhmm(st.lastUpdate)], ['Дашборд', '@BadenLoyalty_bot']];
        break;
      case 'staff':
        var c = (L.staff || {}).critical || [];
        d.value = c.length ? nf(c[0].filled, 1) : '—'; d.unit = '%';
        d.label = c.length ? 'укомплектованность · ' + c[0].name : 'укомплектованность';
        d.side = c.length ? '−' + c[0].deficit : null; d.sideCap = 'человек';
        d.rows = c.slice(0, 3).map(function (x) { return [x.name, nf(x.filled, 1) + '% · дефицит ' + x.deficit, x.filled < 60]; });
        break;
      case 'operations':
        d.value = 'P&L'; d.unit = '';
        d.label = 'доход и расход филиала';
        d.side = '7'; d.sideCap = 'подразделений';
        d.rows = [['Срезы', 'год · квартал · месяц'], ['Сравнение', 'факт 2025 vs план-факт 2026'], ['Источник', 'БДР']];
        break;
    }
    return d;
  }

  /* ── плитка ──────────────────────────────────────────────────────────── */
  function makeTile(r) {
    var st = (L.reports || {})[r.key] || {};
    var allowed = can(r.perm);
    var a = document.createElement(allowed ? 'a' : 'div');
    a.className = 'tile tile--' + r.skin + (allowed ? '' : ' tile--locked');
    a.dataset.key = r.key;
    a.dataset.group = r.group;

    if (!allowed) {
      a.setAttribute('aria-disabled', 'true');
      a.innerHTML =
        '<div class="tile__head">' +
          '<span class="tile__badge"><span class="tile__ico"><svg viewBox="0 0 24 24">' + ICON.lock + '</svg></span></span>' +
          '<span class="tile__name">' + r.name + '</span>' +
        '</div>' +
        '<div class="tile__lockmsg">Доступ закрыт</div>' +
        '<div class="tile__foot"><span>роль ' + WHO.role + '</span><b>нет прав</b></div>';
      return a;
    }

    var d = tileData(r);
    var fr = freshness(r, st.lastUpdate);
    var bad = st.status === 'warn' || st.status === 'alarm' || fr.stale;
    var R = 20, C = 2 * Math.PI * R;
    var dots = '';
    for (var i = 0; i < 10; i++) dots += '<i class="' + (i < Math.round(fr.p * 10) ? 'is-on' : '') + '"></i>';

    a.href = r.href;
    a.innerHTML =
      (bad ? '<span class="tile__flag" title="Требует внимания">' +
               '<svg viewBox="0 0 24 24"><path d="M12 4.5 21 19.5H3z" fill="' + (st.status === 'alarm' ? '#E4552B' : '#F0A030') + '"/>' +
               '<path d="M12 10v4.2M12 16.6v.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg></span>' : '') +
      '<div class="tile__head">' +
        '<span class="tile__badge' + (fr.stale ? ' is-stale' : '') + '">' +
          (fr.manual ? '' :
            '<svg class="ring" viewBox="0 0 46 46">' +
              '<circle class="ring__track" cx="23" cy="23" r="' + R + '"/>' +
              '<circle class="ring__prog" cx="23" cy="23" r="' + R + '" transform="rotate(-90 23 23)" ' +
                'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - fr.p)).toFixed(1) + '"/>' +
            '</svg>') +
          '<span class="tile__ico"><svg viewBox="0 0 24 24">' + ICON[r.icon] + '</svg></span>' +
        '</span>' +
        '<span class="tile__name">' + r.name + '</span>' +
        '<span class="tile__go"><svg viewBox="0 0 24 24"><path d="M8 16 16 8M9.5 8H16v6.5"/></svg></span>' +
      '</div>' +
      '<div class="tile__label">' + d.label + '</div>' +
      '<div class="tile__valrow">' +
        '<div class="tile__value">' + d.value + (d.unit ? '<small>' + d.unit + '</small>' : '') + '</div>' +
        (d.side ? '<div class="tile__side"><b>' + d.side + '</b><span>' + d.sideCap + '</span></div>' : '') +
      '</div>' +
      '<div class="tile__dots">' + dots + '</div>' +
      '<div class="tile__foot"><span>' + (fr.manual ? 'обновляется вручную' : 'Обновлено') + '</span><b>' +
        (fr.manual ? '—' : hhmm(st.lastUpdate)) + '</b></div>';

    a.addEventListener('pointermove', function (e) {
      var rc = a.getBoundingClientRect();
      a.style.setProperty('--mx', ((e.clientX - rc.left) / rc.width * 100) + '%');
      a.style.setProperty('--my', ((e.clientY - rc.top) / rc.height * 100) + '%');
    });
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      expand(a, r, d);
    });
    return a;
  }

  function makeProject(p) {
    var a = document.createElement('a');
    a.className = 'proj';
    a.href = p.href;
    if (p.ext) { a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML =
      '<span class="ico ico--ghost"><svg viewBox="0 0 24 24">' + ICON[p.icon] + '</svg></span>' +
      '<span class="proj__txt"><b>' + p.name + '</b><span>' + p.cap + '</span></span>' +
      '<span class="ico ico--soft"><svg viewBox="0 0 24 24"><path d="M8 16 16 8M9.5 8H16v6.5"/></svg></span>';
    return a;
  }

  function tilt(scope) {
    (scope || document).querySelectorAll('.tile:not(.tile--locked)').forEach(function (c) {
      var tx = 0, ty = 0, cx = 0, cy = 0, vx = 0, vy = 0, raf = 0, live = false;
      function frame() {
        vx += (tx - cx) * 0.18; vx *= 0.76; cx += vx;
        vy += (ty - cy) * 0.18; vy *= 0.76; cy += vy;
        c.style.transform = 'perspective(900px) rotateX(' + cy.toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
        if (live || Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02 ||
            Math.abs(vx) > 0.02 || Math.abs(vy) > 0.02) raf = requestAnimationFrame(frame);
        else { c.style.transform = ''; raf = 0; }
      }
      function run() { if (!raf && !REDUCED) raf = requestAnimationFrame(frame); }
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        live = true;
        tx = ((e.clientX - r.left) / r.width - 0.5) * 10;
        ty = -((e.clientY - r.top) / r.height - 0.5) * 10;
        run();
      });
      c.addEventListener('pointerleave', function () { live = false; tx = 0; ty = 0; run(); });
    });
  }

  /* ── разворот плитки ─────────────────────────────────────────────────── */
  var openSheet = null, openTile = null, scrim = null;

  function expand(tile, r, d) {
    if (openSheet) return;
    var rc = tile.getBoundingClientRect();
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.addEventListener('click', collapse);
    document.body.appendChild(scrim);
    requestAnimationFrame(function () { scrim.classList.add('on'); });

    var w = Math.min(620, innerWidth - 28), left = (innerWidth - w) / 2;
    var sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.style.cssText = 'left:' + left + 'px;top:0;width:' + w + 'px;height:auto;visibility:hidden;';
    sheet.innerHTML =
      '<div class="sheet__top">' +
        '<span class="ico ico--ghost"><svg viewBox="0 0 24 24">' + ICON[r.icon] + '</svg></span>' +
        '<h3>' + r.name + '</h3>' +
        '<button class="ico ico--soft" type="button" aria-label="Закрыть"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg></button>' +
      '</div>' +
      '<div class="sheet__value">' + d.value + (d.unit ? '<small>' + d.unit + '</small>' : '') + '</div>' +
      '<div class="sheet__cap">' + d.label + '</div>' +
      (d.rows.length ? '<div class="sheet__rows">' + d.rows.map(function (x) {
        return '<div class="sheet__row' + (x[2] ? ' warn' : '') + '"><span>' + x[0] + '</span><span>' + x[1] + '</span></div>';
      }).join('') + '</div>' : '') +
      '<div class="sheet__act">' +
        '<a class="sheet__open" href="' + r.href + '">Открыть отчёт <svg viewBox="0 0 24 24"><path d="M8 16 16 8M9.5 8H16v6.5"/></svg></a>' +
        '<button class="sheet__later" type="button">Не сейчас</button>' +
        '<span class="sheet__hint">Enter — открыть · Esc — закрыть</span>' +
      '</div>';
    document.body.appendChild(sheet);

    var h = Math.min(sheet.offsetHeight, innerHeight - 56);
    var top = Math.max(28, (innerHeight - h) / 2);
    sheet.style.height = h + 'px'; sheet.style.top = top + 'px'; sheet.style.visibility = '';

    sheet.querySelector('.ico--soft').addEventListener('click', collapse);
    sheet.querySelector('.sheet__later').addEventListener('click', collapse);

    var from = 'translate(' + (rc.left - left) + 'px,' + (rc.top - top) + 'px) scale(' +
               (rc.width / w) + ',' + (rc.height / h) + ')';
    var dur = REDUCED ? 1 : 460;
    sheet.animate([{ transform: from, opacity: 0.4 }, { transform: 'none', opacity: 1 }],
                  { duration: dur, easing: 'cubic-bezier(0.22,1,0.36,1)' });
    sheet.querySelectorAll('.sheet__value,.sheet__cap,.sheet__rows,.sheet__act').forEach(function (el, i) {
      el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: dur, delay: REDUCED ? 0 : 110 + i * 55, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'backwards' });
    });

    tile.style.visibility = 'hidden';
    openSheet = sheet; openTile = tile;
    addEventListener('keydown', onKey);
    sheet.querySelector('.sheet__open').focus();
  }
  function collapse() {
    if (!openSheet) return;
    var sheet = openSheet, tile = openTile;
    openSheet = null; openTile = null;
    removeEventListener('keydown', onKey);
    var rc = tile.getBoundingClientRect(), s = sheet.getBoundingClientRect();
    var to = 'translate(' + (rc.left - s.left) + 'px,' + (rc.top - s.top) + 'px) scale(' +
             (rc.width / s.width) + ',' + (rc.height / s.height) + ')';
    scrim.classList.remove('on');
    sheet.animate([{ transform: 'none', opacity: 1 }, { transform: to, opacity: 0.3 }],
                  { duration: REDUCED ? 1 : 360, easing: 'cubic-bezier(0.5,0,0.75,0)' })
         .onfinish = function () { sheet.remove(); scrim.remove(); tile.style.visibility = ''; };
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); collapse(); } }

  /* ── лента «Сегодня» ─────────────────────────────────────────────────── */
  function paintToday() {
    var host = document.getElementById('today');
    if (!host) return;
    var t = L.thermal || {}, fc = L.forecast || {}, a = L.attendance || {}, pf = a.planfact || {};
    var chips = [];

    // каждый чип ведёт в отчёт, из которого взята цифра
    if (can('sales') && t.guests) chips.push(['вчера', nf(t.guests) + ' гостей · ' + nf(t.revenueMln, 3) + ' млн ₽', 0, '../../sales.html']);
    if (can('forecast') && fc.guests) chips.push(['сегодня ждём', '~' + nf(fc.guests) + ' · ~' + nf(fc.revenueMln, 2) + ' млн ₽', 0, '../../forecast.html']);
    if (can('sales') && pf.pct != null) chips.push(['месяц', nf(pf.factMln, 1) + ' млн ₽ · ' + nf(pf.pct, 1) + '%', pf.pct < 90, can('finance') ? '../../owner.html' : '../../attendance.html']);
    if (can('sales') && a.yoy12 < -10) chips.push(['отток за год', pct(a.yoy12), 1, '../../attendance.html']);
    if (can('staff')) ((L.staff || {}).critical || []).slice(0, 2).forEach(function (c) {
      chips.push([c.name, 'укомплект. ' + nf(c.filled, 1) + '% · −' + c.deficit, 1, '../../staff.html']);
    });

    if (!chips.length) { host.remove(); return; }
    var now = new Date();
    var m = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'][now.getMonth()];
    host.innerHTML =
      '<div class="today__date">Сегодня · ' + now.getDate() + ' ' + m + '</div>' +
      '<div class="today__chips">' + chips.map(function (c) {
        return '<a class="chip' + (c[2] ? ' chip--warn' : '') + '" href="' + c[3] + '">' +
               '<span>' + c[0] + '</span><b>' + c[1] + '</b></a>';
      }).join('') + '</div>';
  }

  /* ── герой ───────────────────────────────────────────────────────────── */
  // Переключатель в шапке героя показывает только то, что реально есть в live.json —
  // выдуманных сегментов в списке нет.
  var METRICS = [
    { key: 'plan',     perm: 'sales',    label: 'План месяца' },
    { key: 'revenue',  perm: 'sales',    label: 'Выручка вчера' },
    { key: 'guests',   perm: 'sales',    label: 'Гости вчера' },
    { key: 'forecast', perm: 'forecast', label: 'Прогноз на сегодня' }
  ];

  function heroValue(key) {
    var t = L.thermal || {}, fc = L.forecast || {}, pf = (L.attendance || {}).planfact || {};
    switch (key) {
      case 'plan':
        if (pf.pct == null) return null;
        var diff = pf.pct - 100;
        return { v: pf.pct, dec: 1, unit: '%', bands: true,
                 cap: 'плана месяца · ' + nf(pf.factMln, 2) + ' из ' + nf(pf.planMtdMln, 2) + ' млн ₽',
                 delta: (diff >= 0 ? 'с опережением на ' : 'отставание ') + nf(Math.abs(diff), 1) + ' п.п.' };
      case 'revenue':
        if (t.revenueMln == null) return null;
        return { v: t.revenueMln, dec: 3, unit: 'млн ₽',
                 cap: 'выручка за ' + (t.yesterday || 'вчера'),
                 delta: pct(t.revenueDeltaWeek) + ' к прошлой неделе' };
      case 'guests':
        if (t.guests == null) return null;
        return { v: t.guests, dec: 0, unit: 'чел.',
                 cap: 'гостей за ' + (t.yesterday || 'вчера') + ' · средний чек ' + nf(t.checkRub) + ' ₽',
                 delta: pct(t.guestsDeltaWeek) + ' к прошлой неделе' };
      case 'forecast':
        if (fc.guests == null) return null;
        return { v: fc.guests, dec: 0, unit: 'гостей',
                 cap: 'ждём сегодня · ~' + nf(fc.revenueMln, 2) + ' млн ₽',
                 delta: 'прогноз на ' + (fc.today || 'сегодня') };
    }
    return null;
  }

  function paintHero(key) {
    var el = document.getElementById('planPct');
    if (!el) return;
    var hi = document.getElementById('heroHi');
    if (hi) hi.innerHTML = 'Привет, ' + WHO.name.split(' ')[0] + '!<br><i>Посмотрим, как идут дела</i>';

    var avail = METRICS.filter(function (m) { return can(m.perm) && heroValue(m.key); });
    var cap = document.getElementById('planCap'), delta = document.getElementById('planDelta');
    var bands = document.getElementById('bands');

    if (!avail.length) {
      el.textContent = '—'; cap.textContent = 'нет доступа к сводным цифрам'; delta.textContent = '';
      bands.style.display = 'none';
      var sel0 = document.getElementById('segSelect'); if (sel0) sel0.style.display = 'none';
      return;
    }

    var m = avail.filter(function (x) { return x.key === key; })[0] || avail[0];
    var d = heroValue(m.key);
    countUp(el, d.v, d.dec);
    document.querySelector('.hero__unit').textContent = d.unit;
    cap.textContent = d.cap;
    delta.textContent = d.delta;
    bands.style.display = d.bands ? '' : 'none';

    if (d.bands) {
      var p = d.v, tt;
      if (p <= 90)       tt = clamp((p - 75) / 15, 0, 1) / 3;
      else if (p <= 100) tt = 1 / 3 + (p - 90) / 10 / 3;
      else               tt = 2 / 3 + clamp((p - 100) / 15, 0, 1) / 3;
      requestAnimationFrame(function () {
        document.getElementById('bandsMarker').style.left = (tt * 100).toFixed(1) + '%';
      });
    }
    buildMetricPicker(avail, m.key);
  }

  function buildMetricPicker(avail, active) {
    var sel = document.getElementById('segSelect');
    if (!sel) return;
    sel.innerHTML = avail.filter(function (m) { return m.key === active; })[0].label +
      '<svg viewBox="0 0 24 24"><path d="M6 9.5l6 6 6-6"/></svg>';

    var wrap = sel.parentNode;
    var old = wrap.querySelector('.who__menu');
    if (old) old.remove();
    if (avail.length < 2) { sel.style.pointerEvents = 'none'; sel.querySelector('svg').style.display = 'none'; return; }

    wrap.classList.add('who-wrap');
    var menu = document.createElement('div');
    menu.className = 'who__menu who__menu--right';
    avail.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'who__item' + (m.key === active ? ' is-on' : '');
      b.textContent = m.label;
      b.addEventListener('click', function () {
        wrap.classList.remove('is-open');
        paintHero(m.key);
      });
      menu.appendChild(b);
    });
    wrap.appendChild(menu);
    sel.onclick = function (e) { e.stopPropagation(); wrap.classList.toggle('is-open'); };
    document.addEventListener('click', function () { wrap.classList.remove('is-open'); });
  }

  function countUp(el, to, dec) {
    if (REDUCED) { el.textContent = nf(to, dec); return; }
    var t0 = performance.now(), dur = 1000;
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      el.textContent = nf(to * (1 - Math.pow(1 - p, 3)), dec);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ── график ──────────────────────────────────────────────────────────── */
  function paintChart() {
    var host = document.getElementById('chart');
    if (!host) return;
    var panel = host.closest('.panel');
    if (!can('sales')) { if (panel) panel.remove(); return; }

    var a = L.attendance || {};
    var rev = a.sparkRev30, gst = a.spark30;
    if (!rev || rev.length < 3) { host.innerHTML = '<div class="chart__empty">нет данных</div>'; return; }

    var data = rev.slice(-14), W = 100, H = 100, PAD = 6;
    var mn = Math.min.apply(null, data), mx = Math.max.apply(null, data), rng = (mx - mn) || 1;
    var xs = function (i) { return PAD + i * (W - PAD * 2) / (data.length - 1); };
    var ys = function (v) { return PAD + (1 - (v - mn) / rng) * (H - PAD * 2 - 14); };
    function path(vals) {
      var d = '';
      vals.forEach(function (v, i) {
        var x = xs(i), y = ys(v);
        if (!i) { d = 'M ' + x + ' ' + y; return; }
        var px = xs(i - 1), py = ys(vals[i - 1]), cx = (px + x) / 2;
        d += ' C ' + cx + ' ' + py + ' ' + cx + ' ' + y + ' ' + x + ' ' + y;
      });
      return d;
    }
    var ghost = null;
    if (gst && gst.length >= data.length) {
      var g = gst.slice(-data.length);
      var gmn = Math.min.apply(null, g), gmx = Math.max.apply(null, g), grng = (gmx - gmn) || 1;
      ghost = g.map(function (v) { return mn + (v - gmn) / grng * rng; });
    }
    var peak = data.indexOf(mx), px = xs(peak), py = ys(mx);

    host.innerHTML =
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Выручка по дням">' +
        [0.18, 0.42, 0.66, 0.9].map(function (f) {
          var y = PAD + f * (H - PAD * 2 - 14);
          return '<line class="chart__grid" x1="' + PAD + '" y1="' + y + '" x2="' + (W - PAD) + '" y2="' + y + '" vector-effect="non-scaling-stroke"/>';
        }).join('') +
        (ghost ? '<path class="chart__ghost" d="' + path(ghost) + '" vector-effect="non-scaling-stroke"/>' : '') +
        '<path class="chart__line" d="' + path(data) + '" vector-effect="non-scaling-stroke"/>' +
        '<line class="chart__drop" x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + (H - 16) + '" vector-effect="non-scaling-stroke"/>' +
      '</svg>';

    var over = document.createElement('div');
    over.style.cssText = 'position:relative;margin-top:-168px;height:168px;pointer-events:none';
    over.innerHTML =
      '<div style="position:absolute;left:' + px + '%;top:' + (py / 100 * 168 - 16) + 'px;transform:translate(-50%,-50%)">' +
        '<span style="display:grid;place-items:center;min-width:56px;height:38px;padding:0 12px;border-radius:999px;' +
        'background:var(--lime);color:var(--lime-ink);font-size:15px;font-weight:500;font-variant-numeric:tabular-nums">' +
        nf(mx, 2) + '</span></div>' +
      '<div style="position:absolute;left:' + px + '%;top:158px;transform:translateX(-50%);font-size:12px;color:var(--ink-3)">' +
        dayLabel(data.length - 1 - peak) + '</div>';
    host.appendChild(over);
  }
  function dayLabel(daysAgo) {
    var d = new Date(); d.setDate(d.getDate() - 1 - daysAgo);
    var m = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()];
    return d.getDate() + ' ' + m;
  }

  /* ── экран «Все отчёты»: белые стат-карточки ─────────────────────────── */
  function paintStats() {
    var host = document.getElementById('stats');
    if (!host) return;
    var a = L.attendance || {}, pf = a.planfact || {}, t = L.thermal || {};
    var fresh = 0, total = 0;
    REPORTS.forEach(function (r) {
      if (!can(r.perm) || !r.slots) return;
      total++;
      if (!freshness(r, ((L.reports || {})[r.key] || {}).lastUpdate).stale) fresh++;
    });

    var cards = [];
    if (total) cards.push({ icon: 'coin', title: 'Отчёты свежие', value: fresh, of: total, warn: fresh < total, dots: [fresh, total], href: '#tiles' });
    if (can('sales') && pf.pct != null) cards.push({ icon: 'bars', title: 'План месяца', value: nf(pf.pct, 1), unit: '%', warn: pf.pct < 90, dots: [Math.round(pf.pct / 10), 10], href: can('finance') ? '../../owner.html' : '../../attendance.html' });
    if (can('sales') && a.yoy12 != null) cards.push({ icon: 'users', title: 'Отток за год', value: pct(a.yoy12), alarm: a.yoy12 < -10, href: '../../attendance.html' });
    if (can('staff')) {
      var c = ((L.staff || {}).critical || [])[0];
      if (c) cards.push({ icon: 'users', title: 'Укомплектованность', value: nf(c.filled, 1), unit: '%', alarm: c.filled < 60, warn: c.filled < 85, dots: [Math.round(c.filled / 10), 10], href: '../../staff.html' });
    }
    if (!cards.length) { host.remove(); return; }

    host.innerHTML = cards.map(function (c) {
      var dots = '';
      if (c.dots) for (var i = 0; i < c.dots[1]; i++) dots += '<i class="' + (i < c.dots[0] ? 'is-on' : '') + '"></i>';
      return '<a class="stat" href="' + c.href + '">' +
        '<div class="stat__top">' +
          '<span class="ico ico--ghost"><svg viewBox="0 0 24 24">' + ICON[c.icon] + '</svg></span>' +
          (c.warn || c.alarm ? '<span class="stat__flag"><svg viewBox="0 0 24 24">' +
            '<path d="M12 4.5 21 19.5H3z" fill="' + (c.alarm ? '#E4552B' : '#F0A030') + '"/>' +
            '<path d="M12 10v4.2M12 16.6v.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg></span>' : '') +
          '<span class="ico ico--soft"><svg viewBox="0 0 24 24"><path d="M8 16 16 8M9.5 8H16v6.5"/></svg></span>' +
        '</div>' +
        '<h3>' + c.title + '</h3>' +
        '<div class="stat__val">' + c.value +
          (c.of ? '<span class="stat__of">/' + c.of + '</span>' : '') +
          (c.unit ? '<span class="stat__of">' + c.unit + '</span>' : '') +
        '</div>' +
        (dots ? '<div class="stat__dots">' + dots + '</div>' : '') +
      '</a>';
    }).join('');
  }

  /* ── легенда графика переключает вторую линию ────────────────────────── */
  function bindLegend() {
    var items = document.querySelectorAll('.legend__item');
    if (items.length < 2) return;
    items[1].addEventListener('click', function () {
      var g = document.querySelector('.chart__ghost');
      if (!g) return;
      var off = items[1].classList.toggle('is-off');
      g.style.display = off ? 'none' : '';
    });
    items[0].addEventListener('click', function () {
      var l = document.querySelector('.chart__line');
      if (!l) return;
      var off = items[0].classList.toggle('is-off');
      items[0].classList.toggle('is-on', !off);
      l.style.display = off ? 'none' : '';
    });
  }

  /* ── поиск на экране «Все отчёты» ────────────────────────────────────── */
  function bindSearch() {
    var inp = document.getElementById('search');
    if (!inp) return;
    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase();
      document.querySelectorAll('.tile').forEach(function (t) {
        var name = (t.querySelector('.tile__name') || {}).textContent || '';
        t.classList.toggle('is-hidden', !!q && name.toLowerCase().indexOf(q) < 0);
      });
    });
  }

  /* ── фильтры ─────────────────────────────────────────────────────────── */
  function bindPills() {
    var pills = document.getElementById('pills');
    if (!pills) return;
    pills.addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      pills.querySelectorAll('.pill').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      var f = b.dataset.filter;
      document.querySelectorAll('.tile').forEach(function (t) {
        t.classList.toggle('is-hidden', f !== 'all' && t.dataset.group !== f);
      });
      var proj = document.getElementById('projects');
      if (proj) proj.classList.toggle('is-hidden', !(f === 'all' || f === 'projects'));
    });
  }

  /* ── док ─────────────────────────────────────────────────────────────── */
  function buildDock() {
    var dock = document.getElementById('dock');
    if (!dock) return;
    var items = REPORTS.filter(function (r) { return can(r.perm); }).slice(0, 5);
    if (items.length < 2) { dock.remove(); return; }

    var path = document.getElementById('dockPath'), svg = document.getElementById('dockSkin');
    var bead = document.getElementById('dockBead'), bicon = document.getElementById('beadIcon');
    var label = document.getElementById('dockLabel'), tabsEl = document.getElementById('dockTabs');

    items.forEach(function (it, i) {
      var b = document.createElement('button');
      b.className = 'dock__tab'; b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.setAttribute('aria-label', it.name);
      b.tabIndex = i === 0 ? 0 : -1;
      b.innerHTML = '<svg viewBox="0 0 24 24">' + ICON[it.icon] + '</svg>';
      b.addEventListener('click', function () { go(i); });
      tabsEl.appendChild(b);
    });
    var btns = Array.prototype.slice.call(tabsEl.children);

    var G = {};
    function measure() {
      var W = dock.clientWidth, H = dock.clientHeight;
      var TOP = 44, R = W < 400 ? 20 : 24;
      var beadR = W < 400 ? 21 : 25, s = W < 400 ? 13 : 17;
      var rb = beadR + 7, lift = W < 400 ? 13 : 15, by = TOP - lift;
      var delta = TOP + s - by;
      var reach = Math.sqrt(Math.max(0, (s + rb) * (s + rb) - delta * delta));
      var n = items.length;
      var pad = clamp(Math.ceil((R + reach + 12 - W / (2 * n)) / (1 - 1 / n)), 8, W * 0.22);
      tabsEl.style.padding = '0 ' + pad + 'px';
      bead.style.width = bead.style.height = (beadR * 2) + 'px';
      bead.style.marginLeft = -beadR + 'px';
      bead.style.top = (by - TOP - beadR) + 'px';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (H + TOP));
      G = { W: W, H: H + TOP, TOP: TOP, R: R, rb: rb, s: s, by: by, reach: reach };
    }
    function draw(bx) {
      var W = G.W, H = G.H, TOP = G.TOP, R = G.R, rb = G.rb, s = G.s, by = G.by, reach = G.reach;
      var cx = clamp(bx, R + reach, W - R - reach);
      var k = s / (s + rb), lx = cx - reach, rx = cx + reach;
      var pL = { x: lx + (cx - lx) * k, y: (TOP + s) + (by - (TOP + s)) * k };
      var pR = { x: rx + (cx - rx) * k, y: pL.y };
      path.setAttribute('d',
        'M 0 ' + (H - R) + ' V ' + (TOP + R) +
        ' A ' + R + ' ' + R + ' 0 0 1 ' + R + ' ' + TOP + ' L ' + lx + ' ' + TOP +
        ' A ' + s + ' ' + s + ' 0 0 1 ' + pL.x.toFixed(2) + ' ' + pL.y.toFixed(2) +
        ' A ' + rb + ' ' + rb + ' 0 0 1 ' + pR.x.toFixed(2) + ' ' + pR.y.toFixed(2) +
        ' A ' + s + ' ' + s + ' 0 0 1 ' + rx + ' ' + TOP + ' L ' + (W - R) + ' ' + TOP +
        ' A ' + R + ' ' + R + ' 0 0 1 ' + W + ' ' + (TOP + R) + ' V ' + (H - R) +
        ' A ' + R + ' ' + R + ' 0 0 1 ' + (W - R) + ' ' + H + ' L ' + R + ' ' + H +
        ' A ' + R + ' ' + R + ' 0 0 1 0 ' + (H - R) + ' Z');
    }

    var idx = 0, x = 0, target = 0, v = 0, raf = 0, dragging = false;
    function centerOf(i) {
      var r = btns[i].getBoundingClientRect(), d = dock.getBoundingClientRect();
      return r.left - d.left + r.width / 2;
    }
    function render() {
      draw(x);
      var lean = clamp(v * 0.55, -14, 14);
      var sq = 1 + Math.min(Math.abs(v) * 0.006, 0.09);
      bead.style.transform = 'translateX(' + x.toFixed(2) + 'px) skewX(' + (-lean).toFixed(2) +
                             'deg) scale(' + sq.toFixed(3) + ',' + (2 - sq).toFixed(3) + ')';
      label.style.transform = 'translateX(calc(-50% + ' + x.toFixed(2) + 'px))';
    }
    function tick() {
      v += (target - x) * 0.16; v *= 0.74; x += v; render();
      if (dragging || Math.abs(target - x) > 0.15 || Math.abs(v) > 0.15) raf = requestAnimationFrame(tick);
      else { x = target; v = 0; render(); raf = 0; }
    }
    function spring() { if (!raf) raf = requestAnimationFrame(tick); }
    function select(i, animate) {
      idx = i;
      btns.forEach(function (b, j) {
        b.setAttribute('aria-selected', j === i ? 'true' : 'false');
        b.tabIndex = j === i ? 0 : -1;
      });
      bicon.innerHTML = ICON[items[i].icon];
      label.textContent = items[i].name;
      target = centerOf(i);
      if (animate && !REDUCED) spring(); else { x = target; v = 0; render(); }
    }
    function go(i) {
      select(i, true);
      setTimeout(function () { window.location.href = items[i].href; }, REDUCED ? 0 : 280);
    }

    bead.addEventListener('pointerdown', function (e) {
      dragging = true; dock.classList.add('is-dragging');
      bead.setPointerCapture(e.pointerId); spring(); e.preventDefault();
    });
    bead.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var d = dock.getBoundingClientRect();
      target = clamp(e.clientX - d.left, 0, d.width);
      var near = 0, bd = Infinity;
      btns.forEach(function (b, j) { var dd = Math.abs(centerOf(j) - target); if (dd < bd) { bd = dd; near = j; } });
      label.textContent = items[near].name;
      bicon.innerHTML = ICON[items[near].icon];
    });
    function drop() {
      if (!dragging) return;
      dragging = false; dock.classList.remove('is-dragging');
      var best = 0, bd = Infinity;
      btns.forEach(function (b, j) { var dd = Math.abs(centerOf(j) - x); if (dd < bd) { bd = dd; best = j; } });
      select(best, true);
    }
    bead.addEventListener('pointerup', drop);
    bead.addEventListener('pointercancel', drop);
    bead.addEventListener('dblclick', function () { go(idx); });
    tabsEl.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); var n = (idx + d + items.length) % items.length; select(n, true); btns[n].focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(idx); }
    });

    measure(); select(0, false);
    requestAnimationFrame(function () { dock.classList.add('on'); });
    addEventListener('resize', function () { measure(); target = centerOf(idx); x = target; v = 0; render(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); target = centerOf(idx); x = target; render(); });
    }
  }

  /* ── сборка страницы ─────────────────────────────────────────────────── */
  function render() {
    resolveWho();
    buildWhoSwitch();

    var host = document.getElementById('tiles');
    if (host) {
      REPORTS.forEach(function (r) { host.appendChild(makeTile(r)); });
      tilt(host);
    }

    var proj = document.getElementById('projects');
    if (proj) {
      if (!can('projects')) {
        proj.innerHTML = '<div class="proj proj--locked">' +
          '<span class="ico ico--ghost"><svg viewBox="0 0 24 24">' + ICON.lock + '</svg></span>' +
          '<span class="proj__txt"><b>Проекты</b><span>доступ закрыт для роли ' + WHO.role + '</span></span></div>';
      } else {
        PROJECTS.forEach(function (p) { proj.appendChild(makeProject(p)); });
      }
    }

    var alertCount = document.getElementById('alertCount');
    if (alertCount) {
      var warn = 0;
      REPORTS.forEach(function (r) {
        if (!can(r.perm)) return;
        var st = (L.reports || {})[r.key] || {};
        if (st.status === 'warn' || st.status === 'alarm' || freshness(r, st.lastUpdate).stale) warn++;
      });
      alertCount.textContent = warn;
    }

    paintHero();
    paintToday();
    paintChart();
    bindLegend();
    paintStats();
    bindPills();
    bindSearch();
    buildDock();
  }

  fetch('../../live.json?t=' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (d) { L = d; render(); })
    .catch(function (e) {
      var host = document.getElementById('tiles') || document.body;
      host.innerHTML = '<div class="chart__empty">Не удалось загрузить live.json — ' + e.message + '</div>';
    });
})();
