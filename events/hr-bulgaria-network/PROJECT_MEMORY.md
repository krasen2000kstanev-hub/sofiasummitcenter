# Project memory

## HR Bulgaria Network landing page

- Репозиториум: `krasen2000kstanev-hub/sofiasummitcenter`
- Целеви публичен адрес: `https://sofiasummit.bg/events/hr-bulgaria-network`
- Локален preview: `http://127.0.0.1:4173/`
- Хостинг: GitHub Pages, като част от Sofia Summit Center.

## Текущ дизайн

- Hero: 15 хоризонтални JPG снимки, автоматична ротация през 5 секунди.
- Hero редът редува снимки от последното и предишни събития.
- Основна палитра: тъмносиньо, светъл фон и коралов акцент.
- В hero не се показва текстът „Плащане през Deska“.
- Секцията за снимки води към Pixieset колекциите.
- Backend scaffold: `backend/` с Lambda, API Gateway, DynamoDB, SES, Terraform и PowerShell deploy.
- Frontend API адресът се задава само в `api-config.js` чрез `window.HR_API_BASE`.

## Лектори

- Бойко Проданов — ActionCOACH.
- Радослава Кроснева — Co-Partner.

## Преди следваща публикация

- Провери локалния preview и хоризонталната ориентация на новите hero снимки.
- Payment линкът е зададен в `script.js`; след AWS deploy попълни API Gateway адреса в `api-config.js`.
- При нова HR среща обнови Pixieset линка и добави новите снимки в `assets/events/` или `assets/hero/`.
- Преди production плащания получи от DSK webhook формат, merchant reference и secret; статичният линк не е достатъчен за автоматично потвърждение.
