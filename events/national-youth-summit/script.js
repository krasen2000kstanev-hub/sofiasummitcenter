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

const API_BASE = window.HR_API_BASE || '';
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) { form.querySelector(':invalid')?.focus(); return; }
  const button = form.querySelector('button[type="submit"]');
  const field = (name) => form.elements[name].value.trim();
  button.disabled = true;
  status.textContent = 'Изпращаме…';
  try {
    const response = await fetch(`${API_BASE}/api/free-registrations`, {
      method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({eventSlug: 'national-youth-summit', organization: field('organization'), fullName: field('fullName'), phone: field('phone'), email: field('email'), consent: form.elements.consent.checked})
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Възникна грешка. Опитай отново.');
    if (!result.already) form.reset();
    status.textContent = result.already ? result.message : 'Благодарим! Регистрацията е потвърдена. Билетът идва на посочения имейл до няколко минути. Очакваме ви на 2 декември в 9:30 ч.';
  } catch (error) {
    status.textContent = error.message === 'Failed to fetch' ? 'Няма връзка. Опитай отново след малко.' : error.message;
  } finally {
    button.disabled = false;
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



