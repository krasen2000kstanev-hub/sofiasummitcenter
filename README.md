# Sofia Summit Center

Актуално обобщение на български за направеното и оставащите задачи: [memory.md](memory.md) — обновено на 8 септември 2026 г. по локалните файлове и Git историята.

Website for Sofia Summit Center, an event and meeting venue in Studentski grad, Sofia. The public-facing content is primarily Bulgarian.

## Current structure

- `index.html` — public homepage and main site navigation.
- `styles.css`, `styles-enhancements.css`, `design-overrides.css`, `script.js` — homepage styling and behavior.
- `assets/` — venue photos, logos and supporting media.
- `events/` — standalone landing pages for individual events. The first event page is `events/nail-business-restart/index.html` for NAIL BUSINESS RE:START.
- `backend/` — Cloudflare Worker + D1 scaffold for event registration, ticket orders, payment webhooks and ticket emails.
- `admin.html` — lightweight admin view for event operations.

## Public deployment

- Public URL: <https://sofiasummit.bg/>
- Hosting: GitHub Pages from the `main` branch.
- Custom domain: `sofiasummit.bg` is defined in `CNAME`.
- `redesign-preview` is a preview branch; production changes go to `main`.
- Legacy WordPress/PHP files remain in the repository. On Apache hosting, `.htaccess` sets `index.html` as the preferred homepage before `index.php`.

## Local preview

There is no build step or package installation. Serve the repository with a local web server, or run `preview-server.ps1` and open `http://127.0.0.1:8765/`. A local server is recommended so relative asset paths behave like production.

The homepage includes a CodePen-inspired, pointer-aware 3D tilt effect on the main cards, buttons, event-format pills and selected gallery imagery. Hover states add a subtle edge highlight. The rotating gallery sphere keeps its own interaction model so the two effects do not conflict.

## Event backend status

The NAIL BUSINESS RE:START page is wired for registration through `https://api.sofiasummit.bg`. The Worker validates ticket type, promo codes, attendee data and capacity, then creates a temporary order. Payment is intended to continue on Bank DSK; a DSK webhook marks successful orders as paid and can trigger ticket email delivery.

Before production use, configure the Cloudflare D1 database ID, schema, DSK payment links and webhook secret, admin credentials, and Resend email settings as described in [`backend/README.md`](backend/README.md). The event form and API scaffold are not a substitute for a completed payment-provider and email deployment.

## Adding an event

Create a self-contained page under `events/<event-slug>/`, then add an event card or link to the homepage. Event links should use the label **„Научи повече“** and open in a new tab with `target="_blank"` and `rel="noopener"`.

## Contact

Sofia Summit Center  
ул. „8-ми декември“ 13, София  
+359 894 202 086  
tsvetelin@pleggi.com

## Homepage collaborations and effects

- Added responsive sections `#podcasts`, `#productions` and `#initiatives` with navigation links.
- Podcast cards link to the Misia100, „Забавни истории от бизнеса“ and EasyCreditTeam YouTube channels and use channel video thumbnails.
- „Общи продукции“ includes „Забавни истории от бизнеса“ and RushForPractice. RushForPractice uses the provided local artwork at `assets/rush-for-practice.png` and links to its YouTube channel.
- The collaboration cards use the same tilt, hover edge highlight, focus and reduced-motion behavior as the rest of the site.
- Preview: `http://127.0.0.1:8765/?preview-rosa-layout=1#productions`.

## Homepage services and FAQ

- Added a separate `#creative-services` section for video, photography, editing, landing pages and event organisation.
- The navigation link „Услуги“ points to the new section; the existing equipment section remains at `#services`.
- Added FAQ entries covering the services, 360-degree photo booth and connecting clients with Sofia Summit Center partners.
- The new service cards reuse the existing responsive card and tilt effects.

## Homepage UX order

- The approved homepage flow is: hero, spaces, equipment, services, upcoming events, gallery, podcasts, productions, initiatives, about, FAQ, request, partners and contact.
- The order prioritizes the visitor path: understand the offer, see proof, explore collaborations, then send an inquiry.
- The preview keeps the existing visual language and mobile safeguards; no content was removed.

## Актуално състояние — 15 септември 2026 г.

- Главното меню вече обхваща всички основни секции на началната страница: пространства, оборудване, събития, предстоящи събития, галерия, подкасти, продукции, инициативи, услуги, за нас, въпроси, запитване, партньори и контакти.
- Менюто е компактно и се отваря като анимиран страничен панел; бутонът е до логото и се преобразува в бутон за затваряне.
- NAIL BUSINESS RE:START поддържа свободно въвеждане на броя участници и показва подаръци на стойност над 100 EUR за всеки билет.
- Правните документи за събитието са на отделни страници в `events/nail-business-restart/`.
- Плащанията през ДСК, Cloudflare D1 и имейл услугата изискват реална конфигурация преди продукционна употреба.
