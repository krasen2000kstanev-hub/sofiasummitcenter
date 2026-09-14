# NAIL BUSINESS RE:START

Статична страница за събитието на Sofia Summit Center.

## Sofia Summit Center начална страница

Началната страница включва отделни секции за подкасти, общи продукции и инициативи, както и връзка към услугите. Менюто остава на един ред при широк екран и се превръща в хамбургер меню при по-тесни екрани, без да застъпва логото.

В секцията „Предстоящи събития“ има карта за NAIL BUSINESS RE:START и карта за „Кариерно кафе“. Картата на „Кариерно кафе“ използва компактна SVG минивизуализация в цветовете и типографията на самото събитие: `assets/event-photos/career-cafe-card.svg`. Подробната страница е `events/career-cafe/index.html`.

## Публикувана версия

- Събитие: https://sofiasummit.bg/events/nail-business-restart/
- GitHub repository: https://github.com/krasen2000kstanev-hub/sofiasummitcenter
- Публикуване: GitHub Pages, branch `main`

Началната страница има лек CodePen-inspired 3D tilt ефект върху основните карти, галерията, изображенията, бутоните и форматите на събитията. При hover върху бутоните и форматите се появява дискретен контур по ръба; ефектът се изключва при `prefers-reduced-motion`.

Галерията включва интерактивна 3D сфера с drag и scroll управление, плавен scroll momentum, движещи се свързани снимки и стилизирана карта на София на заден план. Има и бутон за връщане в началото на сайта.

## Файлова структура

- `index.html` — локален preview на event страницата.
- `events/nail-business-restart/index.html` — публикуваният event front-end.
- `events/nail-business-restart/terms.html` — общи условия.
- `events/nail-business-restart/privacy.html` — политика за поверителност.
- `events/nail-business-restart/cookies.html` — политика за бисквитки.
- `events/nail-business-restart/recording.html` — уведомление за заснемане.
- `events/nail-business-restart/refund.html` — отказ, анулиране и прехвърляне.

Юридическите страници използват общ формат: тъмен header, лого, бял content card и връщане към секцията `#legal`.

## Регистрационна форма

Формата събира име, имейл, телефон, тип билет, брой участници и допълнителните имена/имейли/телефони. Полето за промокод е премахнато от регистрационната форма. Backend кодът е Cloudflare Worker + D1.

Live API: `https://sofiasummit-events-api.krasen2000-k-stanev.workers.dev`. D1 базата е `sofiasummit-events` с binding `DB`; идентификаторът е записан в `backend/wrangler.toml`.

Frontend-ът изпраща регистрациите към `/api/orders`, включително `agreeTerms`, `masterClasses`, промокода и данните за всички участници, след което пренасочва към върнатия DSK payment link.

Цената се преизчислява автоматично при писане/промяна на промокода, типа билет и броя участници. При липсващ код или непълен групов запис се показва стандартната цена, а backend-ът валидира всички участници преди създаване на поръчка.

Изборът на master class е активен за `Standard + запис` и `VIP`, но е деактивиран за `Standard`. Броят участници е цяло число от 1 до 100.

## Билети

Има три варианта: Standard — 89 EUR, Standard + запис — 114 EUR и VIP — 129 EUR.

Подаръчният пакет на стойност 100 EUR е показан най-отгоре във всеки билет. Standard, Standard + запис и VIP вече имат активни DSK payment URL адреси в `SITE_CONFIG`. Бутоните използват един и същ акцентен цвят.

Промокодовете вече се управляват в D1 през защитения Worker admin интерфейс `/admin/promos`. При 1 участник отстъпката е 20%, а при 2+ участници — 25%. За всяка комбинация промокод + билет + брой участници се конфигурира отделен DSK link; frontend-ът не приема цена от клиента.

В admin интерфейса списъкът показва броя употреби, а „Използвания“ показва всеки ред с промокод, купувач, имейл, билет, участници, суми и статус.

Начално са добавени кодовете `BIBI20`, `EVA20` и `EMI20`. Те са активни за всички билети, но изискват конфигурирани DSK payment links преди да могат да се използват за плащане.

Конфигурирани са 20% payment links за 1 участник и 25% групови payment links за 2+ участници за трите билета. При 3+ участници отстъпката остава 25% без допълнително намаление и се използва същият групов link.

## Backend статус

- Реализирани са: health/event API, D1 поръчки, капацитет до 100 места, участници, server-side промо quote, admin CRUD за промокодове и payment links, DSK webhook, ticket URL и Resend имейли към купувача и уникалните имейли на участниците.
- При записване в D1 Worker-ът изпраща отделен имейл към всеки уникален имейл на купувач/участник с потвърждение, че регистрацията е записана в сайта; DSK се използва само за плащането и последващото payment confirmation.
- DSK webhook трябва да изпраща `orderId`/merchant reference, който съвпада с локалната поръчка; без него плащане не се маркира автоматично.
- Имейлите изискват `RESEND_API_KEY` и `EMAIL_FROM`; webhook-ът изисква `DSK_WEBHOOK_SECRET`.
- `/admin/promos` трябва да бъде публикуван зад Cloudflare Access. Basic Auth остава само fallback за локална настройка.

## Локален preview

Стартирай локален статичен сървър от директорията на проекта и отвори:

`http://127.0.0.1:8766/index.html#tickets`

## Публикуване

Публикуваното repository е локалното `.publish-repo`. След промени копирай актуалните файлове в `.publish-repo/events/nail-business-restart/`, направи commit, изпрати го в `origin main` и провери live страницата.

Не записвай AWS ключове, GitHub токени, Resend ключове, DSK secret или Cloudflare Access secrets в repository-то.

### Автоматичен Worker deploy

`.github/workflows/deploy-worker.yml` се стартира при push към `main`, когато има промяна в `backend/`. Workflow-ът първо прилага D1 миграциите към `sofiasummit-events`, след което deploy-ва Worker-а от `backend/`.

GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Resend, DSK и Cloudflare Access secrets остават конфигурирани само в Cloudflare Worker-а. Реален email delivery тест изисква тестова регистрация и реален Resend/DSK webhook flow; не се изпращат тестови писма автоматично при CI.

## Начална страница — подкасти, продукции и инициативи

- `#podcasts`, `#productions` и `#initiatives` са отделни responsive секции с връзки от менюто.
- Podcast картите водят към съответните YouTube канали и използват channel video thumbnails.
- „Общи продукции“ включва „Забавни истории от бизнеса“ и RushForPractice. RushForPractice използва `assets/rush-for-practice.png` и води към `https://www.youtube.com/@RushforPractice`.
- Картите използват общите tilt, hover edge highlight, focus и reduced-motion ефекти.

## Услуги и FAQ

- Отделната секция `#creative-services` включва видео, фото, монтаж, лендинг страници и организация на събития.
- Менюто води към новата секция, а оборудването остава отделно на `#services`.
- FAQ секцията описва услугите, 360-градусовата фотобутка и свързването с наши партньори при организация на събития.
- Картите използват съществуващите responsive и tilt/hover/focus ефекти.

## UX подредба на началната страница

- Одобреният поток е: начало, пространства, оборудване, услуги, предстоящи събития, галерия, подкасти, общи продукции, инициативи, за нас, въпроси, запитване, партньори и контакти.
- Редът следва потребителския път: какво предлагаме, доказателства и примери, след това запитване.
- Запазени са съдържанието, визуалният стил и responsive поведението.
