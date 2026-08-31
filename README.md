# Sofia Summit Center

Website source for Sofia Summit Center, a meeting and event venue in Studentski grad, Sofia. The public-facing content is primarily in Bulgarian.

## What is included

- A responsive static landing page in [`index.html`](index.html), styled by [`styles.css`](styles.css) and enhanced with [`script.js`](script.js).
- Venue sections for conference rooms, temporary offices, events and meetings, services, venue information and contact details.
- Local image assets and downloadable venue materials under `wp-content/uploads/`.
- A WordPress installation with the custom `SofiaSummit` theme in `wp-content/themes/sofiasummit/`.
- WordPress templates for the home page, services, halls, events, news, team, partners, contact and privacy policy pages.
- Installed WordPress plugins, including Advanced Custom Fields, Contact Form 7, Cookie Notice, Jetpack Boost, Yoast SEO and WP Super Cache.

## Running the static page locally

The static page has no build step or package installation. Serve the repository directory with any local web server, then open the local address in a browser. Opening `index.html` directly also works for basic inspection, but a local server is recommended so asset paths behave like production.

## WordPress deployment

For the CMS-backed site, deploy the WordPress files to a PHP-enabled host, configure the database and `wp-config.php`, and activate the `SofiaSummit` theme from the WordPress admin area. The theme requires PHP 5.6 or newer according to its metadata; use a currently supported PHP version in production when the hosting environment allows it.

The repository intentionally excludes sensitive or environment-specific files such as `wp-config.php`, SQL exports, WordPress core administration directories, and hosting backup archives. Do not commit passwords, API keys or access tokens.

## Repository notes

- `.nojekyll` is present for static hosting scenarios such as GitHub Pages.
- The root `index.html` is the lightweight static presentation site; the WordPress files provide the CMS implementation and content-management workflow.
- Uploaded media includes venue photography, logos, service imagery and the Sofia Summit Center digital presentation PDF.

## Contact

Sofia Summit Center
ул. „8-ми декември“ 13, София
+359 894 202 086
tsvetelin@pleggi.com
