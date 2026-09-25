# Project memory

## HR:Rush for Practice — участници, ментори и HR обратна връзка — 24 септември 2026 г.

- Публичната страница `events/hr-rushforpractice/index.html` съдържа истории на участници със снимки, текстове и посочени университети/сезони. Добавени са и историите на Даяна Димитрова, Моника Борисова, Лейла Мушович, Маргарита Димова, Иванина Пейчева, Лия Йовева, Йоана Аврамова и Ева Маджарова.
- В секцията „Ментори“ е добавен профилът на Цветелин Николов със снимка, биография, девиз и Facebook/LinkedIn профили.
- Секцията „Обратна връзка от HR-и“ показва Kaufland, Ficosota и Sportal като компании, от които предстои да бъдат добавени мнения. Не са публикувани непредоставени цитати.
- Снимките за страницата са в `events/hr-rushforpractice/assets/participants/` и `events/hr-rushforpractice/assets/mentors/`.

## HR:Rush кандидатури, известия и Google Sheet — production, 25 септември 2026 г.

- Публичната форма вече изпраща към `POST /api/apply` на Worker `https://sofiasummit-events-api.krasen2000-k-stanev.workers.dev`; кодът е deploy-нат в production версия `4ee0acd6-3b79-4aa7-8e51-d616eae5b91e`.
- Production D1 migration ledger отчита, че няма оставащи миграции. Формата запазва кандидатурите в D1 и създава три устойчиви задачи за синхронизация: Google Sheet, известие до `krasen2000.k.stanev@gmail.com` без данни за кандидата и потвърждение до кандидата.
- Sheet „HR:Rush — Кандидатури“ (tab „Кандидатури“) остава частен; service identity `hrr-applications-writer@hr-rush-for-practice.iam.gserviceaccount.com` има Editor само за този файл. Ключът е записан като криптиран Cloudflare secret `GOOGLE_SERVICE_ACCOUNT_JSON` и не се пази в репото.
- Worker настройките включват сезон 9, ID на таблицата, имейл за известия и cron `*/5 * * * *` за повторни опити.
- Проверки: локалните тестове 4/4 успешни; Wrangler dry-run успешен; production health 200; празна/невалидна кандидатура 400 без запис; admin списък без удостоверяване 401. На 25 септември 2026 г. бяха изпратени три изрично маркирани фиктивни кандидатури (студент, компания, университет): всяка върна HTTP 201 и трите доставки (`sheet`, `organizer_email`, `applicant_email`) приключиха със статус `sent`.
- След успешния end-to-end тест бяха изчистени редове 2–4 в Sheet `Кандидатури` (стойностите, без промяна на форматирането) и изтрити точно трите тестови кандидатури и деветте им outbox записа. Потвърдено: D1 върна 0 останали тестови записа; Sheet съдържа само заглавния ред; health отново е 200.
- Референция: `backend/README.md`; ключът не се commit-ва. При rollback върни формата към стария endpoint, без да изтриваш D1 таблиците или кандидатурите.

## Career Cafe copy update

