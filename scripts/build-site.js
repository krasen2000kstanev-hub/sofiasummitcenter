#!/usr/bin/env node
// Renders src/pages/**/index.html into _site using the shared layout, header and footer.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, '_site');
const ORIGIN = 'https://sofiasummit.bg';
const DEFAULT_IMAGE = '/assets/sofia_summit_center_logo.png';
const META = /^<!--page\s+(\{.*?\})\s*-->\s*/s;

function urlFor(relativePath) {
  return '/' + relativePath.replace(/\\/g, '/').replace(/index\.html$/, '');
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// An unknown placeholder fails the build instead of reaching visitors as literal text.
function fill(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Unknown placeholder {{${key}}}`);
    return vars[key];
  });
}

function markCurrent(html, url) {
  return html.split(`href="${url}"`).join(`href="${url}" aria-current="page"`);
}

function parsePage(source, url) {
  const match = source.match(META);
  if (!match) throw new Error(`${url}: missing <!--page {...} --> block`);
  const meta = JSON.parse(match[1]);
  for (const key of ['title', 'description']) {
    if (!meta[key]) throw new Error(`${url}: missing ${key}`);
  }
  return { meta, content: source.slice(match[0].length) };
}

function plainText(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// Search engines read breadcrumbs and questions from structured data, so build it from the visible markup.
function breadcrumbData(content, url) {
  const list = content.match(/<ol class="breadcrumb">([\s\S]*?)<\/ol>/);
  if (!list) return null;
  const items = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match, index) => {
    const link = match[1].match(/href="([^"]+)"/);
    return { '@type': 'ListItem', position: index + 1, name: plainText(match[1]), item: ORIGIN + (link ? link[1] : url) };
  });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

function faqData(content) {
  const questions = [...content.matchAll(/<details class="faq-item"[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)];
  if (!questions.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((match) => ({ '@type': 'Question', name: plainText(match[1]), acceptedAnswer: { '@type': 'Answer', text: plainText(match[2]) } })),
  };
}

function jsonldScripts(items) {
  return items.filter(Boolean)
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`)
    .join('\n');
}

function renderPage(source, url, templates) {
  const { meta, content } = parsePage(source, url);
  const lang = url === '/en/' || url.startsWith('/en/') ? 'en' : 'bg';
  const title = `${meta.title} | Sofia Summit Center`;
  const [bgUrl, enUrl] = lang === 'bg' ? [url, meta.alt] : [meta.alt, url];
  const hreflang = meta.alt
    ? `<link rel="alternate" hreflang="bg" href="${ORIGIN}${bgUrl}"><link rel="alternate" hreflang="en" href="${ORIGIN}${enUrl}"><link rel="alternate" hreflang="x-default" href="${ORIGIN}${bgUrl}">`
    : '';
  const langSwitch = meta.alt
    ? `<a class="lang-switch" href="${meta.alt}" hreflang="${lang === 'bg' ? 'en' : 'bg'}">${lang === 'bg' ? 'EN' : 'БГ'}</a>`
    : '';
  const jsonld = jsonldScripts([].concat(meta.jsonld || [], breadcrumbData(content, url), faqData(content)));
  const shared = { langSwitch };
  return fill(templates.layout, {
    lang,
    title: escapeAttr(title),
    description: escapeAttr(meta.description),
    canonical: ORIGIN + url,
    image: ORIGIN + (meta.image || DEFAULT_IMAGE),
    hreflang,
    jsonld,
    header: markCurrent(fill(templates[`header.${lang}`], shared), url),
    footer: markCurrent(fill(templates[`footer.${lang}`], shared), url),
    content,
  });
}

function findPages(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findPages(full, base);
    return entry.name === 'index.html' ? [path.relative(base, full)] : [];
  });
}

function loadTemplates() {
  const templates = { layout: fs.readFileSync(path.join(SRC, 'layout.html'), 'utf8') };
  for (const file of fs.readdirSync(path.join(SRC, 'partials'))) {
    templates[file.replace(/\.html$/, '')] = fs.readFileSync(path.join(SRC, 'partials', file), 'utf8');
  }
  return templates;
}

// The sitemap lists every built page plus the hand-made pages kept in the repository's sitemap.xml (events, legal).
function sitemapXml(pageUrls, extraLocs) {
  const locs = [...new Set([...[...pageUrls].map((url) => ORIGIN + url), ...extraLocs])].sort();
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + locs.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n') + '\n</urlset>\n';
}

function writeSitemap(pageUrls) {
  const extra = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemapXml(pageUrls, extra));
}

function build() {
  const pagesDir = path.join(SRC, 'pages');
  const templates = loadTemplates();
  const pages = findPages(pagesDir).map((relativePath) => ({
    relativePath,
    url: urlFor(relativePath),
    source: fs.readFileSync(path.join(pagesDir, relativePath), 'utf8'),
  }));
  const urls = new Set(pages.map((page) => page.url));
  writeSitemap(urls);
  for (const page of pages) {
    const { alt } = parsePage(page.source, page.url).meta;
    if (alt && !urls.has(alt)) throw new Error(`${page.url}: language version ${alt} does not exist`);
    const target = path.join(OUT, page.relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, renderPage(page.source, page.url, templates));
  }
  console.log(`Built ${pages.length} page(s) into _site`);
}

if (require.main === module) build();

module.exports = { urlFor, fill, markCurrent, parsePage, renderPage, breadcrumbData, faqData, sitemapXml };
