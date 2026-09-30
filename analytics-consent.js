(function () {
  'use strict';

  var GA_ID = 'G-FXNG4V8JGQ';
  var PIXEL_ID = '1750795822810756';
  var KEY = 'sofiasummit_cookie_consent';

  function readConsent() {
    try {
      var current = JSON.parse(localStorage.getItem(KEY) || 'null');
      var legacy = JSON.parse(localStorage.getItem('nailrestart_cookie_consent') || 'null');
      return current || legacy;
    } catch (_) { return null; }
  }

  function saveConsent(analytics) {
    localStorage.setItem(KEY, JSON.stringify({ analytics: !!analytics, ts: new Date().toISOString() }));
    if (analytics) loadTracking();
  }

  function loadTracking() {
    if (window.__sofiaTrackingLoaded) return;
    window.__sofiaTrackingLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);

    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function makeBanner() {
    var banner = document.getElementById('cookieBanner');
    if (banner) return banner;
    banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Настройки за бисквитки');
    banner.innerHTML = '<div style="max-width:1100px;margin:auto;display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap"><p style="margin:0;line-height:1.5">Използваме технически необходими бисквитки. Аналитичните бисквитки на Google Analytics и Meta Pixel се включват само с твое съгласие. <a href="/privacy.html" target="_blank" rel="noopener">Повече информация</a>.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-cookie="reject">Само необходимите</button><button type="button" data-cookie="accept">Приемам</button></div></div>';
    banner.style.cssText = 'position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;padding:16px 20px;background:#fff;color:#171717;border:1px solid #ddd;border-radius:12px;box-shadow:0 8px 30px #0002;font:14px/1.4 system-ui,sans-serif';
    document.body.appendChild(banner);
    banner.querySelector('[data-cookie="accept"]').onclick = function () { saveConsent(true); banner.remove(); };
    banner.querySelector('[data-cookie="reject"]').onclick = function () { saveConsent(false); banner.remove(); };
    return banner;
  }

  function wireExistingBanner(banner) {
    var accept = document.getElementById('cookieAccept');
    var reject = document.getElementById('cookieReject');
    var save = document.getElementById('cookieSavePrefs');
    if (accept) accept.addEventListener('click', function () { saveConsent(true); });
    if (reject) reject.addEventListener('click', function () { saveConsent(false); });
    if (save) save.addEventListener('click', function () {
      saveConsent(!!document.getElementById('cookieAnalyticsBox')?.checked);
    });
  }

  var consent = readConsent();
  if (consent && consent.analytics) loadTracking();
  else if (!consent) {
    var banner = makeBanner();
    wireExistingBanner(banner);
  } else wireExistingBanner(document.getElementById('cookieBanner'));
}());