На 17 септември 2026 г. `events/career-cafe/index.html` е обновена с одобрения текст за стойностното предложение, програмата и билетите Espresso, Doppio и Lungo+. Видимите тирета в публичния текст са заменени с пунктуация или кратки изречения. Секцията „Кой ще ти помогне“ остава без допълнителни роли до потвърждение на участниците.

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
- Формата вече изпраща към `/api/orders`, подава `agreeTerms: true`, `masterClasses` и `fullName` за допълнителните участници; UX изборът е 1–3 участници.
- Базовите DSK links са в D1 `ticket_types.dsk_url`; промо link-овете са в `promo_payment_links` по `promo_code_id + ticket_key + attendee_count`.
- Промокодовете са в D1 `promo_codes`, с активност, срокове, лимит, позволени билети и 20%/25% server-side отстъпка. Admin UI/API: Worker `/admin/promos`, `/api/admin/promos` и `/api/admin/promo-links`.
- Активни са кодовете `BIBI20`, `EVA20`, `EMI20`, `IRINA20`, `LINA20`, `ILIYANA20`, `ZLATINA20`, `IREN20`, `BORISLAVA20`, `ELENA20` и `OGI20`; всеки дава 20% отстъпка. `OGNYAN20` е преименуван на `OGI20`.
- При 2 или 3 участници промокод не е нужен: backend-ът прилага автоматични 25%, обновява всички билетни карти и избира отделен x2 или x3 DSK link за Standard, Standard + запис и VIP.
- Admin `/api/admin/promos` показва usage count, а `/api/admin/promo-usage?code=...` показва кой е използвал кода, кога, за кой билет, с колко участници и какъв е статусът на поръчката.
- Полето „Промо код“ е отделно от регистрационната форма; приложението прави quote към Worker, а submit създава поръчка и пренасочва към DSK.
- Quote-ът се обновява автоматично при промяна на типа билет и броя участници; при група полето за промокод се деактивира, а при връщане към 1 участник всички цени се възстановяват.
- Всички билетни бутони използват един и същ акцентен цвят като VIP бутона.
- DSK webhook `/api/payments/dsk/webhook` приема само подписан payload с познат `orderId`/merchant reference и финализира поръчката идемпотентно.
- След плащане се генерира `/api/tickets/:token` и Resend изпраща имейл към купувача и уникалните имейли на участниците; `email_log` предотвратява автоматични дублирания.
- След създаване на поръчка Resend изпраща отделен `registration_received` имейл към всеки уникален имейл от D1, независимо от DSK; след плащане се изпраща отделният билетен email.
- Live migration, Worker secrets, DSK webhook configuration и Cloudflare Access са deployment стъпки извън GitHub push-а и изискват достъп до Cloudflare/DSK/Resend.
- Не се съхраняват никакви секрети в проекта.
- `backend/wrangler.toml` съдържа реалния D1 `database_id`.
- GitHub Actions workflow `.github/workflows/deploy-worker.yml` deploy-ва `backend/` към Cloudflare при push към `main`; преди deploy прилага D1 миграциите към `sofiasummit-events`.
- GitHub Actions използва `CLOUDFLARE_API_TOKEN`; публичният Cloudflare Account ID е зададен директно в workflow-а. Runtime secrets за Resend, DSK и Cloudflare Access не се съхраняват в GitHub repository-то.
- Реален email delivery тест не се изпълнява в CI, защото би изпратил писма и би създал registration side effect; проверката на имейлите изисква контролирана тестова регистрация и DSK webhook.
- Добавен е публичен Worker endpoint `/api/promo/quote`, който проверява кода и изчислява отстъпката без да създава поръчка. Всички активни кодове са проверени live с 20% отстъпка (Standard 89 € → 71,20 €).
- DSK плащанията и webhook-ът са активирани и са тествани. След успешно плащане Resend изпраща билетите; ръчният resend от админ панела е тестван успешно.
- GitHub Pages deployment-ът е фиксиран чрез премахване на счупените submodule артефакти `.sync` и `.upload-temp2`. Последният deployment commit е `3c5aaf4`.
- Подготвен е лек pointer-aware 3D tilt ефект върху основните карти, галерията, изображенията, бутоните и форматите на събитията. Hover/focus върху контролите добавя дискретен контур по ръба, а `prefers-reduced-motion` изключва анимацията.
- Към актуалния `main` са добавени и останалите визуални ефекти от локалния preview: интерактивна 3D сфера в галерията с drag/scroll управление и momentum, движещ се фон от снимки с линии, карта на София със Sofia Summit Center маркер и бутон за връщане в началото.
- В `index.html` има отделни секции `#podcasts`, `#productions` и `#initiatives`; `#services` сочи към съществуващата секция за услуги. Навигацията е responsive: широкият изглед е на един ред, а под 1180px се показва хамбургер меню.
- В `#featured-events` е добавена карта за „Кариерно кафе“ с дата 21 ноември 2026, връзка към `events/career-cafe/` и минивизуализацията `assets/event-photos/career-cafe-card.svg`, стилизирана по дизайна на събитието.
- Последното качване на функционалните промени е commit `56ba54a` (`feat: add Career Cafe event card`). Документацията се актуализира с текущата структура и responsive поведението.

## Homepage collaboration sections — 8 септември 2026 г.

- `#podcasts`, `#productions` и `#initiatives` са отделни responsive секции с меню навигация.
- Podcast картите са за Misia 100, „Забавни истории от бизнеса“ и EasyCreditTeam и отварят съответните YouTube канали.
- „Общи продукции“ съдържа „Забавни истории от бизнеса“ и RushForPractice; последната карта използва предоставения локален asset `assets/rush-for-practice.png`.
- Новите карти са включени в общия pointer-aware tilt ефект, hover/focus подсветката и reduced-motion защитата.
- „Инициативи, които правим“ съдържа Startup Fairs Bulgaria с логото от публичния сайт на инициативата.
- Preview: `http://127.0.0.1:8765/?preview-rosa-layout=1#productions`.
- Текущият пакет включва локалните промени в `index.html`, документацията и `assets/rush-for-practice.png`; следва commit и push към `main`.
