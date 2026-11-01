#!/usr/bin/env bash
# Builds _site with only the files the public site needs. A new root file stays private until it is listed here.
set -euo pipefail

rm -rf _site
mkdir _site

cp index.html privacy.html terms.html admin.html \
  konferentni-zali.html sabitiya.html vremenen-ofis.html social-preview.html \
  google8a6052dc0c428fd3.html \
  styles.css styles-enhancements.css design-overrides.css blue-theme.css detail.css \
  script.js motion.js analytics-consent.js \
  robots.txt sitemap.xml CNAME .nojekyll \
  _site/
cp -R assets events _site/

find _site/events -type d -name backend -prune -exec rm -rf {} +
find _site -type f \( -name '*.md' -o -name 'preview-server.*' -o -name '.htaccess' \) -delete
