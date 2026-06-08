/**
 * api.js — клиентский хелпер для общения с backend (chat_server.py).
 *
 * Что делает:
 *   - Discover API URL из /api_url.json (с кэшем 5 мин)
 *   - login(login, password) → сохраняет session в localStorage
 *   - checkSession() → проверяет валидность токена через /api/auth/me
 *   - requireAuth({permission?}) → редирект на login.html если не залогинен / нет permission
 *   - logout() → чистит localStorage + редирект
 *   - apiPost/apiGet — обёртки с авто-токеном
 *
 * Используется на login.html и всех страницах дашбордов.
 */
(function (global) {
  'use strict';

  const SESSION_KEY = 'baden_session';
  const API_URL_CACHE_KEY = 'baden_api_url';
  const API_URL_CACHE_TTL = 5 * 60 * 1000; // 5 минут
  const LOGIN_PAGE = '/DaniilK-baden-uktus/login.html'; // GitHub Pages base path
  const REPORTS_PAGE = '/DaniilK-baden-uktus/reports.html';

  // ── API URL discovery ─────────────────────────────────────────────────
  async function getApiUrl(forceRefresh) {
    if (!forceRefresh) {
      try {
        const cached = JSON.parse(localStorage.getItem(API_URL_CACHE_KEY) || 'null');
        if (cached && cached.url && (Date.now() - cached.ts) < API_URL_CACHE_TTL) {
          return cached.url;
        }
      } catch (_) {}
    }
    // Pages-relative URL of api_url.json (works on both GitHub Pages and local)
    const pagesUrl = new URL('api_url.json', window.location.origin + window.location.pathname.replace(/[^\/]*$/, '')).toString();
    // Fallback: try root of repo
    const rootUrl = window.location.origin + (window.location.pathname.split('/')[1] ? '/' + window.location.pathname.split('/')[1] + '/api_url.json' : '/api_url.json');
    for (const url of [pagesUrl, rootUrl]) {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (j.url) {
            localStorage.setItem(API_URL_CACHE_KEY, JSON.stringify({ url: j.url, ts: Date.now() }));
            return j.url;
          }
        }
      } catch (_) {}
    }
    throw new Error('Не удалось получить API URL — api_url.json недоступен');
  }

  // ── Session storage ───────────────────────────────────────────────────
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }
  function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  // ── HTTP helpers ──────────────────────────────────────────────────────
  // Признак "URL устарел / туннель мёртв" — стоит сбросить кэш и попробовать заново
  function _isStaleUrlError(err, response) {
    if (err && err instanceof TypeError) return true; // network error, CORS, DNS
    if (response && [502, 503, 504, 530].includes(response.status)) return true; // CF tunnel errors
    return false;
  }

  async function _request(method, path, body, { auth = true, _retry = false } = {}) {
    const apiUrl = await getApiUrl(_retry);  // на ретрае — форсируем свежий URL
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (auth) {
      const s = getSession();
      if (s && s.token) headers['Authorization'] = 'Bearer ' + s.token;
    }
    let r;
    try {
      r = await fetch(apiUrl + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      if (!_retry && _isStaleUrlError(e)) {
        console.warn('[api] network error, refreshing API URL and retrying', e.message);
        return _request(method, path, body, { auth, _retry: true });
      }
      throw e;
    }
    if (!_retry && _isStaleUrlError(null, r)) {
      console.warn('[api] HTTP', r.status, '— refreshing API URL and retrying');
      return _request(method, path, body, { auth, _retry: true });
    }
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = { error: text }; }
    if (!r.ok) {
      const err = new Error(data.error || ('HTTP ' + r.status));
      err.status = r.status;
      throw err;
    }
    return data;
  }

  async function apiPost(path, body, opts) {
    return _request('POST', path, body, opts);
  }
  async function apiGet(path, opts) {
    return _request('GET', path, null, opts);
  }

  // ── Auth methods ──────────────────────────────────────────────────────
  async function login(loginName, password) {
    const data = await apiPost('/api/auth/login',
      { login: loginName, password },
      { auth: false }
    );
    setSession({
      token:       data.token,
      user:        data.user,
      permissions: data.permissions,
      expires_at:  data.expires_at,
    });
    return data;
  }

  async function checkSession() {
    const s = getSession();
    if (!s || !s.token) return null;
    try {
      const me = await apiGet('/api/auth/me');
      // refresh local permissions in case they changed on server
      setSession({ ...s, user: me.user, permissions: me.permissions });
      return me;
    } catch (e) {
      if (e.status === 401) clearSession();
      return null;
    }
  }

  async function logout() {
    const s = getSession();
    if (s && s.token) {
      try { await apiPost('/api/auth/logout', {}); } catch (_) {}
    }
    clearSession();
    window.location.href = LOGIN_PAGE;
  }

  /**
   * Защитить страницу. Вызывать вверху каждого закрытого отчёта.
   * Если не залогинен или нет нужного permission — редиректит.
   * @param {Object} opts
   * @param {string} [opts.permission] — 'finance', 'sales' и т.д. Если не задано — просто требует логин.
   */
  async function requireAuth(opts = {}) {
    const s = getSession();
    if (!s || !s.token) {
      window.location.href = LOGIN_PAGE + '?next=' + encodeURIComponent(window.location.pathname);
      throw new Error('not-authenticated');
    }
    // Проверяем permission локально по сохранённой сессии
    if (opts.permission && !s.permissions[opts.permission]) {
      window.location.href = REPORTS_PAGE + '?forbidden=' + encodeURIComponent(opts.permission);
      throw new Error('forbidden');
    }
    // Опционально — фоновая проверка, что токен ещё валиден на сервере
    if (opts.verify !== false) {
      checkSession().then(me => {
        if (!me) {
          window.location.href = LOGIN_PAGE + '?expired=1';
        }
      });
    }
    return s;
  }

  // ── Export ────────────────────────────────────────────────────────────
  global.BadenAuth = {
    getApiUrl,
    getSession, setSession, clearSession,
    apiPost, apiGet,
    login, logout, checkSession, requireAuth,
  };
})(window);
