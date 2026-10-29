(function () {
  'use strict';

  var GA_ID = 'G-FXNG4V8JGQ';
  var PIXEL_ID = '1750795822810756';
  var KEY = 'sofiasummit_cookie_consent';

  // Returns { analytics, marketing } or null when the visitor has not chosen yet.
  function readConsent() {
    try {
      var current = JSON.parse(localStorage.getItem(KEY) || 'null');
      // The nail-event page has its own older banner; keep its consent local to that page.
      if (!current && document.getElementById('cookieBanner')) {
        current = JSON.parse(localStorage.getItem('nailrestart_cookie_consent') || 'null');
      }
      if (!current) return null;
      // Older saved choices had one flag that covered both GA and Meta Pixel.
      return { analytics: !!current.analytics, marketing: 'marketing' in current ? !!current.marketing : !!current.analytics };
    } catch (_) { return null; }
  }

  function saveConsent(choice) {
    var before = readConsent() || {};
    try {
      localStorage.setItem(KEY, JSON.stringify({ analytics: !!choice.analytics, marketing: !!choice.marketing, ts: new Date().toISOString() }));
    } catch (_) {}
    // Scripts already running cannot be unloaded, so a withdrawn consent needs a clean page.
    if ((before.analytics && !choice.analytics) || (before.marketing && !choice.marketing)) {
      clearTrackingCookies();
      location.reload();
      return;
    }
    applyConsent(choice);
  }

  function clearTrackingCookies() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (part) {
      var name = part.split('=')[0].trim();
      if (!/^(_ga|_gid|_gat|_fbp|_fbc)/.test(name)) return;
      ['', ';domain=' + host, ';domain=.' + host].forEach(function (domain) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/' + domain;
      });
    });
  }

  function applyConsent(consent) {
    if (consent.analytics) loadAnalytics();
    if (consent.marketing) loadPixel();
    if (consent.analytics || consent.marketing) trackInteractions();
  }

  function loadAnalytics() {
    if (window.__sofiaAnalyticsLoaded) return;
    window.__sofiaAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);
  }

  function loadPixel() {
    if (window.__sofiaPixelLoaded) return;
    window.__sofiaPixelLoaded = true;
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

  // Sends to whichever of GA / Pixel the visitor allowed.
  function track(name, params) {
    if (window.__sofiaAnalyticsLoaded) window.gtag('event', name, params || {});
    if (window.__sofiaPixelLoaded) window.fbq('trackCustom', name, params || {});
  }

  function trackInteractions() {
    if (window.__sofiaInteractionsTracked) return;
    window.__sofiaInteractionsTracked = true;

    document.addEventListener('click', function (event) {
      var target = event.target.closest('a[href], [data-story-prev], [data-story-next], .story-card.story--prev, .story-card.story--next');
      if (!target) return;

      var name, params = {};
      if (target.matches('[data-story-prev], [data-story-next], .story-card.story--prev, .story-card.story--next')) {
        name = 'student_feedback_click';
      } else if (target.closest('.social-row[aria-label="Последвайте HR:Rush for Practice"]')) {
        name = 'social_profile_click';
        params.platform = target.getAttribute('aria-label') || target.title || 'unknown';
      } else if (target.getAttribute('href') === '#apply') {
        name = 'registration_click';
      } else if (target.getAttribute('href') === '#mentors') {
        name = 'mentor_click';
      } else if (target.getAttribute('href') === '#student-feedback') {
        name = 'student_feedback_click';
      } else if (target.getAttribute('href') === '#hr-feedback') {
        name = 'hr_feedback_click';
      }

      if (name) track(name, params);
    });

    var hrFeedback = document.querySelector('[aria-labelledby="hr-feedback-heading"]');
    if (hrFeedback && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, observer) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          track('hr_feedback_view');
          observer.disconnect();
        }
      }, { threshold: 0.25 }).observe(hrFeedback);
    }
  }

  function policyUrl() {
    return location.pathname.indexOf('/events/career-cafe') === 0 ? '/events/career-cafe/biskvitki/' : '/privacy.html';
  }

  function addStyles() {
    if (document.getElementById('sofia-cookie-banner-styles')) return;
    var style = document.createElement('style');
    style.id = 'sofia-cookie-banner-styles';
    style.textContent = '.sofia-cookie-banner{position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;max-height:calc(100vh - 32px);overflow:auto;padding:16px 20px;background:#fff;color:#171717;border:1px solid #ddd;border-radius:12px;box-shadow:0 8px 30px #0002;font:14px/1.4 system-ui,sans-serif}.sofia-cookie-banner-inner{max-width:1100px;margin:auto;display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap}.sofia-cookie-banner p{margin:0;line-height:1.5;flex:1 1 420px;color:#171717}.sofia-cookie-banner b{color:#171717}.sofia-cookie-banner a{color:#123b86}.sofia-cookie-banner-actions{display:flex;gap:8px;flex-wrap:wrap}.sofia-cookie-banner button{min-height:42px;padding:10px 14px;border:1px solid #123b86;border-radius:6px;background:#fff;color:#123b86;font:inherit;font-weight:600;cursor:pointer}.sofia-cookie-banner button[data-cookie="accept"],.sofia-cookie-banner button[data-cookie="reject"]{background:#123b86;color:#fff}.sofia-cookie-banner button:focus-visible{outline:2px solid #123b86;outline-offset:2px}.sofia-cookie-prefs{max-width:1100px;margin:14px auto 0;padding-top:14px;border-top:1px solid #e5e5e5;display:grid;gap:10px}.sofia-cookie-prefs[hidden]{display:none}.sofia-cookie-prefs label{display:flex;gap:10px;align-items:flex-start;cursor:pointer}.sofia-cookie-prefs input{margin-top:3px;width:18px;height:18px;flex:none;accent-color:#123b86}.sofia-cookie-prefs small{display:block;color:#555}.sofia-cookie-prefs .sofia-cookie-save{justify-self:start}@media(max-width:600px){.sofia-cookie-banner{left:10px;right:10px;bottom:10px;padding:14px 12px}.sofia-cookie-banner-inner{display:block}.sofia-cookie-banner p{font-size:13px;margin-bottom:12px}.sofia-cookie-banner-actions{display:grid;grid-template-columns:1fr}.sofia-cookie-banner button{width:100%;min-height:44px}.sofia-cookie-prefs .sofia-cookie-save{justify-self:stretch}}';
    document.head.appendChild(style);
  }

  function showBanner(openPrefs) {
    var existing = document.getElementById('sofiaCookieBanner');
    if (existing) existing.remove();
    addStyles();
    var consent = readConsent() || { analytics: false, marketing: false };
    var banner = document.createElement('div');
    banner.id = 'sofiaCookieBanner';
    banner.className = 'sofia-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Настройки за бисквитки');
    banner.innerHTML =
      '<div class="sofia-cookie-banner-inner">' +
        '<p>Използваме необходими бисквитки, за да работи сайтът. Аналитичните (Google Analytics) и маркетинговите (Meta Pixel) бисквитки се включват само ако ги разрешите. Можете да промените избора си по всяко време. <a href="' + policyUrl() + '" target="_blank" rel="noopener">Политика за бисквитки</a>.</p>' +
        '<div class="sofia-cookie-banner-actions">' +
          '<button type="button" data-cookie="reject">Отказвам всички</button>' +
          '<button type="button" data-cookie="settings" aria-expanded="false" aria-controls="sofiaCookiePrefs">Настройки</button>' +
          '<button type="button" data-cookie="accept">Приемам всички</button>' +
        '</div>' +
      '</div>' +
      '<div class="sofia-cookie-prefs" id="sofiaCookiePrefs" hidden>' +
        '<label><input type="checkbox" checked disabled><span><b>Необходими</b><small>Нужни за работата на сайта и за запомняне на този избор. Винаги включени.</small></span></label>' +
        '<label><input type="checkbox" data-cookie-category="analytics"' + (consent.analytics ? ' checked' : '') + '><span><b>Аналитични</b><small>Google Analytics — анонимна статистика за посещенията.</small></span></label>' +
        '<label><input type="checkbox" data-cookie-category="marketing"' + (consent.marketing ? ' checked' : '') + '><span><b>Маркетингови</b><small>Meta Pixel — измерване на рекламни кампании във Facebook и Instagram.</small></span></label>' +
        '<button type="button" class="sofia-cookie-save" data-cookie="save">Запази избора</button>' +
      '</div>';
    document.body.appendChild(banner);

    var prefs = banner.querySelector('#sofiaCookiePrefs');
    var settings = banner.querySelector('[data-cookie="settings"]');
    function togglePrefs(open) {
      prefs.hidden = !open;
      settings.setAttribute('aria-expanded', String(open));
    }
    function choose(choice) { banner.remove(); saveConsent(choice); }

    settings.onclick = function () { togglePrefs(prefs.hidden); };
    banner.querySelector('[data-cookie="accept"]').onclick = function () { choose({ analytics: true, marketing: true }); };
    banner.querySelector('[data-cookie="reject"]').onclick = function () { choose({ analytics: false, marketing: false }); };
    banner.querySelector('[data-cookie="save"]').onclick = function () {
      choose({
        analytics: banner.querySelector('[data-cookie-category="analytics"]').checked,
        marketing: banner.querySelector('[data-cookie-category="marketing"]').checked
      });
    };
    if (openPrefs) {
      togglePrefs(true);
      prefs.querySelector('input:not([disabled])').focus();
    }
  }

  // The nail-event page ships its own banner markup and only has one analytics checkbox.
  function wireLegacyBanner() {
    function both(value) { return { analytics: value, marketing: value }; }
    var accept = document.getElementById('cookieAccept');
    var reject = document.getElementById('cookieReject');
    var save = document.getElementById('cookieSavePrefs');
    if (accept) accept.addEventListener('click', function () { saveConsent(both(true)); });
    if (reject) reject.addEventListener('click', function () { saveConsent(both(false)); });
    if (save) save.addEventListener('click', function () {
      saveConsent(both(!!document.getElementById('cookieAnalyticsBox')?.checked));
    });
  }

  // Any element with data-cookie-settings (e.g. a footer link) reopens the choices.
  window.openCookieSettings = function () { showBanner(true); };
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-cookie-settings]');
    if (!trigger) return;
    event.preventDefault();
    showBanner(true);
  });

  var hasLegacyBanner = !!document.getElementById('cookieBanner');
  var consent = readConsent();
  if (consent) applyConsent(consent);
  if (hasLegacyBanner) wireLegacyBanner();
  else if (!consent) showBanner(false);
}());
