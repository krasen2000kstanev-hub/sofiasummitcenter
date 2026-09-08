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
