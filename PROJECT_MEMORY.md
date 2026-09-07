# Project memory

## Sofia Summit / Nail Business Re:Start

- Сайтът е на GitHub Pages: `https://sofiasummit.bg/`.
- Event URL: `https://sofiasummit.bg/events/nail-business-restart/`.
- Repository: `krasen2000kstanev-hub/sofiasummitcenter`.
- Event source file: `events/nail-business-restart/index.html`.
- Backend кодът е Cloudflare Worker + D1 в `backend/`; старият AWS endpoint, използван от front-end-а, в момента връща 404 и трябва да бъде заменен с реалния deployed Worker URL.
- Логове и Secrets Manager не са част от текущия минимален вариант.
- Капацитетът е 100 участници; формата приема число от 1 до 100.
- Билетите са Standard, Standard + запис и VIP.
- Master class изборът е разрешен за Standard + запис и VIP.
- Правните страници са `terms.html`, `privacy.html`, `cookies.html`, `recording.html` и `refund.html`.
- Всички правни препратки се отварят като отделни страници в нов таб и връщат към секцията `#legal`.
- DSK payment links и реални промокодове все още не са конфигурирани.
- Не се съхраняват никакви секрети в проекта.
- `backend/wrangler.toml` още съдържа placeholder за D1 `database_id`; live Worker deployment не е потвърден.
