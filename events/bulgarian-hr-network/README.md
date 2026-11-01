# Bulgarian HR Network

Статичен лендинг за Bulgarian HR Network, предназначен за GitHub Pages и субдомейн на Sofia Summit Center.

## Какво съдържа

- Hero секция с хоризонтални снимки от последното и предишни събития.
- Автоматична смяна на hero снимките през 5 секунди; `hero-05.jpg` е изключена, защото е заснета в различен формат и се деформира при full-bleed показване.
- Секции за общността, лекторите, снимките от събитията и регистрацията.
- Форма за регистрация с български полета и достъпни radio/checkbox контроли.
- Подготвен поток към DSK Payment Link след попълване на формата.
- Следваща месечна среща: 28 октомври 2026 г. от 19:00 ч. в Sofia Summit Center.
- Лектори: Йоанна Маринова и Василена Винченцо от Artime.
- Цена на билета: 12 €. След успешно плащане backend-ът изпраща имейл с 4-символен код за вход.
- AWS backend в `backend/` за регистрация, DSK webhook и SES имейли.
- Видимото име и URL slug-ът са „Bulgarian HR Network“: `/events/bulgarian-hr-network/`.

## Локален preview

```powershell
node preview-server.cjs
```

След това отвори `http://127.0.0.1:4173/`.

## Публикуване

1. В GitHub включи Pages от branch `main` и папка `/ (root)`.
2. За субдомейн добави `CNAME` файл с точния адрес и DNS CNAME запис към GitHub Pages.
3. За backend изпълни `backend/deploy.ps1 -Action apply` и постави output `api_url` в `api-config.js` като `window.HR_API_BASE`.
4. Потвърди sender email-а в Amazon SES.
5. DSK webhook-ът е конфигуриран като POST към AWS API Gateway за `Deposited` събития със Symmetric signing.

## Поддръжка

- Hero каруселът се управлява в `index.html`, script `hero-slider-all-photos`, масив `photos`. Снимките от 28.10.2026 са в `assets/events/hr-2026-10-28-*.jpg`.
- Новите снимки са хоризонтални, 1920×1081 px, JPEG с качество около 78. Не добавяй `hero-05.jpg` обратно.
- Снимките в долните секции са в `assets/events/`.
- Линкът към Pixieset се поддържа в секцията „Снимки от събития“ на `index.html`.
- Backend инструкциите и Terraform променливите са в `backend/README.md`.


## Актуално състояние

- Hero-ът е full-screen с 13 различни снимки, плъзгаща анимация и работещи бутони назад, пауза/продължи и напред. Зарежда само текущата и съседните снимки, а при `prefers-reduced-motion` не се върти автоматично.
- Клик върху hero снимка отваря оригиналния файл за преглед или изтегляне.
- Основните секции са full-width; съдържанието запазва четима вътрешна ширина.
- Header менюто е статично и не следва потребителя при скрол.
- Responsive/cross-browser CSS покрива desktop, tablet и mobile ширини, без хоризонтален скрол.
- Линкове към галериите: 28.10.2026 `https://krasen2000kstanev-hub.github.io/Pixiset--/gallery.html?slug=hr-sreshta-28-10-fde3b4#photos`, 25.09.2026 `https://krasen2000kstanev-hub.github.io/Pixiset--/gallery.html?slug=hr-sreshta-d33703`, 07.07.2026 `https://krasen2000kstanev-hub.github.io/Pixiset--/gallery.html?slug=hr-sreshta-e4f128`.
- Снимки от 28.10.2026 има още в „Снимки от събития“, секцията със следващия лектор, секцията с историята и картата на началната страница.
