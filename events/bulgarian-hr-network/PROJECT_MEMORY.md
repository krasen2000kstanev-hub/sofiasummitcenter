# Project memory

## Bulgarian HR Network landing page

- Репозиториум: `krasen2000kstanev-hub/sofiasummitcenter`
- Публично име: Bulgarian HR Network.
- Целеви публичен адрес: `https://sofiasummit.bg/events/bulgarian-hr-network/`.
- Нов URL slug: `bulgarian-hr-network`.
- Локален preview: `http://127.0.0.1:4173/`
- Хостинг: GitHub Pages, като част от Sofia Summit Center.

## Текущ дизайн

- Hero: автоматична ротация през 5 секунди на хоризонтални JPG снимки от последното и предишни събития.
- `assets/hero/hero-05.jpg` е умишлено изключена от ротацията, защото е в различен формат и се деформира при full-bleed показване.
- Основна палитра: тъмносиньо, светъл фон и коралов акцент.
- В hero не се показва текстът „Плащане през Deska“.
- Секцията за снимки води към Pixieset колекциите.
- Backend: `backend/` с Lambda, API Gateway, DynamoDB, SES, Terraform и PowerShell deploy.
- Frontend API адресът се задава само в `api-config.js` чрез `window.HR_API_BASE`.
- DSK webhook: POST към `/payments/dsk/webhook`, активирано `Deposited` събитие и Symmetric signing.
- AWS Lambda приема webhook подписа чрез `x-dsk-signature`; невалиден подпис връща `401`.
- Направен е безопасен тест с валиден подпис и несъществуваща регистрация; резултатът е `404 Registration not found`, без плащане и без имейл.

## Лектори

- Следваща месечна среща: 11 ноември 2026 г., 19:00 ч., Sofia Summit Center. Лекторът и темата още не са обявени.
- Йоанна Маринова и Василена Винченцо (Artime) са в „Минали събития“ с лекция „Импро игри за по-уверени презентации“ (28.10.2026).
- Йоанна Маринова — Artime; съвети за по-уверени презентации.
- Василена Винченцо — Artime; импро игри и работа с групата.
- Билет: 12 € през DSK Payment Link. При потвърдено плащане се изпраща имейл с 4-символен код за вход.
- Бойко Проданов — ActionCOACH.
- Радослава Кроснева — Co-Partner.

## Преди следваща публикация

- Провери локалния preview, hero ротацията и хоризонталната ориентация на новите снимки.
- Payment линкът е зададен в `script.js`; API Gateway адресът е зададен в `api-config.js`.
- При нова HR среща обнови Pixieset линка и добави новите снимки в `assets/events/` или `assets/hero/`.
- За пълен production тест потвърди реалния DSK payload и merchant reference; статичният payment link може да не подава `registrationId`.


## Последни промени

- Hero-ът е full-screen с 7 изображения, slide анимация, стрелки, пауза/продължи и counter.
- Клик върху hero изображение отваря оригинала в нов таб за преглед или изтегляне.
- Всички основни секции са full-width с responsive вътрешна подредба.
- Header менюто е статично; не остава видимо при скрол.
- Responsive/cross-browser overrides покриват desktop, tablet и mobile, включително safe-area и fallback за `svh`.
- QA проверка: всички изображения се зареждат, няма хоризонтален overflow, навигационните targets съществуват, стрелките и паузата работят.
- Галерия 07.07.2026: `https://krasen2000kstanev-hub.github.io/Pixiset--/gallery.html?slug=hr-sreshta-e4f128`.
- Премахнат е видимият остатък `href="styles.css"` от секцията за лектори.
