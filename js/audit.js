/**
 * audit.js — авто-трекинг страниц для аудит-логирования.
 *
 * Подключение:
 *   <script src="js/api.js"></script>
 *   <script src="js/audit.js"></script>
 *
 * Авто-логирует:
 *   - page_view при загрузке страницы
 *   - chat_open / chat_question при работе с AI-виджетом (если он есть)
 *   - anomaly_explain при клике на аномалию
 *   - dashboard_export если есть кнопка экспорта (на будущее)
 *
 * Использует navigator.sendBeacon — не блокирует загрузку, не блокирует unload.
 * Если sendBeacon не доступен — fallback на fetch с keepalive.
 */
(function (global) {
  'use strict';

  let cachedApiUrl = null;
  async function getApiUrl() {
    if (cachedApiUrl) return cachedApiUrl;
    if (window.BadenAuth && BadenAuth.getApiUrl) {
      try { cachedApiUrl = await BadenAuth.getApiUrl(); } catch (_) {}
    }
    if (!cachedApiUrl) {
      // Fallback — читаем api_url.json напрямую
      try {
        const u = new URL('api_url.json', window.location.origin + window.location.pathname.replace(/[^\/]*$/, ''));
        const r = await fetch(u, { cache: 'no-store' });
        const j = await r.json();
        cachedApiUrl = j.url;
      } catch (_) {}
    }
    return cachedApiUrl;
  }

  /**
   * Отправить событие в audit log.
   * @param {string} type — короткий идентификатор события (под 60 символов)
   * @param {object} [meta] — произвольные доп. данные
   */
  async function log(type, meta) {
    try {
      const apiUrl = await getApiUrl();
      if (!apiUrl) return;
      const session = BadenAuth ? BadenAuth.getSession() : null;
      const payload = {
        type: String(type).slice(0, 60),
        page: location.pathname,
        meta: meta || null,
      };
      const url = apiUrl + '/api/audit/event';
      const body = JSON.stringify(payload);

      // sendBeacon — не блокирует, работает даже при unload
      if (navigator.sendBeacon && !session) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      }

      // Если есть сессия, надо передать токен — sendBeacon не поддерживает заголовки.
      // Используем fetch с keepalive (тоже не блокирует unload).
      const headers = { 'Content-Type': 'application/json' };
      if (session && session.token) headers['Authorization'] = 'Bearer ' + session.token;
      fetch(url, {
        method: 'POST',
        headers,
        body,
        keepalive: true,
      }).catch(() => { /* silent */ });
    } catch (_) {
      /* silent — аудит не должен влиять на UX */
    }
  }

  // Авто-page_view сразу при загрузке
  // Подождём 100мс — даст шанс BadenAuth/api_url.json подтянуться
  function autoPageView() {
    const meta = {
      title: document.title || '',
      referrer: document.referrer || null,
    };
    log('page_view', meta);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(autoPageView, 150));
  } else {
    setTimeout(autoPageView, 150);
  }

  // Хук на чат-виджет: если он откроется, лог чат-вьюва.
  // Виджет на DOM создаёт элемент .bc-btn (кнопка).
  let chatTrackingHooked = false;
  function hookChatTracking() {
    if (chatTrackingHooked) return;
    const btn = document.querySelector('.bc-btn');
    if (!btn) return;
    chatTrackingHooked = true;
    btn.addEventListener('click', () => {
      const panel = document.querySelector('.bc-panel');
      const wasOpen = panel && panel.classList.contains('open');
      // через 50мс state уже сменён виджетом
      setTimeout(() => {
        const nowOpen = panel && panel.classList.contains('open');
        if (nowOpen && !wasOpen) log('chat_open');
      }, 80);
    });
  }
  // Виджет создаётся асинхронно, проверяем периодически 5 сек
  let chatHookAttempts = 0;
  const chatHookInterval = setInterval(() => {
    if (document.querySelector('.bc-btn')) {
      hookChatTracking();
      clearInterval(chatHookInterval);
    }
    if (++chatHookAttempts > 25) clearInterval(chatHookInterval); // 5 сек
  }, 200);

  // ── Public API ───────────────────────────────────────────────────────
  global.BadenAudit = { log };
})(window);
