/* ─────────────────────────────────────────────────────────────────────────
   Лаборатория Baden Uktus. Ванильный JS без зависимостей — всё, что здесь
   понравится, переносится в reports.html как есть.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE    = matchMedia('(pointer: fine)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ═══════════════════ 01 · ДОК С КАПЛЕЙ ═══════════════════════════════ */

  var ICONS = {
    coin:  '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.6 10h3.4a1.8 1.8 0 0 1 0 3.6h-2.6a1.8 1.8 0 0 0 0 3.6h3.6"/>',
    chart: '<path d="M4 19V5M4 19h16"/><path d="M8 15l3.5-4 3 2.4L20 8"/>',
    wave:  '<path d="M3 14c2.5 0 2.5-5 5-5s2.5 5 5 5 2.5-5 5-5 2.5 5 3 5"/><path d="M3 19h18"/>',
    users: '<path d="M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11Z"/><path d="M2.5 19c0-3 2.9-4.8 6.5-4.8s6.5 1.8 6.5 4.8"/><path d="M16.5 11.4a3 3 0 0 0 0-6"/><path d="M18 14.6c2.1.6 3.5 1.9 3.5 4.4"/>',
    eye:   '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    calc:  '<rect x="5" y="3.5" width="14" height="17" rx="2.4"/><path d="M8.5 8h7M8.5 12h2M13.5 12h2M8.5 16h2M13.5 16h2"/>'
  };

  var TABS = [
    { key: 'finance',  name: 'БДДС',        icon: 'coin',  num: '3,26 млн ₽',  lbl: 'поступления за 17.08' },
    { key: 'sales',    name: 'Продажи',     icon: 'chart', num: '1,687 млн ₽', lbl: 'выручка вчера · 977 гостей' },
    { key: 'forecast', name: 'Прогноз',     icon: 'wave',  num: '~1001',       lbl: 'гостей ждём сегодня' },
    { key: 'churn',    name: 'Посещения',   icon: 'users', num: '−11,7%',      lbl: 'отток за 12 месяцев' },
    { key: 'owner',    name: 'Собственник', icon: 'eye',   num: '93,2%',       lbl: 'плана месяца закрыто' },
    { key: 'calc',     name: 'Калькулятор', icon: 'calc',  num: '+300 ₽',      lbl: 'прайс с 23.07' }
  ];

  function initDock() {
    var dock   = document.getElementById('dockEl');
    var svg    = document.getElementById('dockSkin');
    var path   = document.getElementById('dockPath');
    var bead   = document.getElementById('dockBead');
    var bicon  = document.getElementById('beadIcon');
    var tabsEl = document.getElementById('dockTabs');
    var label  = document.getElementById('dockLabel');
    var screen = document.getElementById('dockScreen');
    var sNum   = document.getElementById('dockScreenNum');
    var sLbl   = document.getElementById('dockScreenLbl');
    if (!dock) return;

    // кнопки
    TABS.forEach(function (t, i) {
      var b = document.createElement('button');
      b.className = 'dock__tab';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.setAttribute('aria-label', t.name);
      b.tabIndex = i === 0 ? 0 : -1;
      b.innerHTML = '<svg viewBox="0 0 24 24">' + ICONS[t.icon] + '</svg>';
      b.addEventListener('click', function () { select(i, true); });
      tabsEl.appendChild(b);
    });
    var btns = Array.prototype.slice.call(tabsEl.children);

    // геометрия: подбираем размеры так, чтобы вырез никогда не наезжал на скруглённый угол
    var G = {};
    function measure() {
      var W = dock.clientWidth, H = dock.clientHeight;
      var TOP = 46, R = W < 430 ? 22 : 26;
      var beadR = W < 430 ? 21 : 26;
      var s     = W < 430 ? 13 : 18;
      var rb    = beadR + 7;                     // зазор между каплей и кромкой выреза
      var lift  = W < 430 ? 13 : 16;             // насколько центр капли выше кромки
      var by    = TOP - lift;
      var delta = TOP + s - by;
      var reach = Math.sqrt(Math.max(0, (s + rb) * (s + rb) - delta * delta));
      // отступ вкладок: центр крайней вкладки должен отстоять от угла хотя бы на reach
      var n = TABS.length;
      // +14 — чтобы у крайних вкладок между вырезом и скруглением остался прямой участок
      var pad = Math.ceil((R + reach + 14 - W / (2 * n)) / (1 - 1 / n));
      pad = clamp(pad, 8, W * 0.22);
      tabsEl.style.padding = '0 ' + pad + 'px';
      bead.style.width = bead.style.height = (beadR * 2) + 'px';
      bead.style.marginLeft = -beadR + 'px';
      bead.style.top = (by - TOP - beadR) + 'px';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (H + TOP));
      G = { W: W, H: H + TOP, TOP: TOP, R: R, rb: rb, s: s, by: by, reach: reach };
    }

    // одна параметрическая кривая: плечо — окружность, касательная и к кромке, и к чаше
    function draw(bx) {
      var W = G.W, H = G.H, TOP = G.TOP, R = G.R, rb = G.rb, s = G.s, by = G.by, reach = G.reach;
      var cx = clamp(bx, R + reach, W - R - reach);
      var k = s / (s + rb);
      var lx = cx - reach, rx = cx + reach;
      var pL = { x: lx + (cx - lx) * k, y: (TOP + s) + (by - (TOP + s)) * k };
      var pR = { x: rx + (cx - rx) * k, y: pL.y };
      path.setAttribute('d',
        'M 0 ' + (H - R) +
        ' V ' + (TOP + R) +
        ' A ' + R + ' ' + R + ' 0 0 1 ' + R + ' ' + TOP +
        ' L ' + lx + ' ' + TOP +
        ' A ' + s + ' ' + s + ' 0 0 1 ' + pL.x.toFixed(2) + ' ' + pL.y.toFixed(2) +
        ' A ' + rb + ' ' + rb + ' 0 0 1 ' + pR.x.toFixed(2) + ' ' + pR.y.toFixed(2) +
        ' A ' + s + ' ' + s + ' 0 0 1 ' + rx + ' ' + TOP +
        ' L ' + (W - R) + ' ' + TOP +
        ' A ' + R + ' ' + R + ' 0 0 1 ' + W + ' ' + (TOP + R) +
        ' V ' + (H - R) +
        ' A ' + R + ' ' + R + ' 0 0 1 ' + (W - R) + ' ' + H +
        ' L ' + R + ' ' + H +
        ' A ' + R + ' ' + R + ' 0 0 1 0 ' + (H - R) + ' Z');
    }

    var idx = 0, x = 0, target = 0, v = 0, raf = 0, dragging = false;

    function centerOf(i) {
      var r = btns[i].getBoundingClientRect(), d = dock.getBoundingClientRect();
      return r.left - d.left + r.width / 2;
    }

    function render() {
      draw(x);
      // капля кренится по ходу движения, набегающий край поджимается
      var lean = clamp(v * 0.55, -14, 14);
      var sq = 1 + Math.min(Math.abs(v) * 0.006, 0.09);
      bead.style.transform = 'translateX(' + x.toFixed(2) + 'px) skewX(' + (-lean).toFixed(2) + 'deg) scale(' + sq.toFixed(3) + ',' + (2 - sq).toFixed(3) + ')';
      label.style.transform = 'translateX(calc(-50% + ' + x.toFixed(2) + 'px))';
    }

    function tick() {
      v += (target - x) * 0.16;
      v *= 0.74;
      x += v;
      render();
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
      bicon.innerHTML = ICONS[TABS[i].icon];
      label.textContent = TABS[i].name;
      sNum.textContent = TABS[i].num;
      sLbl.textContent = TABS[i].lbl;
      screen.classList.remove('swap'); void screen.offsetWidth; screen.classList.add('swap');
      target = centerOf(i);
      if (animate && !REDUCED) spring();
      else { x = target; v = 0; render(); }
    }

    // перетаскивание капли
    bead.addEventListener('pointerdown', function (e) {
      dragging = true;
      bead.setPointerCapture(e.pointerId);
      spring();
      e.preventDefault();
    });
    bead.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var d = dock.getBoundingClientRect();
      target = clamp(e.clientX - d.left, 0, d.width);
    });
    function drop() {
      if (!dragging) return;
      dragging = false;
      var best = 0, bd = Infinity;
      btns.forEach(function (b, j) { var dd = Math.abs(centerOf(j) - x); if (dd < bd) { bd = dd; best = j; } });
      select(best, true);
    }
    bead.addEventListener('pointerup', drop);
    bead.addEventListener('pointercancel', drop);

    // клавиатура
    tabsEl.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = (idx + d + TABS.length) % TABS.length;
      select(n, true);
      btns[n].focus();
    });

    measure(); select(0, false);
    addEventListener('resize', function () { measure(); target = centerOf(idx); x = target; v = 0; render(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); target = centerOf(idx); x = target; render(); });
    }
  }

  /* ═══════════════════ 02 · ОЖИВШИЕ КАРТОЧКИ ══════════════════════════ */

  function initCards() {
    var wrap = document.getElementById('labCards');
    if (!wrap) return;
    var cards = Array.prototype.slice.call(wrap.querySelectorAll('.lcard'));

    // золото по краю ведёт курсор + наклон с инерцией
    cards.forEach(function (c) {
      c.style.setProperty('--acc', c.dataset.accent);
      var tx = 0, ty = 0, cx = 0, cy = 0, vx = 0, vy = 0, raf = 0, live = false;

      function frame() {
        vx += (tx - cx) * 0.18; vx *= 0.76; cx += vx;
        vy += (ty - cy) * 0.18; vy *= 0.76; cy += vy;
        c.style.transform = 'perspective(900px) rotateX(' + cy.toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
        if (live || Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02 || Math.abs(vx) > 0.02 || Math.abs(vy) > 0.02) {
          raf = requestAnimationFrame(frame);
        } else { c.style.transform = ''; raf = 0; }
      }
      function run() { if (!raf && !REDUCED) raf = requestAnimationFrame(frame); }

      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (px * 100) + '%');
        c.style.setProperty('--my', (py * 100) + '%');
        // угол золотой каймы = направление на курсор из центра
        var ang = Math.atan2(py - 0.5, px - 0.5) * 180 / Math.PI + 90;
        c.style.setProperty('--ang', ang.toFixed(1) + 'deg');
        live = true; tx = (px - 0.5) * 16; ty = -(py - 0.5) * 16; run();
      });
      c.addEventListener('pointerleave', function () { live = false; tx = 0; ty = 0; run(); });
      c.addEventListener('click', function (e) { e.preventDefault(); expand(c); });
    });

    // цифры набегают при появлении
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        countUp(en.target);
      });
    }, { threshold: 0.4 });
    wrap.querySelectorAll('.count').forEach(function (el) { io.observe(el); });

    function countUp(el) {
      var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec, 10) || 0;
      if (REDUCED) { el.textContent = fmt(to, dec); return; }
      var t0 = performance.now(), dur = 950;
      (function step(now) {
        var p = clamp((now - t0) / dur, 0, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e, dec);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
    function fmt(v, d) {
      var p = v.toFixed(d).split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');   // 1687 → 1 687
      return p.join(',');
    }

    // перетекание карточки в полный экран (FLIP)
    var SHEETS = {
      finance: { h: 'БДДС', p: 'Бюджет движения денежных средств: поступления, платежи, остатки по месяцам и прогноз закрытия.', rows: [['Поступило за 17.08', '3,26 млн ₽'], ['План месяца', '38,80 млн ₽'], ['Факт месяца', '36,15 млн ₽'], ['Закрытие месяца, прогноз', '93,2%']] },
      sales:   { h: 'Продажи', p: 'Выручка, средний чек и динамика по услугам: Термаль, СПА, Резиденция, Ресторан.', rows: [['Выручка вчера', '1,687 млн ₽'], ['Гостей вчера', '977'], ['Средний чек', '1 727 ₽'], ['К прошлой неделе', '−10,4%']] },
      churn:   { h: 'Статистика посещений', p: 'Посещаемость и отток гостей 2023–2026: скользящий год, тарифы, дни недели, платёжный микс.', rows: [['Отток за 12 мес', '−11,7%'], ['Год назад', '−9,4%'], ['Гостей за 12 мес', '284 500'], ['Повторных визитов', '38,1%']] }
    };

    var openSheet = null, openCard = null, scrim = null;

    function expand(card) {
      if (openSheet) return;
      var d = SHEETS[card.dataset.key];
      var r = card.getBoundingClientRect();

      scrim = document.createElement('div');
      scrim.className = 'scrim';
      scrim.addEventListener('click', collapse);
      document.body.appendChild(scrim);
      requestAnimationFrame(function () { scrim.classList.add('on'); });

      var w = Math.min(720, innerWidth - 40), h = Math.min(520, innerHeight - 80);
      var left = (innerWidth - w) / 2, top = (innerHeight - h) / 2;

      var sheet = document.createElement('div');
      sheet.className = 'sheet';
      sheet.style.cssText = 'left:' + left + 'px;top:' + top + 'px;width:' + w + 'px;height:' + h + 'px;transform-origin:0 0;';
      sheet.innerHTML =
        '<button class="sheet__close" type="button" aria-label="Закрыть">×</button>' +
        '<h3>' + d.h + '</h3><p>' + d.p + '</p>' +
        '<div class="sheet__rows">' + d.rows.map(function (x) {
          return '<div class="sheet__row"><span>' + x[0] + '</span><span>' + x[1] + '</span></div>';
        }).join('') + '</div>';
      sheet.querySelector('.sheet__close').addEventListener('click', collapse);
      document.body.appendChild(sheet);

      var from = 'translate(' + (r.left - left) + 'px,' + (r.top - top) + 'px) scale(' + (r.width / w) + ',' + (r.height / h) + ')';
      var dur = REDUCED ? 1 : 460;
      sheet.animate([{ transform: from, opacity: 0.5 }, { transform: 'none', opacity: 1 }],
        { duration: dur, easing: 'cubic-bezier(0.22,1,0.36,1)' });
      sheet.querySelectorAll('h3,p,.sheet__rows').forEach(function (el, i) {
        el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
          { duration: dur, delay: REDUCED ? 0 : 120 + i * 60, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'backwards' });
      });

      card.style.visibility = 'hidden';
      openSheet = sheet; openCard = card;
      addEventListener('keydown', esc);
      sheet.querySelector('.sheet__close').focus();
    }

    function collapse() {
      if (!openSheet) return;
      var sheet = openSheet, card = openCard;
      openSheet = null; openCard = null;
      removeEventListener('keydown', esc);
      var r = card.getBoundingClientRect(), s = sheet.getBoundingClientRect();
      var to = 'translate(' + (r.left - s.left) + 'px,' + (r.top - s.top) + 'px) scale(' + (r.width / s.width) + ',' + (r.height / s.height) + ')';
      var dur = REDUCED ? 1 : 380;
      scrim.classList.remove('on');
      var a = sheet.animate([{ transform: 'none', opacity: 1 }, { transform: to, opacity: 0.4 }],
        { duration: dur, easing: 'cubic-bezier(0.5,0,0.75,0)' });
      a.onfinish = function () {
        sheet.remove(); scrim.remove(); card.style.visibility = '';
      };
    }
    function esc(e) { if (e.key === 'Escape') collapse(); }
  }

  /* ═══════════════════ 03 · ОРБИТА СВЕЖЕСТИ ═══════════════════════════ */

  var ORBITS = [
    { name: 'БДДС',       slots: [600, 1080], last: 604, hourly: false },
    { name: 'Продажи',    slots: [600, 1080], last: 602, hourly: false },
    { name: 'Лояльность', slots: null,        last: 545, hourly: true  }
  ];

  function initOrbit() {
    var host = document.getElementById('orbits');
    var input = document.getElementById('clock');
    var out = document.getElementById('clockOut');
    if (!host) return;

    var C = 2 * Math.PI * 22;
    ORBITS.forEach(function (o, i) {
      var el = document.createElement('div');
      el.className = 'orbit';
      el.innerHTML =
        '<div class="orbit__ring">' +
          '<svg viewBox="0 0 58 58">' +
            '<circle class="orbit__track orbit__spin" cx="29" cy="29" r="22"/>' +
            '<circle class="orbit__prog" cx="29" cy="29" r="22" transform="rotate(-90 29 29)" ' +
              'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/>' +
          '</svg>' +
          '<div class="orbit__pip"></div>' +
        '</div>' +
        '<div><div class="orbit__name">' + o.name + '</div><div class="orbit__state"></div></div>';
      host.appendChild(el);
      o.el = el;
      o.prog = el.querySelector('.orbit__prog');
      o.pip = el.querySelector('.orbit__pip');
      o.state = el.querySelector('.orbit__state');
    });

    function hhmm(m) {
      m = ((m % 1440) + 1440) % 1440;
      return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    }

    function paint(now) {
      out.textContent = hhmm(now);
      ORBITS.forEach(function (o) {
        var prev, next;
        if (o.hourly) { prev = Math.floor(now / 60) * 60; next = prev + 60; }
        else {
          var s = o.slots;
          prev = s[0]; next = s[0] + 1440;
          for (var i = 0; i < s.length; i++) {
            if (s[i] <= now) prev = s[i];
            if (s[i] > now) { next = s[i]; break; }
          }
          if (now < s[0]) { prev = s[s.length - 1] - 1440; next = s[0]; }
        }
        var p = clamp((now - prev) / (next - prev), 0, 1);
        // просрочка: данные старше, чем один полный цикл обновления плюс час форы
        var stale = (now - o.last) > (next - prev) + 60;
        o.prog.setAttribute('stroke-dashoffset', (C * (1 - p)).toFixed(1));
        o.el.classList.toggle('is-stale', stale);
        o.pip.textContent = stale ? '⚠' : hhmm(next - now).replace(/^0/, '');
        o.state.textContent = stale
          ? 'не обновлялось с ' + hhmm(o.last)
          : 'свежее · с ' + hhmm(o.last);
      });
    }

    input.addEventListener('input', function () { paint(+input.value); });
    paint(+input.value);
  }

  /* ═══════════════════ 04 · ЖИВОЙ ВХОД ════════════════════════════════ */

  function initLogin() {
    var form = document.getElementById('lform');
    if (!form) return;
    var fl = document.getElementById('f-login'), fp = document.getElementById('f-pass');
    var socket = document.getElementById('socket'), cta = document.getElementById('cta');
    var status = document.getElementById('lstatus'), eye = document.getElementById('eye');
    var okLogin = false, okPass = false;

    function check() {
      okLogin = fl.value.trim().length >= 3;
      okPass = fp.value.length >= 4;
      fl.closest('.field').classList.toggle('is-ok', okLogin);
      fp.closest('.field').classList.toggle('is-ok', okPass);
      var ready = okLogin && okPass;
      form.classList.toggle('is-ready', ready);
      cta.setAttribute('aria-disabled', ready ? 'false' : 'true');
      if (ready) { tx = 0; ty = 0; run(); }
    }
    fl.addEventListener('input', check);
    fp.addEventListener('input', check);

    eye.addEventListener('click', function () {
      var show = fp.type === 'password';
      fp.type = show ? 'text' : 'password';
      eye.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
    });

    // кнопка-убегайка: только мышь, только пока форма не готова
    var tx = 0, ty = 0, cx = 0, cy = 0, vx = 0, vy = 0, raf = 0;
    function frame() {
      vx += (tx - cx) * 0.2; vx *= 0.72; cx += vx;
      vy += (ty - cy) * 0.2; vy *= 0.72; cy += vy;
      cta.style.transform = 'translate(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px)';
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1 || Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        raf = requestAnimationFrame(frame);
      } else { cta.style.transform = tx || ty ? cta.style.transform : ''; raf = 0; }
    }
    function run() { if (!raf && !REDUCED) raf = requestAnimationFrame(frame); else if (REDUCED) cta.style.transform = ''; }

    if (FINE && !REDUCED) {
      socket.addEventListener('pointermove', function (e) {
        if (form.classList.contains('is-ready')) return;
        var s = socket.getBoundingClientRect(), b = cta.getBoundingClientRect();
        var bx = b.left + b.width / 2, by = b.top + b.height / 2;
        var dx = bx - e.clientX, dy = by - e.clientY;
        var dist = Math.hypot(dx, dy) || 1;
        if (dist > b.width * 0.75) return;             // ещё далеко — стоим на месте
        var push = (b.width * 0.75 - dist) * 1.5;
        // свобода хода внутри сокета; упёрлись по одной оси — уходим по другой
        var freeX = (s.width - b.width) / 2 - 6, freeY = (s.height - b.height) / 2 - 5;
        tx = clamp(cx + dx / dist * push, -freeX, freeX);
        ty = clamp(cy + dy / dist * push, -freeY, freeY);
        if (Math.abs(tx) >= freeX - 0.5) ty = clamp(ty + (dy > 0 ? push : -push), -freeY, freeY);
        run();
      });
      socket.addEventListener('pointerleave', function () { tx = 0; ty = 0; run(); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.classList.contains('is-ready')) {
        status.className = 'lform__status';
        status.textContent = okLogin ? 'Пароль — от 4 символов' : 'Логин — от 3 символов';
        socket.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
                        { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }],
                       { duration: REDUCED ? 1 : 260, easing: 'ease-out' });
        return;
      }
      cta.classList.add('is-busy');
      status.className = 'lform__status';
      status.textContent = 'Заходим…';
      setTimeout(function () {
        cta.classList.remove('is-busy');
        status.className = 'lform__status ok';
        status.textContent = 'Готово — на портале здесь был бы переход к отчётам';
      }, 1100);
    });

    check();
  }

  /* ═══════════════════ Тема ═══════════════════════════════════════════ */

  function initTheme() {
    var btn = document.getElementById('themeBtn');
    var root = document.documentElement;
    function sync() {
      var dark = root.getAttribute('data-theme') !== 'light';
      btn.textContent = dark ? 'Светлая тема' : 'Тёмная тема';
    }
    btn.addEventListener('click', function () {
      root.setAttribute('data-theme', root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
      sync();
    });
    sync();
  }

  initDock();
  initCards();
  initOrbit();
  initLogin();
  initTheme();
})();
