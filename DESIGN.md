# Sofia Summit Center — DESIGN.md

## 1. Visual Theme & Atmosphere

Warm, credible editorial hospitality for a modern Sofia event venue. Keep the existing light blue map-inspired atmosphere, but give each section a clear white surface and stronger contrast. Tone: professional, welcoming, practical. Use L1 interaction: subtle reveal, hover lift, and native smooth scrolling; no heavy libraries or scroll hijacking.

## 2. Color Palette & Roles

```css
:root {
  --ink: #102653; --ink-rgb: 16,38,83;
  --muted: #4e6c9e; --muted-rgb: 78,108,158;
  --blue: #2452b8; --blue-rgb: 36,82,184;
  --blue-dark: #163b8d; --blue-dark-rgb: 22,59,141;
  --surface: #ffffff; --surface-rgb: 255,255,255;
  --page: #eef4ff; --page-rgb: 238,244,255;
  --line: #c9dafa; --line-rgb: 201,218,250;
  --focus: #f59e0b; --focus-rgb: 245,158,11;
}
```

## 3. Typography Rules

Use `Inter, Arial, sans-serif` for interface text and `Manrope, Inter, sans-serif` for headings if already loaded. H1 44–64px, H2 30–40px, H3 22–28px, body 17–19px with 1.6 line-height. Keep Bulgarian copy direct and benefit-led. Every page needs one H1.

## 4. Component Stylings

Buttons use `--blue`, white text, 10–12px radius, 44px minimum height. Hover uses `--blue-dark` and a 2px upward lift. Focus uses a 3px `--focus` outline. Cards use white surfaces, 1px `--line`, 16–22px radius, and a restrained shadow. Links use `--blue` with visible hover underline. Disabled controls reduce opacity to .55 and remove lift.

## 5. Layout Principles

Use a centered max-width container of 1180px, 24px horizontal padding, and a spacing scale of 8/12/16/24/32/48/72px. Prefer two-column layouts above 900px and one column below 720px. Keep primary CTA visible near the first screen and repeat it after proof sections.

## 6. Depth & Elevation

Use one shadow family: `0 12px 32px rgba(16,38,83,.10)` for cards and `0 18px 48px rgba(16,38,83,.14)` for featured panels. Avoid blurred moving layers and excessive glass effects.

## 7. Animation & Interaction

L1 only: cards reveal with opacity/translateY once via IntersectionObserver; buttons lift 2px on hover; gallery images scale to 1.02 on hover. Respect `prefers-reduced-motion: reduce` by disabling transitions and animation. Use native `scroll-behavior: smooth`.

## 8. Do's and Don'ts

- Do lead with venue, location, capacity, and booking CTA.
- Do show real room photos with descriptive alt text.
- Do use Bulgarian search phrases naturally.
- Do keep forms short and explain what happens after submission.
- Do show social proof near the CTA.
- Do preserve keyboard focus and 44px touch targets.
- Don't hide core copy behind JavaScript.
- Don't use generic stock imagery for the venue.
- Don't use more than one primary CTA style.
- Don't add heavy animation libraries for static sections.
- Don't repeat the same photo in multiple room cards.
- Don't create thin duplicate location pages.

## 9. Responsive Behavior

Desktop: 1180px container, 3–4 card grid. Tablet: 2 columns and 32px section spacing. Mobile: one column, 16px gutters, 44px controls, no horizontal overflow, images use fixed aspect ratios with `object-fit: cover`. Navigation collapses without hiding the booking CTA.
