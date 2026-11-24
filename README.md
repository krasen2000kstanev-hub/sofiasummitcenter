# Sofia Summit Center


Website for Sofia Summit Center, an event and meeting venue in Studentski grad, Sofia. The public-facing content is primarily Bulgarian.

## Current structure

- `src/pages/index.html` — public homepage; the build turns it into `index.html`. It sends old one-page links such as `/#spaces` to the page that replaced that section.
- `styles.css`, `styles-enhancements.css`, `design-overrides.css`, `script.js` — homepage styling and behavior.
- `assets/` — venue photos, logos and supporting media.
- `events/` — standalone landing pages for individual events. The first event page is `events/nail-business-restart/index.html` for NAIL BUSINESS RE:START.
- `events/bulgarian-hr-network/` — public Bulgarian HR Network page. Its next meeting is on 11 November 2026 with Iliyana Tarnina ("Read the Room. Read the Person."). The hero carousel and page sections show photos from the 28 October 2026 meeting, and the event is featured alongside NAIL BUSINESS RE:START and Career Cafe on the homepage.
- `events/hr-rushforpractice/misii/` — student Mission Control with team, active missions, submissions, notifications and points history. Mentor/admin access uses the separate `/events/hr-rushforpractice/misii/mentor/` entry and its mission, notification and review panel. Google sign-in determines the role; the API enforces role boundaries.
- `events/hr-rushforpractice/` — public HR:Rush for Practice page, including participant stories with photos, mentor profiles and an HR feedback section. Current HR feedback section lists Kaufland, Ficosota and Sportal as upcoming contributors; approved quotes are still to be added.
- `backend/` — Cloudflare Worker + D1 scaffold for event registration, ticket orders, payment webhooks and ticket emails.
- `admin.html` — lightweight admin view for event operations.

## Public deployment

- Public URL: <https://sofiasummit.bg/>
- Hosting: GitHub Pages from the `main` branch.
- Custom domain: `sofiasummit.bg` is defined in `CNAME`.
- `redesign-preview` is a preview branch; production changes go to `main`.
- Legacy WordPress/PHP files remain in the repository. On Apache hosting, `.htaccess` sets `index.html` as the preferred homepage before `index.php`.

## Multi-page site

New pages live in `src/pages/<path>/index.html`. Each starts with `<!--page {"title":"…","description":"…"} -->` and contains only the page's own sections; `scripts/build-site.js` wraps it in `src/layout.html` and the header and footer from `src/partials/`, and writes it to `_site/<path>/`. Styles are in `site.css`, behavior in `site.js`. Optional fields: `image`, `jsonld`, and `alt` for the same page in the other language.

The build also adds breadcrumb and FAQ structured data from each page's markup, and writes `sitemap.xml` from all built pages plus the extra URLs listed in the repository's `sitemap.xml` (event and legal pages). Add a new standalone event page there.

Build and preview with `bash scripts/build-pages.sh`, then `node preview-server.js _site`. Run the checks with `node --test scripts/build-site.test.js scripts/prices.test.js`.

## Local preview

There is no build step or package installation. Serve the repository with a local web server, or run `preview-server.ps1` and open `http://127.0.0.1:8765/`. A local server is recommended so relative asset paths behave like production.

The HR:Rush student dashboard is available at `http://127.0.0.1:8765/events/hr-rushforpractice/misii/`; mentor entry is at `/events/hr-rushforpractice/misii/mentor/`. Both use Google sign-in and route users to the role-appropriate interface.

The homepage includes a CodePen-inspired, pointer-aware 3D tilt effect on the main cards, buttons, event-format pills and selected gallery imagery. Hover states add a subtle edge highlight. The rotating gallery sphere keeps its own interaction model so the two effects do not conflict.

## Project map and maintenance

The local `graphify-out/` directory contains a Graphify knowledge graph of the codebase: `graph.html` is the interactive map, `graph.json` is the machine-readable graph, and `GRAPH_REPORT.md` is the plain-language report. Rebuild it after structural changes with `graphify <project-path> --update`. The graph is documentation only; it does not deploy or modify the live site. Review the generated diff before publishing it to GitHub.

## NAIL BUSINESS RE:START — production update — 23 октомври 2026 г.

- Събитието е насрочено за 15 ноември 2026 г. от 09:00 ч. в Sofia Summit Center.
- Публичният текст за капацитет показва „Остават 80 свободни места от 100.“; backend capacity остава 100.
- Добавено е официалното лого на Банка ДСК в партньорската секция на началната страница.
- Активните промокодове се управляват в D1, таблица `promo_codes`.

## Event backend status

