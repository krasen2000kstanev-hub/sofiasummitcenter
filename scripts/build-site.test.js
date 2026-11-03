// Run with: node --test scripts/build-site.test.js
const test = require('node:test');
const assert = require('node:assert');
const { urlFor, fill, renderPage } = require('./build-site.js');

const templates = {
  layout: '<html lang="{{lang}}"><title>{{title}}</title><meta content="{{description}}"><link href="{{canonical}}"><meta content="{{image}}">{{hreflang}}{{jsonld}}{{header}}{{content}}{{footer}}</html>',
  'header.bg': '<a href="/kontakti/">Контакти</a><a href="/tseni/">Цени</a>{{langSwitch}}',
  'footer.bg': '<a href="/tseni/">Цени</a>',
  'header.en': '<a href="/en/contact/">Contact</a>{{langSwitch}}',
  'footer.en': '<a href="/en/contact/">Contact</a>',
};
const page = (meta, body = '<h1>X</h1>') => `<!--page ${JSON.stringify(meta)} -->\n${body}`;

test('urlFor turns source paths into clean URLs', () => {
  assert.strictEqual(urlFor('index.html'), '/');
  assert.strictEqual(urlFor('prostranstva\\podkast-studio\\index.html'), '/prostranstva/podkast-studio/');
});

test('fill rejects unknown placeholders', () => {
  assert.throws(() => fill('{{missing}}', {}), /missing/);
});

test('a page must have a title and description', () => {
  assert.throws(() => renderPage('<h1>X</h1>', '/x/', templates), /page/);
  assert.throws(() => renderPage(page({ title: 'X' }), '/x/', templates), /description/);
});

test('renders metadata, content and the current menu item', () => {
  const html = renderPage(page({ title: 'Цени', description: 'Описание "с кавички"' }), '/tseni/', templates);
  assert.match(html, /lang="bg"/);
  assert.match(html, /<title>Цени \| Sofia Summit Center<\/title>/);
  assert.match(html, /Описание &quot;с кавички&quot;/);
  assert.match(html, /href="https:\/\/sofiasummit\.bg\/tseni\/"/);
  assert.match(html, /<h1>X<\/h1>/);
  assert.strictEqual(html.match(/aria-current="page"/g).length, 2);
  assert.doesNotMatch(html, /hreflang/);
});

test('language pairs point at each other from both sides', () => {
  const bg = renderPage(page({ title: 'К', description: 'о', alt: '/en/contact/' }), '/kontakti/', templates);
  const en = renderPage(page({ title: 'C', description: 'd', alt: '/kontakti/' }), '/en/contact/', templates);
  assert.match(en, /lang="en"/);
  for (const html of [bg, en]) {
    assert.match(html, /hreflang="bg" href="https:\/\/sofiasummit\.bg\/kontakti\/"/);
    assert.match(html, /hreflang="en" href="https:\/\/sofiasummit\.bg\/en\/contact\/"/);
  }
  assert.match(bg, /class="lang-switch" href="\/en\/contact\/"/);
});

test('structured data cannot close its script tag', () => {
  const html = renderPage(page({ title: 'X', description: 'y', jsonld: { name: '</script>' } }), '/x/', templates);
  assert.doesNotMatch(html, /<\/script>"/);
  assert.match(html, /\\u003c\/script>/);
});
