/**
 * anomalies.js — Анализ выбросов в таблицах дашбордов + Claude-объяснения.
 *
 * Зависит от: js/api.js (BadenAuth.apiPost).
 *
 * Подключение в дашборде:
 *   <script src="js/api.js"></script>
 *   <script src="js/anomalies.js"></script>
 *   <script>
 *     BadenAnomalies.scan({
 *       reportId: 'forecast',
 *       tableSelector: 'table',
 *       dateColIdx:  0,   // колонка с датой (текст содержит ДД.ММ.ГГГГ)
 *       valueColIdx: 2,   // колонка с числом (гости/выручка/...)
 *       metric:      'Гостей',  // имя метрики для Claude
 *       rowFilter: 'tr.drow'    // опц., только определённые строки
 *     });
 *   </script>
 *
 * Алгоритм:
 *   1. Сканируем строки таблицы, парсим дату и значение
 *   2. Группируем по дню недели (DOW) — выходные сравниваются с выходными
 *   3. В каждой группе считаем медиану + IQR
 *   4. Точки с |z| > 1.5 * IQR помечаем как outliers
 *   5. Подсвечиваем строку, добавляем кликабельную иконку ❗
 *   6. По клику → Claude объясняет через /api/explain-anomaly
 */
(function (global) {
  'use strict';

  const STYLE_ID = 'baden-anomaly-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
      tr.baden-anomaly { position: relative; }
      tr.baden-anomaly.warning  > td { background: rgba(212, 184, 147, 0.10) !important; }
      tr.baden-anomaly.critical > td { background: rgba(226, 72, 108, 0.13)  !important; }
      tr.baden-anomaly > td:first-child {
        border-left: 4px solid #d4b893 !important;
        padding-left: 8px !important;
      }
      tr.baden-anomaly.critical > td:first-child {
        border-left-color: #e2486c !important;
      }
      .baden-anomaly-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 10px;
        padding: 3px 9px 3px 7px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        user-select: none;
        transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
        vertical-align: middle;
        white-space: nowrap;
        line-height: 1.2;
      }
      .baden-anomaly-badge:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      }
      .baden-anomaly-badge.warning {
        background: linear-gradient(180deg, #d4b893, #b9956a);
        color: #1a1410;
      }
      .baden-anomaly-badge.critical {
        background: linear-gradient(180deg, #e96586, #cc3a5e);
        color: #fff;
      }
      .baden-anomaly-badge::before {
        content: '⚠';
        font-size: 1.05em;
        line-height: 1;
      }
      .baden-anomaly-badge.critical::before { content: '⚠'; }

      .baden-anomaly-popup-backdrop {
        position: fixed; inset: 0; z-index: 99998;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        padding: 24px;
        animation: badenAnomalyFadeIn 0.2s ease-out;
      }
      @keyframes badenAnomalyFadeIn { from { opacity: 0; } to { opacity: 1; } }
      .baden-anomaly-popup {
        max-width: 480px; width: 100%;
        background: #14110a;
        border: 1px solid rgba(212,184,147,0.2);
        border-radius: 14px;
        padding: 28px;
        color: #f4ebdc;
        font-family: 'DM Sans', -apple-system, system-ui, sans-serif;
        box-shadow: 0 24px 60px rgba(0,0,0,0.6);
      }
      .baden-anomaly-popup__head {
        display: flex; justify-content: space-between; align-items: flex-start;
        margin-bottom: 18px;
      }
      .baden-anomaly-popup__title {
        font-family: 'Cormorant', Georgia, serif;
        font-style: italic; font-size: 22px;
        color: #d4b893;
      }
      .baden-anomaly-popup__close {
        background: transparent; border: none;
        color: rgba(244,235,220,0.5); font-size: 22px;
        cursor: pointer; line-height: 1; padding: 0 4px;
      }
      .baden-anomaly-popup__close:hover { color: #d4b893; }
      .baden-anomaly-popup__stats {
        display: grid; grid-template-columns: auto 1fr; gap: 6px 14px;
        font-size: 13px; margin-bottom: 18px;
      }
      .baden-anomaly-popup__stats dt {
        color: rgba(244,235,220,0.5);
        text-transform: uppercase;
        font-size: 10px; letter-spacing: 0.16em;
      }
      .baden-anomaly-popup__stats dd { color: #f4ebdc; margin: 0; }
      .baden-anomaly-popup__expl {
        padding: 16px;
        background: rgba(212,184,147,0.05);
        border-left: 2px solid #d4b893;
        border-radius: 4px;
        font-size: 14px; line-height: 1.55;
        white-space: pre-wrap;
        min-height: 60px;
      }
      .baden-anomaly-popup__expl.loading { color: rgba(244,235,220,0.4); font-style: italic; }
      .baden-anomaly-popup__expl.error   { color: #e07070; }
      .baden-anomaly-popup__footer {
        margin-top: 14px;
        font-size: 10px; letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(244,235,220,0.32);
        display: flex; justify-content: space-between;
      }
    `;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Math helpers ─────────────────────────────────────────────────────
  function median(arr) {
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  function quartiles(arr) {
    const s = [...arr].sort((a, b) => a - b);
    const q = (p) => {
      const pos = (s.length - 1) * p;
      const lo = Math.floor(pos), hi = Math.ceil(pos);
      if (lo === hi) return s[lo];
      return s[lo] + (s[hi] - s[lo]) * (pos - lo);
    };
    return { q1: q(0.25), q3: q(0.75) };
  }

  // ── Parsers ─────────────────────────────────────────────────────────
  // Парсит "01.05.2026 (Чт)" → { date: '01.05.2026', dow: 4 (Mon=1..Sun=7) }
  function parseDate(text) {
    if (!text) return null;
    const m = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!m) return null;
    const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
    if (isNaN(d.getTime())) return null;
    // JS day: Sun=0..Sat=6 → ru-style: Mon=1..Sun=7
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    return { dateStr: m[0], date: d, dow };
  }

  // "2 305" / "80,6" / "+12.3%" → 2305 / 80.6 / 12.3
  function parseNumber(text) {
    if (!text) return null;
    const cleaned = text.replace(/\s+/g, '').replace(',', '.').replace('%', '').replace('+', '').replace(/[^\d.\-]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }

  const DOW_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // ── Main scan ─────────────────────────────────────────────────────────
  function scan(opts) {
    injectStyles();

    const {
      reportId,
      tableSelector = 'table',
      dateColIdx,
      valueColIdx,
      metric = 'значение',
      rowFilter = null,
      iqrMultiplier = 1.5,  // классический Tukey
      minGroupSize = 4,     // в группе DOW должно быть минимум 4 значения для статистики
    } = opts;

    if (typeof dateColIdx !== 'number' || typeof valueColIdx !== 'number') {
      console.warn('[anomalies] dateColIdx/valueColIdx required');
      return;
    }

    const tables = document.querySelectorAll(tableSelector);
    if (!tables.length) {
      console.warn(`[anomalies] no tables for selector "${tableSelector}"`);
      return;
    }

    let scanned = 0, flagged = 0;

    tables.forEach(table => {
      let rows = table.querySelectorAll('tbody tr');
      if (rowFilter) rows = table.querySelectorAll(rowFilter);

      // Pass 1: собираем точки по DOW группам
      const points = [];
      rows.forEach(row => {
        const cells = row.cells;
        if (!cells || cells.length <= Math.max(dateColIdx, valueColIdx)) return;
        const dateInfo = parseDate(cells[dateColIdx].innerText);
        const value = parseNumber(cells[valueColIdx].innerText);
        if (!dateInfo || value === null) return;
        points.push({ row, dateInfo, value });
        scanned++;
      });

      // Pass 2: группируем по DOW, считаем IQR
      const groups = {};
      points.forEach(p => {
        const k = p.dateInfo.dow;
        if (!groups[k]) groups[k] = [];
        groups[k].push(p);
      });

      // Pass 3: помечаем outliers
      Object.entries(groups).forEach(([dow, groupPoints]) => {
        if (groupPoints.length < minGroupSize) return;
        const values = groupPoints.map(p => p.value);
        const med = median(values);
        const { q1, q3 } = quartiles(values);
        const iqr = q3 - q1;
        const lo = q1 - iqrMultiplier * iqr;
        const hi = q3 + iqrMultiplier * iqr;
        const critLo = q1 - 3 * iqr;
        const critHi = q3 + 3 * iqr;

        groupPoints.forEach(p => {
          if (p.value < lo || p.value > hi) {
            const isCritical = (p.value < critLo || p.value > critHi);
            const deviation = med ? ((p.value - med) / med * 100) : 0;
            const sign = deviation >= 0 ? '+' : '';
            const devStr = `${sign}${deviation.toFixed(1)}%`;
            flagAnomaly(p, {
              reportId,
              metric,
              dow: DOW_NAMES[parseInt(dow, 10)] || '?',
              baseline: med,
              deviation: devStr,
              critical: isCritical,
              groupSize: groupPoints.length,
            });
            flagged++;
          }
        });
      });
    });

    console.log(`[anomalies] scanned=${scanned} flagged=${flagged} (${reportId})`);
  }

  // ── Flag and click handler ───────────────────────────────────────────
  function flagAnomaly(point, meta) {
    point.row.classList.add('baden-anomaly');
    point.row.classList.add(meta.critical ? 'critical' : 'warning');

    // Badge — кликабельный "АНОМАЛИЯ +56%"
    const badge = document.createElement('span');
    badge.className = 'baden-anomaly-badge ' + (meta.critical ? 'critical' : 'warning');
    badge.textContent = (meta.critical ? 'КРИТ ' : 'АНОМ ') + meta.deviation;
    badge.title = `Аномалия для ${meta.dow}: ${meta.deviation} от медианы. Клик — объяснение от Claude.`;
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      showPopup(point, meta);
    });
    const target = point.row.cells[0];
    if (target && !target.querySelector('.baden-anomaly-badge')) {
      target.appendChild(badge);
    }
  }

  // ── Popup ───────────────────────────────────────────────────────────
  function showPopup(point, meta) {
    const backdrop = document.createElement('div');
    backdrop.className = 'baden-anomaly-popup-backdrop';
    backdrop.innerHTML = `
      <div class="baden-anomaly-popup" role="dialog">
        <div class="baden-anomaly-popup__head">
          <div class="baden-anomaly-popup__title">Аномалия · ${meta.dow}</div>
          <button class="baden-anomaly-popup__close" aria-label="Закрыть">×</button>
        </div>
        <dl class="baden-anomaly-popup__stats">
          <dt>Дата</dt><dd>${point.dateInfo.dateStr} (${meta.dow})</dd>
          <dt>${escapeHtml(meta.metric)}</dt><dd>${point.value.toLocaleString('ru')}</dd>
          <dt>Медиана ${meta.dow}</dt><dd>${meta.baseline.toLocaleString('ru', {maximumFractionDigits: 1})}</dd>
          <dt>Отклонение</dt><dd>${meta.deviation}</dd>
        </dl>
        <div class="baden-anomaly-popup__expl loading">Спрашиваю Claude...</div>
        <div class="baden-anomaly-popup__footer">
          <span>${meta.critical ? 'Критичная (>3·IQR)' : 'Выброс (>1.5·IQR)'}</span>
          <span></span>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('.baden-anomaly-popup__close').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    // Asking Claude
    const explEl   = backdrop.querySelector('.baden-anomaly-popup__expl');
    const footerR  = backdrop.querySelectorAll('.baden-anomaly-popup__footer span')[1];

    if (!window.BadenAuth) {
      explEl.className = 'baden-anomaly-popup__expl error';
      explEl.textContent = 'js/api.js не загружен';
      return;
    }

    BadenAuth.apiPost('/api/explain-anomaly', {
      report_id:   meta.reportId,
      date:        point.dateInfo.dateStr,
      value:       point.value,
      metric:      meta.metric,
      baseline:    meta.baseline,
      deviation:   meta.deviation,
      dow:         meta.dow,
    })
      .then(resp => {
        explEl.className = 'baden-anomaly-popup__expl';
        explEl.textContent = resp.explanation || '(пусто)';
        if (footerR) footerR.textContent = (resp.cached ? '⚡ из кэша · ' : '') + (resp.model || '');
      })
      .catch(err => {
        explEl.className = 'baden-anomaly-popup__expl error';
        explEl.textContent = 'Ошибка: ' + (err.message || err);
      });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ── Public API ───────────────────────────────────────────────────────
  global.BadenAnomalies = { scan };
})(window);