The NAIL BUSINESS RE:START page is wired for registration through the Cloudflare Worker `https://sofiasummit-events-api.krasen2000-k-stanev.workers.dev`. The Worker validates ticket type, promo codes, attendee data and the 100-person capacity, then creates a temporary order in D1. A confirmed Bank DSK webhook marks the order as paid and sends an individual Bulgarian PDF ticket to each attendee through Resend. Explicit admin resend is available and webhook processing is idempotent.

Активните промокодове се управляват в D1, таблица `promo_codes`.

The PDF generator uses an embedded Arial font for Cyrillic and follows the approved Canva-inspired visual layout. It contains the attendee name, ticket type, order number, event date/time, venue and address, without a QR code. Configure secrets and DSK payment links as described in [`backend/README.md`](backend/README.md).

## Career Cafe — текущ статус

The public page at `events/career-cafe/` uses the approved Bulgarian copy for the value proposition and program. The ticket tiers are Espresso — 12 €, Doppio — 24 € and Lungo+ — 36 €; the hero copy also starts at 12 €. The brand is consistently written as **Pleggi**. Visible dash punctuation was removed from the visitor-facing copy and replaced with commas or short sentences. The helper section remains unchanged until its participants are confirmed. The preview is available through the local preview server at `http://127.0.0.1:8765/events/career-cafe/`.

The registration form now marks all required fields with a red border and displays a red required-field message when submission is attempted with missing data. Ticket selection also shows a dedicated red validation message. The Doppio ticket is no longer visually preselected or labeled as most popular. The optional textarea asks **„Защо съм на това събитие?“**. The contact footer includes `+359 894 202 086` alongside `tsvetelin@pleggi.com`.

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
The request form posts name, email, phone, space, date, guests and message to POST /inquiries. Confirmed dates are read from GET /availability?space=.... Terraform provisions DynamoDB storage and SES notifications to both addresses in inquiry_notify_emails. The form uses window.SOFIA_API_BASE (defaults to the same origin).

## HR:Rush applications — production status

The public form posts to `POST /api/apply` on the Cloudflare Worker `sofiasummit-events-api`. Applications are stored in D1 with durable delivery jobs for the private Google Sheet and Resend email notifications. The production Worker is configured for season 9, the organizer notification goes to адреса от `wrangler.toml` without candidate details, and a five-minute cron retries failed deliveries. The Google Sheet remains private; only the dedicated service identity `HR Rush Applications Writer` has Editor access to it.

Production deployment was completed on 25 September 2026. The D1 migration ledger reports no pending migrations; local automated tests pass 4/4. Live checks returned HTTP 200 for health, HTTP 400 for an empty invalid application (no write), and HTTP 401 for the admin applications list without credentials. An authorized end-to-end test submitted one clearly marked synthetic application for each role (student, company, university); all three returned HTTP 201 and each D1 record, private Sheet row, organizer notice, and candidate confirmation reached `sent`. The three test records, their nine outbox jobs, and Sheet rows 2–4 were then removed; the Sheet retains its header only, with no test data left in D1. See [`backend/README.md`](backend/README.md) for configuration and rollback details.

## HR:Rush student and mentor portals

The student portal at `/events/hr-rushforpractice/misii/` shows the signed-in student's team, teammate, individual points and shared team points. Mission creators use the separate `/events/hr-rushforpractice/misii/mentor/` portal; server-side role checks prevent mentors from reading student-only team/history endpoints, and students cannot access mentor review or notification endpoints. Run `cd backend && npm test` for the role-separation checks.

## HR:Rush page updates — 30 September 2026

- The season process cards are numbered sequentially 01–04.
- Company and university applications use matching organization labels and include a required position field; the company CTA links to the form and preselects the company role.
- Removed the decorative circle from the final call-to-action section.

## HR:Rush season 9 ranking and themes — November 2026

