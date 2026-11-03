(function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  var groups = document.querySelectorAll('.nav-group');

  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeGroups(except) {
    groups.forEach(function (group) { if (group !== except) group.open = false; });
  }

  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  groups.forEach(function (group) {
    group.addEventListener('toggle', function () { if (group.open) closeGroups(group); });
  });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.nav')) { closeGroups(); setMenu(false); }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeGroups();
    if (menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setMenu(false);
  });

  // Hide the header while scrolling down; scrolling up brings it back.
  var header = document.querySelector('.site-header');
  var lastHeaderScroll = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (Math.abs(y - lastHeaderScroll) < 6) return;
    var hide = y > lastHeaderScroll && y > 120 && !menu.classList.contains('is-open');
    header.classList.toggle('is-hidden', hide);
    lastHeaderScroll = y;
  }, { passive: true });
  header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // Back to top
  var topButton = document.createElement('button');
  topButton.className = 'back-to-top';
  topButton.type = 'button';
  topButton.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Back to top' : 'Върни се в началото');
  topButton.textContent = '↑';
  document.body.appendChild(topButton);
  function updateTopButton() { topButton.classList.toggle('is-visible', window.scrollY > 420); }
  window.addEventListener('scroll', updateTopButton, { passive: true });
  topButton.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
  updateTopButton();

  // Drifting background photos, a little faster while the page scrolls.
  var startX = [.04, .18, .32, .46, .60, .74];
  var startY = [.02, .25, .48, .71, .16, .39];
  var photos = Array.prototype.map.call(document.querySelectorAll('.site-ambient img'), function (image, index) {
    image.style.left = (startX[index] * 100) + '%';
    image.style.transform = 'translate3d(0,' + (startY[index] * window.innerHeight) + 'px,0)';
    return { image: image, x: startX[index], y: startY[index], depth: index % 3, tilt: index % 2 ? -1 : 1 };
  });
  if (!reduced && !touch) {
    var speedBoost = 0;
    var lastFrame = performance.now();
    var lastScroll = window.scrollY;
    var frame = function (time) {
      var dt = Math.min(40, time - lastFrame) / 1000;
      lastFrame = time;
      speedBoost *= Math.exp(-dt / .9);
      var speed = .018 + Math.min(.075, speedBoost);
      photos.forEach(function (photo, index) {
        photo.y -= speed * dt;
        if (photo.y < -.24) { photo.y = 1.08 + index * .035; photo.x = (photo.x + .27 + index * .043) % .84; }
        var tilt = photo.tilt * (4 + photo.depth * 2);
        photo.image.style.left = ((photo.x + Math.sin(time * .00022 + index * 1.7) * .035) * 100) + '%';
        photo.image.style.transform = 'translate3d(0,' + (photo.y * window.innerHeight) + 'px,' + (photo.depth * 22) + 'px) perspective(800px) rotateX(' + tilt + 'deg) rotateY(' + (tilt * .8) + 'deg) rotateZ(' + (Math.sin(time * .00018 + index) * 5) + 'deg)';
      });
      requestAnimationFrame(frame);
    };
    window.addEventListener('scroll', function () {
      speedBoost = Math.min(.075, speedBoost + Math.min(.035, Math.abs(window.scrollY - lastScroll) * .00055));
      lastScroll = window.scrollY;
    }, { passive: true });
    requestAnimationFrame(frame);
  }

  // Pointer tilt
  if (!reduced && !touch) {
    document.querySelectorAll('.page-hero-photo, .card, .fact, .btn').forEach(function (surface) {
      surface.classList.add('tilt-surface');
    });
    var active;
    var resetTilt = function () {
      if (!active) return;
      active.style.setProperty('--tilt-x', '0deg');
      active.style.setProperty('--tilt-y', '0deg');
      active = null;
    };
    document.addEventListener('mousemove', function (event) {
      var surface = event.target.closest && event.target.closest('.tilt-surface');
      if (surface !== active) resetTilt();
      if (!surface) return;
      active = surface;
      var box = surface.getBoundingClientRect();
      surface.style.setProperty('--tilt-x', ((.5 - (event.clientY - box.top) / box.height) * 18).toFixed(2) + 'deg');
      surface.style.setProperty('--tilt-y', (((event.clientX - box.left) / box.width - .5) * 22).toFixed(2) + 'deg');
    }, { passive: true });
    window.addEventListener('blur', resetTilt);
  }

  // Inquiry form
  var form = document.getElementById('inquiry-form');
  if (form) initInquiryForm(form);

  function initInquiryForm(form) {
    var api = 'https://3r3kwcz4he.execute-api.eu-central-1.amazonaws.com';
    var space = document.getElementById('f-space');
    var date = document.getElementById('f-date');
    var note = document.getElementById('availability-note');
    var confirmBox = document.getElementById('confirm');
    var button = form.querySelector('button[type=submit]');
    var buttonText = button.textContent;
    var occupied = [];

    // Pages link here with ?space=<slug> so the visitor's room is already selected.
    var params = new URLSearchParams(location.search);
    var slug = params.get('space');
    Array.prototype.forEach.call(space.options, function (option) {
      if (slug && option.dataset.slug === slug) space.value = option.value;
    });
    // The price calculator passes the visitor's selection along.
    if (params.get('message')) form.message.value = params.get('message').slice(0, 2000);
    if (params.get('guests')) form.guests.value = params.get('guests');

    function loadAvailability() {
      occupied = [];
      if (!space.selectedOptions[0].dataset.slug) { note.textContent = 'Ще потвърдим наличността след запитването.'; return; }
      note.textContent = 'Проверяваме наличността…';
      fetch(api + '/availability?space=' + encodeURIComponent(space.value))
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) {
          occupied = d.occupied_dates || [];
          note.textContent = occupied.length ? 'Заети дати: ' + occupied.join(', ') : 'Няма потвърдени заети дати.';
        })
        .catch(function () { note.textContent = 'Наличността ще бъде потвърдена при отговор.'; });
    }
    function showResult(text, isError) {
      confirmBox.textContent = text;
      confirmBox.className = isError ? 'show error' : 'show';
    }

    space.addEventListener('change', loadAvailability);
    loadAvailability();
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      confirmBox.className = '';
      if (occupied.indexOf(date.value) >= 0) { showResult('Избраната дата вече е заета за това пространство.', true); return; }
      var data = Object.fromEntries(new FormData(form));
      data.guests = Number(data.guests);
      button.disabled = true;
      button.textContent = 'Изпращане…';
      fetch(api + '/inquiries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.ok ? r.json() : r.json().then(function (x) { return Promise.reject(x); }); })
        .then(function () {
          showResult('✓ Благодарим! Получихме запитването и ще се свържем с вас.', false);
          form.reset();
          loadAvailability();
        })
        .catch(function (err) { showResult(err && err.error ? err.error : 'Възникна проблем. Опитайте отново или ни се обадете.', true); })
        .finally(function () { button.disabled = false; button.textContent = buttonText; });
    });
  }

  // Reveal headings and cards as they enter the screen.
  if (!reduced && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('is-visible', entry.isIntersecting); });
    }, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
    document.querySelectorAll('h1, .sechead h2').forEach(function (heading) {
      heading.classList.add('main-text-reveal');
      observer.observe(heading);
    });
    document.querySelectorAll('.card, .fact').forEach(function (card, index) {
      card.classList.add('card-reveal');
      card.style.transitionDelay = (index % 4) * 90 + 'ms';
      observer.observe(card);
    });
  }
})();
