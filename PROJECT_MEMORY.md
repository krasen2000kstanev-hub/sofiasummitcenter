# Project memory

## Sofia Summit / Nail Business Re:Start

- Сайтът е на GitHub Pages: `https://sofiasummit.bg/`.
- Event URL: `https://sofiasummit.bg/events/nail-business-restart/`.
- Repository: `krasen2000kstanev-hub/sofiasummitcenter`.
- Event source file: `events/nail-business-restart/index.html`.
- Backend кодът е Cloudflare Worker + D1 в `backend/`. Публикуваният Worker е `https://sofiasummit-events-api.krasen2000-k-stanev.workers.dev`.
- D1 базата е `sofiasummit-events`, ID `59171d68-7a1e-492b-9014-1213ab3ffe5d`, с binding `DB`.
- Логове и Secrets Manager не са част от текущия минимален вариант.
- Капацитетът е 100 участници; формата приема число от 1 до 100.
- Билетите са Standard, Standard + запис и VIP.
- Master class изборът е разрешен за Standard + запис и VIP.
- Правните страници са `terms.html`, `privacy.html`, `cookies.html`, `recording.html` и `refund.html`.
- Всички правни препратки се отварят като отделни страници в нов таб и връщат към секцията `#legal`.
- Формата вече изпраща към `/api/orders`, подава `agreeTerms: true`, `masterClasses` и `fullName` за допълнителните участници.
- DSK payment links и реални промокодове все още не са конфигурирани.
- DSK webhook, автоматични имейли, ticket URL и admin export изискват пълното backend deployment; текущият live Worker е минималният registration API.
- Не се съхраняват никакви секрети в проекта.
- `backend/wrangler.toml` съдържа реалния D1 `database_id`.
- Последният GitHub commit е `be49cc4` (`fix registration API payload and endpoint`).
- Подготвен е лек pointer-aware 3D tilt ефект върху основните карти, галерията, изображенията, бутоните и форматите на събитията. Hover/focus върху контролите добавя дискретен контур по ръба, а `prefers-reduced-motion` изключва анимацията.
- Към актуалния `main` са добавени и останалите визуални ефекти от локалния preview: интерактивна 3D сфера в галерията с drag/scroll управление и momentum, движещ се фон от снимки с линии, карта на София със Sofia Summit Center маркер и бутон за връщане в началото.
- В `index.html` има отделни секции `#podcasts`, `#productions` и `#initiatives`; `#services` сочи към съществуващата секция за услуги. Навигацията е responsive: широкият изглед е на един ред, а под 1180px се показва хамбургер меню.
- В `#featured-events` е добавена карта за „Кариерно кафе“ с дата 21 ноември 2026, връзка към `events/career-cafe/` и минивизуализацията `assets/event-photos/career-cafe-card.svg`, стилизирана по дизайна на събитието.
- Последното качване на функционалните промени е commit `56ba54a` (`feat: add Career Cafe event card`). Документацията се актуализира с текущата структура и responsive поведението.
