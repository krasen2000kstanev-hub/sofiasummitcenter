const API_BASE = window.HR_API_BASE || '';
const PAYMENT_LINK = 'https://epg.dskbank.bg/sc/YqwigIbIWMnGQnRP';
const form = document.querySelector('#registration-form');
const status = document.querySelector('.form-status');

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
    window.location.href = result.paymentUrl || PAYMENT_LINK;
  } catch (error) {
    status.textContent = error.message === 'Failed to fetch' ? 'Временно няма връзка със сървъра. Опитай отново.' : error.message;
  }
});

const guestTrack = document.querySelector('.guest-track');
if (guestTrack) {
  document.querySelector('.carousel-prev')?.addEventListener('click', () => guestTrack.scrollBy({left: -320, behavior: 'smooth'}));
  document.querySelector('.carousel-next')?.addEventListener('click', () => guestTrack.scrollBy({left: 320, behavior: 'smooth'}));
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
  'assets/hero-01.jpg', 'assets/hero-11.jpg',
  'assets/hero-02.jpg', 'assets/hero-12.jpg',
  'assets/hero-03.jpg', 'assets/hero-13.jpg',
  'assets/hero-04.jpg', 'assets/hero-14.jpg',
  'assets/hero-05.jpg', 'assets/hero-15.jpg',
  'assets/hero-07.jpg', 'assets/hero-08.jpg',
  'assets/hero-09.jpg', 'assets/hero-10.jpg'
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

