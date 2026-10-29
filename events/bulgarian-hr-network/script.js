const API_BASE = window.HR_API_BASE || '';
const PAYMENT_LINK = 'https://epg.dskbank.bg/sc/YqwigIbIWMnGQnRP';
const form = document.querySelector('#registration-form');
const status = document.querySelector('.form-status');

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
const menuCloseTargets = document.querySelectorAll('[data-menu-close]');
const closeMobileMenu = () => {
  document.body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Отвори меню');
  mobileMenu?.setAttribute('aria-hidden', 'true');
};
const openMobileMenu = () => {
  document.body.classList.add('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'true');
  menuToggle?.setAttribute('aria-label', 'Затвори меню');
  mobileMenu?.setAttribute('aria-hidden', 'false');
};
menuToggle?.addEventListener('click', () => document.body.classList.contains('menu-open') ? closeMobileMenu() : openMobileMenu());
menuCloseTargets.forEach((target) => target.addEventListener('click', closeMobileMenu));
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMobileMenu));
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMobileMenu(); });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  if (!API_BASE) {
    status.textContent = 'Формата е готова. Ще се свържем с теб за потвърждение.';
    return;
  }

  status.textContent = 'Записваме данните…';
  const data = Object.fromEntries(new FormData(form).entries());
  data.expectations = [...form.querySelectorAll('input[name="expectations"]:checked')].map((input) => input.value);
  data.expectationsOther = data.expectations_other || '';
  data.consent = form.elements.consent.checked;
  try {
    const response = await fetch(`${API_BASE}/registrations`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(data)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.errors ? Object.values(result.errors)[0] : 'registration_failed');
    status.textContent = 'Регистрацията е получена. След потвърждение на плащането ще получите билета си по имейл до 24 часа. Пренасочваме към плащане…';
    window.setTimeout(() => { window.location.href = result.paymentUrl || PAYMENT_LINK; }, 700);
  } catch (error) {
    status.textContent = error.message === 'Failed to fetch' ? 'Временно няма връзка със сървъра. Опитай отново.' : error.message;
  }
});

const guestTrack = document.querySelector('.guest-track');
if (guestTrack) {
  // Query live: other scripts on the page re-render the cards after load.
  const cards = () => [...guestTrack.querySelectorAll('.guest-card')];
  const counter = document.querySelector('.guest-counter');
  const pauseBtn = document.querySelector('.guest-pause');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let playing = !reduceMotion;
  let timer;
  // Last card worth a stop: one whose start is within half a card of the end of the scroll range.
  const lastIndex = () => {
    const all = cards();
    const max = guestTrack.scrollWidth - guestTrack.clientWidth + all[0].offsetWidth / 2;
    return Math.max(0, all.filter(card => card.offsetLeft - all[0].offsetLeft <= max).length - 1);
  };
  const show = i => {
    const last = lastIndex();
    index = i > last ? 0 : i < 0 ? last : i;
    const all = cards();
    guestTrack.scrollTo({left: all[index].offsetLeft - all[0].offsetLeft, behavior: 'smooth'});
    if (counter) counter.textContent = `${index + 1} / ${last + 1}`;
  };
  const restart = () => {
    clearInterval(timer);
    if (playing) timer = setInterval(() => show(index + 1), 4500);
  };
  document.querySelector('.carousel-prev')?.addEventListener('click', () => { show(index - 1); restart(); });
  document.querySelector('.carousel-next')?.addEventListener('click', () => { show(index + 1); restart(); });
  pauseBtn?.addEventListener('click', () => {
    playing = !playing;
    pauseBtn.textContent = playing ? 'Пауза' : 'Продължи';
    restart();
  });
  // Follow manual swipes once scrolling settles, so smooth scrolls aren't cut short mid-way.
  let settle;
  guestTrack.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const all = cards();
      const left = guestTrack.scrollLeft + all[0].offsetLeft;
      const nearest = all.reduce((best, card, i) => Math.abs(card.offsetLeft - left) < Math.abs(all[best].offsetLeft - left) ? i : best, 0);
      index = Math.min(nearest, lastIndex());
      if (counter) counter.textContent = `${index + 1} / ${lastIndex() + 1}`;
    }, 150);
  }, {passive: true});
  if (pauseBtn && reduceMotion) pauseBtn.textContent = 'Продължи';
  window.addEventListener('resize', () => show(index));
  window.addEventListener('load', () => show(index));
  show(0);
  restart();
}

const story = document.querySelector('[data-story]');
const storyVideo = story?.querySelector('.story-video');
const storyCards = [...document.querySelectorAll('[data-story-card]')];
const hero = document.querySelector('.hero');
const guestsSection = document.querySelector('.guests');
const revealGuests = () => {
  if (!guestsSection) return;
  const rect = guestsSection.getBoundingClientRect();
  if (rect.top < innerHeight * .85 && rect.bottom > 0) guestsSection.classList.add('is-visible');
};
if (guestsSection) {
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  }, {threshold: 0.25}).observe(guestsSection);
  revealGuests();
  window.addEventListener('hashchange', revealGuests);
  window.addEventListener('scroll', revealGuests, {passive:true});
}
const heroPhotos = [
  'assets/hero/hero-01.jpg', 'assets/hero/hero-11.jpg',
  'assets/hero/hero-02.jpg', 'assets/hero/hero-12.jpg',
  'assets/hero/hero-03.jpg', 'assets/hero/hero-13.jpg',
  'assets/hero/hero-04.jpg', 'assets/hero/hero-14.jpg',
  'assets/hero/hero-07.jpg', 'assets/hero/hero-08.jpg',
  'assets/hero/hero-09.jpg', 'assets/hero/hero-10.jpg',
  'assets/hero/hero-15.jpg'
];
if (hero) {
  let heroIndex = 0;
  hero.style.setProperty('--hero-photo', `url("${heroPhotos[0]}")`);
  window.setInterval(() => {
    heroIndex = (heroIndex + 1) % heroPhotos.length;
    hero.style.setProperty('--hero-photo', `url("${heroPhotos[heroIndex]}")`);
  }, 5000);
}
let storyFrame = 0;
const updateStory = () => {
  storyFrame = 0;
  const max = story.offsetHeight - innerHeight;
  const progress = Math.max(0, Math.min(1, -story.getBoundingClientRect().top / max));
  const index = Math.min(storyCards.length - 1, Math.floor(progress * storyCards.length));
  storyCards.forEach((card, i) => card.classList.toggle('is-active', i === index));
  if (storyVideo?.duration) storyVideo.currentTime = storyVideo.duration * progress;
};
window.addEventListener('scroll', () => {
  if (!storyFrame) storyFrame = requestAnimationFrame(updateStory);
}, {passive:true});



