const PAYMENT_LINK = '';
const form = document.querySelector('#registration-form');
const status = document.querySelector('.form-status');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  if (!PAYMENT_LINK) {
    status.textContent = 'Формата е готова. Добавете Deska Payment Link в script.js, за да се активира плащането.';
    return;
  }

  const params = new URLSearchParams(new FormData(form));
  window.location.href = `${PAYMENT_LINK}?name=${encodeURIComponent(params.get('name'))}&email=${encodeURIComponent(params.get('email'))}`;
});

const guestTrack = document.querySelector('.guest-track');
document.querySelector('.carousel-prev')?.addEventListener('click', () => guestTrack.scrollBy({left: -320, behavior: 'smooth'}));
document.querySelector('.carousel-next')?.addEventListener('click', () => guestTrack.scrollBy({left: 320, behavior: 'smooth'}));

const story = document.querySelector('[data-story]');
const storyVideo = story?.querySelector('.story-video');
const storyCards = [...document.querySelectorAll('[data-story-card]')];
const hero = document.querySelector('.hero');
const heroPhotos = [
  'assets/hero-01.jpg', 'assets/hero-11.jpg',
  'assets/hero-02.jpg', 'assets/hero-12.jpg',
  'assets/hero-03.jpg', 'assets/hero-13.jpg',
  'assets/hero-04.jpg', 'assets/hero-14.jpg',
  'assets/hero-05.jpg', 'assets/hero-15.jpg',
  'assets/hero-06.jpg', 'assets/hero-07.jpg',
  'assets/hero-08.jpg', 'assets/hero-09.jpg',
  'assets/hero-10.jpg'
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

