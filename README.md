# Sofia Summit Center

Актуално обобщение на български за направеното и оставащите задачи: [PROJECT_MEMORY.md](PROJECT_MEMORY.md) — обновено на 17 септември 2026 г.

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

The NAIL BUSINESS RE:START page is wired for registration through the Cloudflare Worker `https://sofiasummit-events-api.krasen2000-k-stanev.workers.dev`. The Worker validates ticket type, promo codes, attendee data and the 100-person capacity, then creates a temporary order in D1. A confirmed Bank DSK webhook marks the order as paid and sends an individual Bulgarian PDF ticket to each attendee through Resend. Explicit admin resend is available and webhook processing is idempotent.

Current active promo codes: `BIBI20`, `EVA20`, `EMI20`, `IRINA20`, `LINA20`, `ILIYANA20`, `ZLATINA20`, `IREN20`, `BORISLAVA20`, `ELENA20` and `OGI20`. They provide 20% server-side discount. The `/api/promo/quote` endpoint calculates the discounted amount before an order is created.

The PDF generator uses an embedded Arial font for Cyrillic and follows the approved Canva-inspired visual layout. It contains the attendee name, ticket type, order number, event date/time, venue and address, without a QR code. Configure secrets and DSK payment links as described in [`backend/README.md`](backend/README.md).

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

## Studio photo updates — 16 септември 2026 г.

- Added optimized, non-repeating WebP photos from the approved studio folder under ssets/studio/.
- Studio photos are used only for the Podcast Studio and About/space imagery; original event-hall and meeting-room photos remain unchanged.
- Local preview: http://127.0.0.1:8766/index.html#spaces.


## Inquiry API
The request form posts name, email, phone, space, date, guests and message to POST /inquiries. Confirmed dates are read from GET /availability?space=.... Terraform provisions DynamoDB storage and SES notifications; set inquiry_notify_email in your tfvars before deployment. The form uses window.SOFIA_API_BASE (defaults to the same origin).
