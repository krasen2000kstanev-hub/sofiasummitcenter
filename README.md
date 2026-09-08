# NAIL BUSINESS RE:START

Статична страница за събитието на Sofia Summit Center.

## Публикувана версия

- Събитие: https://sofiasummit.bg/events/nail-business-restart/
- GitHub repository: https://github.com/krasen2000kstanev-hub/sofiasummitcenter
- Публикуване: GitHub Pages, branch `main`

Началната страница има лек CodePen-inspired 3D tilt ефект върху основните карти, галерията, изображенията, бутоните и форматите на събитията. При hover върху бутоните и форматите се появява дискретен контур по ръба; ефектът се изключва при `prefers-reduced-motion`.

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

Формата събира име, имейл, телефон, промокод, тип билет, брой участници и допълнителните имена/имейли/телефони. Backend кодът е Cloudflare Worker + D1.

Live API: `https://sofiasummit-events-api.krasen2000-k-stanev.workers.dev`. D1 базата е `sofiasummit-events` с binding `DB`; идентификаторът е записан в `backend/wrangler.toml`.

Frontend-ът изпраща регистрациите към `/api/orders`, включително `agreeTerms`, `masterClasses` и данните за всички участници.

Изборът на master class е активен за `Standard + запис` и `VIP`, но е деактивиран за `Standard`. Броят участници е цяло число от 1 до 100.

## Билети

Има три варианта: Standard — 89 EUR, Standard + запис — 114 EUR и VIP — 129 EUR.

Подаръчният пакет на стойност 100 EUR е показан най-отгоре във всеки билет. DSK payment URL адресите още трябва да бъдат добавени в `SITE_CONFIG`, когато бъдат предоставени от Банка ДСК. До тогава бутоните за плащане остават безопасно неактивни.

Промокодовете се добавят в `SITE_CONFIG.promoCodes`. За всяка намалена цена е нужен съответен реален DSK payment URL.

## Backend статус

- Работи: health endpoint, event data, регистрация, капацитет до 100 места, записване на допълнителни участници и промо кодове в D1.
- Не е завършено: DSK плащане/webhook, автоматични имейли, ticket URL след плащане и admin export.
- Имейлите изискват Resend API key; DSK изисква payment links и webhook формат от банката.

## Локален preview

Стартирай локален статичен сървър от директорията на проекта и отвори:

`http://127.0.0.1:8765/events/nail-business-restart/`

## Публикуване

Публикуваното repository е локалното `.publish-repo`. След промени копирай актуалните файлове в `.publish-repo/events/nail-business-restart/`, направи commit, изпрати го в `origin main` и провери live страницата.

Не записвай AWS ключове, GitHub токени или други секрети в repository-то.