- `events/hr-rushforpractice/ranking/` reads season 9 live from Google Sheet `1KQmI2hdv8pNTzA2eTnZAaU8whP-NJep3k2CSGB0dKRY` (gviz JSON). Tabs: „Обща класация“ gid 0, „Компании“ gid 1451737775, university rosters НБУ 434191220, СУ 1017411608, УНСС 1743708126, УЗФ 530263534, УниБИТ 1480888565. No season 8 data remains in the page.
- Team columns A–N: rank, university, team, company, activity, missions, Pleggi profiles, found candidates, easy/medium/hard found (I/J/K), interviews, hired, total. Only rows with a numeric rank are teams; duplicates are removed by `university::team`. Companies are rows of the „Компании“ tab that have a representative.
- Team cards show students with emails (from the university tabs) and the company representative with email; company cards show the representative and every team that works with the company. Phones from the sheet are never shown.
- Company names match case-insensitively, ignore trailing spaces, treat „Pleggi“ as „Плеги“, and joint teams such as „Плеги / Глово“ count for both companies.
- On phones the team/company modal scrolls itself and locks the page behind it.
- Light/dark mode: `events/hr-rushforpractice/hrr-theme.js` adds a ☀/☾ button to the landing page, missions and ranking. Each page keeps its default in `<html data-theme>` (landing and missions light, ranking dark); the visitor's choice is saved in `localStorage` key `hrr-theme` and shared across the three pages. Theme CSS lives in `#hrr-dark-theme` (landing), the end of `misii/mission-dashboard.css`, and `#hrr-light-theme` (ranking).

## HR:Rush platform automation and admin tools — November 2026

**Sheet sync (Worker cron, every 5 minutes).** `HRR_ROSTER_SHEET_ID` in `backend/wrangler.toml` points at the season sheet. The cron (`syncRoster`) reads the university tabs (НБУ, СУ, УНСС, УЗФ, УниБИТ) into `hrr_team_roster`, writing only new or moved emails, and sets each student's display name from the sheet. `syncMissionPointsToSheet` writes each team's approved mission points (including mentor bonus) into column F of the ranking tab, found by gid 0. The sheet must stay shared as Editor with `hrr-applications-writer@hr-rush-for-practice.iam.gserviceaccount.com`. Column F is filled by the site; do not edit it by hand.

**Sign-in.** The access token is kept in `localStorage` (`hrr_access_token`), so it survives new tabs; the ranking page uses it for „Моят екип“. `HRR_BLOCKED_EMAILS` (comma list in `wrangler.toml`) refuses sign-in for listed addresses. Student preview for staff is decided by the server (`/api/hrr/me` → `canPreview`), not by emails in the page.

**Missions.** Students can attach a photo (compressed in the browser to ≤1 MB, stored as a data URL), see what they sent and edit it while it is pending (`PATCH /api/hrr/submissions/:id`). Mentors review per mission (segmented queue), can send feedback without deciding, add bonus points on approval, and attach a picture to a mission with a „Виж като студент“ preview. Admins can mark missions as done for a student („Отбележи като изпълнени“).

**Unknown sign-ins.** Roster alerts tick themselves off once the email has a team, is staff or is blocked; admins can also tick one off by hand, email the person (`Пиши имейл`, via Resend, replies go to the admin), and add students who filled the in-app form („Нямаш код?“ → `hrr_roster_requests`) with one click („Добави в екипа“).

**Migrations added:** 0022 (submission image, bonus), 0023 (mission image), 0024 (notification resolved), 0025 (notification contacted), 0026 (roster requests). They run automatically in `.github/workflows/deploy-worker.yml`.

**Look.** Landing, missions and ranking share the HR:Rush wordmark and teal accent; light/dark switch sits in the header on missions and ranking.

**Panel navigation (11 Nov 2026).** The missions page has a ☰ on every width: on desktop it collapses/expands the sidebar (remembered in `localStorage` key `hrr-sidebar`), on phones it opens the drawer. The top bar is sticky, the mentor menu links to every section (Отбори и студенти, Изпълнения за проверка, Всички мисии, Известия, Нова мисия) and a ↑ button appears after scrolling. Below 1100 px the mentor columns stack.

**Sheet note.** Every team needs its own numbered row in „Обща класация на екипи“ for points to be written and for it to show in the ranking (СУ Екип 21 was added as №138 on 11 Nov).

## HR:Rush missions — evidence, feedback, bonuses and roles (12 Nov 2026)

- **Evidence:** up to 10 links (stored one per line in `evidence_url`), an optional photo and one document (PDF/Office/TXT ≤1 MB, table `hrr_submission_files`, download via `GET /api/hrr/mentor/submissions/:id/document`). Students edit a pending submission; mentors then see „✎ Редактирано“ (`edited_at`) and get a notification.
- **Conversation:** mentor feedback („Изпрати“), approve/reject notes and student replies form a thread per submission (`hrr_submission_comments`, `POST /api/hrr/submissions/:id/comments`). Feedback, approval and rejection are also emailed to the students via Resend; the email points to replying in the platform (reply-to is the reviewing mentor).
- **Bonus points:** admins load a team (university + number) and give points to the whole team or to one member by name (`hrr_bonus_awards`, `GET /api/hrr/admin/team-lookup`, `POST /api/hrr/admin/bonus`). Bonuses count in profile, team points, sheet column F and the ranking; negative values correct mistakes.
- **Roles:** the panel allowlist accepts `mentor`, `admin` and `viewer` (read-only, e.g. a university teacher). A viewer is stored as `student` in `hrr_users` and gets `viewer` in memory; the server refuses every change for viewers. Admins grant access by email in „Достъп до панела по имейл“.
- **Navigation:** ☰ on every width, sticky top bar, section links, ↑ button, and a „🏆 Класация“ shortcut; the phone mission route shows 3 stops per row and every stop opens the mission detail.
- **Migrations added:** 0027 (documents, edited_at), 0028 (bonus awards), 0029 (viewer role in allowlist), 0030 (submission comments).

