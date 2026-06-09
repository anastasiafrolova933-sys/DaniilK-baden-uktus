/**
 * pwa.js — Service Worker registration + PWA install + Push notifications.
 *
 * Зависит от: js/api.js (BadenAuth для авторизованных push-запросов)
 *
 * Использование:
 *   <script src="js/api.js"></script>
 *   <script src="js/pwa.js"></script>
 *   BadenPWA.canInstall — true если можно поставить (только при наличии beforeinstallprompt)
 *   BadenPWA.install() — показать prompt установки
 *   BadenPWA.pushPermissionState() — 'granted' | 'denied' | 'default' | 'unsupported'
 *   BadenPWA.enablePush() — запросить permission и подписаться
 *   BadenPWA.disablePush() — отписаться + удалить с сервера
 *   BadenPWA.testPush() — отправить тестовое уведомление через backend
 */
(function (global) {
  'use strict';

  const SW_PATH = 'sw.js';
  // VAPID public key подтянем из api_url.json (точнее — отдельный /api/push/vapid endpoint)
  let vapidKey = null;
  let installPrompt = null;

  // ── Service Worker registration ──────────────────────────────────────
  async function registerSW() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[pwa] Service Workers not supported');
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.register(SW_PATH, { scope: './' });
      console.log('[pwa] SW registered, scope:', reg.scope);
      return reg;
    } catch (e) {
      console.warn('[pwa] SW registration failed:', e);
      return null;
    }
  }

  // ── Install prompt (Chrome/Edge) ─────────────────────────────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    document.dispatchEvent(new CustomEvent('baden-pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    console.log('[pwa] app installed');
    document.dispatchEvent(new CustomEvent('baden-pwa-installed'));
  });

  async function install() {
    if (!installPrompt) {
      // iOS: показываем инструкцию вручную (нет beforeinstallprompt)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert(
          'Чтобы установить на iPhone:\n\n' +
          '1. Откройте этот сайт в Safari\n' +
          '2. Нажмите "Поделиться" (квадрат со стрелкой)\n' +
          '3. Прокрутите вниз → "На экран Домой"\n\n' +
          'После установки сможете получать push-уведомления.'
        );
        return false;
      }
      alert('Установка недоступна в этом браузере. Попробуйте Chrome / Edge / Safari.');
      return false;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    installPrompt = null;
    return outcome === 'accepted';
  }

  // ── Push notifications ───────────────────────────────────────────────
  function pushPermissionState() {
    if (!('Notification' in window)) return 'unsupported';
    if (!('serviceWorker' in navigator)) return 'unsupported';
    if (!('PushManager' in window)) return 'unsupported';
    return Notification.permission; // 'granted' | 'denied' | 'default'
  }

  async function getVapidKey() {
    if (vapidKey) return vapidKey;
    try {
      const data = await BadenAuth.apiGet('/api/push/vapid', { auth: false });
      vapidKey = data.public_key;
      return vapidKey;
    } catch (e) {
      console.warn('[pwa] failed to fetch VAPID key:', e);
      throw new Error('Не удалось получить ключ для уведомлений');
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const out = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
    return out;
  }

  async function enablePush() {
    const state = pushPermissionState();
    if (state === 'unsupported') {
      alert('Этот браузер не поддерживает push-уведомления. На iPhone нужно сначала установить приложение через Safari → "На экран Домой".');
      return false;
    }
    if (state === 'denied') {
      alert('Уведомления заблокированы. Включи их в настройках браузера для этого сайта.');
      return false;
    }

    // Запрашиваем permission если ещё не задан
    if (state === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert('Без разрешения уведомления работать не будут.');
        return false;
      }
    }

    // Получаем VAPID
    const publicKey = await getVapidKey();

    // Подписываемся
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    // Отправляем на сервер
    await BadenAuth.apiPost('/api/push/subscribe', {
      subscription: sub.toJSON(),
      ua: navigator.userAgent,
    });

    return true;
  }

  async function disablePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Сначала уведомим бэкенд (он удалит из БД)
        try {
          await BadenAuth.apiPost('/api/push/unsubscribe', { endpoint: sub.endpoint });
        } catch (e) { /* не критично */ }
        await sub.unsubscribe();
      }
      return true;
    } catch (e) {
      console.warn('[pwa] disablePush failed:', e);
      return false;
    }
  }

  async function testPush() {
    return BadenAuth.apiPost('/api/push/test', {});
  }

  // ── Public API ───────────────────────────────────────────────────────
  global.BadenPWA = {
    registerSW,
    install,
    get canInstall() { return installPrompt !== null; },
    pushPermissionState,
    enablePush,
    disablePush,
    testPush,
  };

  // Auto-register SW при загрузке
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerSW);
  } else {
    registerSW();
  }
})(window);
