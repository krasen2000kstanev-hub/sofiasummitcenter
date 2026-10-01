(function () {
  'use strict';

  var GA_ID = 'G-FXNG4V8JGQ';
  var PIXEL_ID = '1750795822810756';
  var KEY = 'sofiasummit_cookie_consent';

  function readConsent() {
    try {
      var current = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (current) return current;
      // The nail-event page has its own older banner; keep its consent local to that page.
      if (document.getElementById('cookieBanner')) {
        return JSON.parse(localStorage.getItem('nailrestart_cookie_consent') || 'null');
      }
      return null;
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

      if (name) {
        window.gtag('event', name, params);
        window.fbq('trackCustom', name, params);
      }
    });

    var hrFeedback = document.querySelector('[aria-labelledby="hr-feedback-heading"]');
    if (hrFeedback && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, observer) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          window.gtag('event', 'hr_feedback_view');
          window.fbq('trackCustom', 'hr_feedback_view');
          observer.disconnect();
        }
      }, { threshold: 0.25 }).observe(hrFeedback);
    }
  }

  function makeBanner() {
    var banner = document.getElementById('cookieBanner');
    if (banner) return banner;
    banner = document.createElement('div');
    banner.id = 'cookieBanner';
    banner.className = 'sofia-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Настройки за бисквитки');
    banner.innerHTML = '<div class="sofia-cookie-banner-inner"><p>Използваме технически необходими бисквитки. Аналитичните бисквитки на Google Analytics и Meta Pixel се включват само с твое съгласие. <a href="/privacy.html" target="_blank" rel="noopener">Повече информация</a>.</p><div class="sofia-cookie-banner-actions"><button type="button" data-cookie="reject">Само необходимите</button><button type="button" data-cookie="accept">Приемам</button></div></div>';
    if (!document.getElementById('sofia-cookie-banner-styles')) {
      var style = document.createElement('style');
      style.id = 'sofia-cookie-banner-styles';
      style.textContent = '.sofia-cookie-banner{position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;padding:16px 20px;background:#fff;color:#171717;border:1px solid #ddd;border-radius:12px;box-shadow:0 8px 30px #0002;font:14px/1.4 system-ui,sans-serif}.sofia-cookie-banner-inner{max-width:1100px;margin:auto;display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap}.sofia-cookie-banner p{margin:0;line-height:1.5}.sofia-cookie-banner a{color:#123b86}.sofia-cookie-banner-actions{display:flex;gap:8px;flex-wrap:wrap}.sofia-cookie-banner button{min-height:42px;padding:10px 14px;border:1px solid #123b86;border-radius:6px;background:#fff;color:#123b86;font:inherit;cursor:pointer}.sofia-cookie-banner button[data-cookie="accept"]{background:#123b86;color:#fff}@media(max-width:600px){.sofia-cookie-banner{left:10px;right:10px;bottom:10px;padding:14px 12px}.sofia-cookie-banner-inner{display:block}.sofia-cookie-banner p{font-size:13px;margin-bottom:12px}.sofia-cookie-banner-actions{display:grid;grid-template-columns:1fr 1fr}.sofia-cookie-banner button{width:100%;min-height:44px}.sofia-cookie-banner button[data-cookie="accept"]{grid-column:1/-1;grid-row:1}.sofia-cookie-banner button[data-cookie="reject"]{grid-column:1/-1;grid-row:2}}';
      document.head.appendChild(style);
    }
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