## HR:Rush team folders in Google Drive (12 Nov 2026)

- Each team gets edit access to only its own folder, "Студенти от Сезон 9 / <УНИ> / Екип N - <УНИ>". The folder holds the team's table and a "CV-та" subfolder.
- Sharing is done by `backend/apps-script/hrr-drive-sync.gs`, which runs in Apps Script as the Drive owner every 10 minutes. It posts the folders it finds to `POST /api/hrr/drive/sync`. The Worker accepts only an OAuth token that Drive confirms belongs to `HRR_DRIVE_OWNER`. The Worker stores `hrr_teams.drive_folder_id` (migration 0032) and returns the login emails of each team's active members.
- The script shares as the owner. This lets "editors can't share" stay on for every folder and table; a service account cannot share in that state. The script removes only the people it added itself.
- In the platform, students see "📁 Отвори папката на екипа" in "Моят отбор" and in the menu. Admins see "📁 Всички папки" (`HRR_DRIVE_ROOT_ID`). Links use `?authuser=<login email>`.
- `HRR_DRIVE_ONLY` in `wrangler.toml` limits the sync to pilot team ids. Leave it empty to include all teams.

## HR:Rush evidence photos and documents (13 Nov 2026)

- A submission can carry up to 5 photos. The browser compresses each one to 1 MB or less. Photos are stored one row each in `hrr_submission_images`; migration 0033 moved the old `evidence_image` values there. `GET /api/hrr/mentor/submissions/:id/image?i=N` returns photo N. In the lists, `has_image` and `has_evidence_image` now give the photo count.
- Documents can be up to 4 MB. R2 is not enabled and a D1 row holds at most 2 MB, so the data URL is split into roughly 1 MB parts in `hrr_submission_file_parts`. `hrr_submission_files` keeps the file name and type.
- When a student edits a submission without choosing new photos, the old photos stay. Choosing new photos replaces all of them.

## HR:Rush remembered sign-in (13 Nov 2026)

- A Google ID token is valid for only one hour, so students had to sign in again every time. Now the page swaps the Google sign-in once for a 60-day platform session through `POST /api/hrr/auth/session`. The session token looks like `hrrs_…`, and only its SHA-256 is kept in `hrr_sessions` (migration 0034).
- On every request the role is read again from `hrr_mentor_allowlist`, and blocked emails are refused. Granting or removing panel access therefore works without a new sign-in.
- "Изход" calls `POST /api/hrr/auth/logout`, which deletes the session.

## HR:Rush activity points (13 Nov 2026)

- Points given through the admin form („Точки активност на екип или на човек от екипа“, table `hrr_bonus_awards`) are activity points, not mission points. The 5-minute sync writes them to column E „Точки Активност“ of the ranking tab. Approved missions and the mentor's bonus on approval go to column F. The ranking API returns `activityPoints` next to `missionsPoints`.
- Since migration 0035, every manual award has a `kind` set by the admin form: `activity` (the default) goes to column E and `mission` goes to column F, through `missions_points`.
- The review queue has a „Виж по екип“ picker. Choosing a team shows which mission each member sent and its status, and lists only that team's submissions below.
- `POST /api/hrr/mentor/submissions/:id/bonus` changes the bonus on an already approved submission. It is for the mission's mentor or an admin. The student gets an in-platform notification, and the ranking and sheet pick the change up on the next sync.

## HR:Rush — mentor emails, one source for points (16 Nov 2026)

- **Mentor email on every submission.** `emailMentor()` in `backend/src/hrr.js` sends the mission's mentor a Resend email (who sent it, which mission, link to `misii/?portal=mentor`). A mail failure is logged and never blocks the submission. It goes to the email the mentor signs in with.
- **A mentor sees only submissions of missions where they are `mentor_user_id`.** A mission created by an admin stays with the admin until the admin picks a mentor in „Редактирай“. Check this first when a mentor says submissions do not show.
- **Duplicate mentor accounts.** Migration 0036 moved one mentor's missions, inbox, comments and sessions from the seeded account to the one he signs in with. `HRR_EMAIL_ALIASES` (Cloudflare variable, `second@x=main@y,…`, not in the repo because it is public) signs a second Google address into the main account.
- **Every team number comes from the sheet.** The ranking page shows column N (total), E (activity) and F (missions) of „Обща класация на екипи“ as they are; it no longer overrides them with live API numbers. „Откъде идват точките“ shows Мисии + Активност + Кандидати (N − E − F, so the sheet's own formula decides) with the candidate counts G–M under it.
- **Student portal „Моят отбор“** shows the sheet total and the same breakdown. The cron writes E/F, re-reads A:N and stores it in `hrr_sheet_snapshot` (migration 0037); `GET /api/hrr/team` returns it as `sheet`. An approved mission reaches the sheet, and so the site, within 5 minutes. Personal points („Одобрени точки“, individual points) still come from the database, because the sheet has no per-student points.
- **Sheet editing rules.** Columns G–M can be typed by hand. E and F are overwritten by the site every 5 minutes. A–C identify the team (do not rename). N is the total formula; 25 rows use 3× Pleggi instead of 2× — the site shows whatever the sheet computes.
- **Migrations added:** 0036 (duplicate mentor merge), 0037 (`hrr_sheet_snapshot`). Tests: `cd backend && npm test` (42).


## HR:Rush — Drive tables (16 Nov 2026)

These live in Google Drive, not in this repo; the site does not read them.

- **Team tables** (one per „Екип N - <университет>“ folder, 137): column A „Име“ was added before „Телефон“.
- **Company tables** (folder „Компании“, 16, one per company): column J „Трудност“ (лесна / средна / трудна) sits next to I „Сфера“ (the candidate's position). Since 23 Nov the worker fills it — see below. The columns after J moved one to the right.
- Any script that reads these tables by column number (e.g. `cv-check.gs`, not run yet) must be checked against the new layout before it runs.

## HR:Rush — sheet sync and company difficulty (22–23 Nov 2026)

- **Rows with two teams in „Обща класация на екипи“** (e.g. „НБУ / СУ“ + „Екип 1“, „НБУ / СУ“ + „Екип 43 / Екип 21“) are now matched too (`sheetRowKeys` in `backend/src/hrr.js`). Each such row maps to the team(s) that have no row of their own, so nothing is counted twice. The sheet itself was not changed. 6 activity points that were typed by hand on the „Екип 43 / Екип 21“ row were added on the site for НБУ Екип 43 so the sync keeps them.
- **Mission reviews** (`misii/`): the filter chips show only missions with waiting submissions; fully reviewed missions fold into „✓ Завършени (N)“.
- **„Трудност“ in the company tables is automatic** (`backend/src/hrr-difficulty.js`, every 5 min in the cron): the worker lists the folder `HRR_COMPANIES_FOLDER_ID` (Drive API), reads `HRR_POSITIONS_SHEET_ID` („Позиции“, A company, B position, D level) and fills J from I „Сфера“. Each listed position is looked up in the same company first, then in all companies; several → the hardest. It writes only empty cells or cells with an outdated level; other text is never overwritten; no match → left for a person. Column J has a лесна / средна / трудна dropdown.
- **Needs:** Google Drive API enabled in the Google Cloud project `hr-rush-for-practice` (done 23 Nov) and the folder shared with `hrr-applications-writer@…` (it is). New company tables in the folder are picked up on their own.
- Points for missions reach column F within 5 minutes of approval (checked in the sheet's version history for 17–18 Nov).


## HR:Rush — merged teams and student emails (24 Nov 2026)

- **СУ Екип 14 and СУ Екип 21 are one team now.** In „Обща класация на екипи“ the separate rows „СУ Екип 21“ and „СУ Екип 14“ were deleted; only the row „СУ“ + „Екип 14 / Екип 21“ is left, so the sync writes the sum of both teams' mission points into it (53 on 24 Nov). On the site they are still two teams; nothing changed in the database.
- **To merge two teams:** keep one row with both names („Екип 14 / Екип 21“) and delete their own rows — while a team has its own row, the combined row gets nothing. Column E is overwritten by the site's activity awards, so any activity typed by hand must be added as „Ръчни точки“ in `misii/` (here +6 for СУ Екип 14, „Активност от общия ред с Екип 21“).
- **Ranking page — student emails** (`ranking/index.html`): the „СУ“ tab has a second block below the roster with the same team numbers and no emails; it was overwriting the contacts of every СУ team. Rows without an email are now skipped. A row with several teams shows the students of all of them (`contactsFor`).
