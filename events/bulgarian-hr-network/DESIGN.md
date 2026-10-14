# DESIGN.md

> HR Bulgaria Network е светла, човешка HR общност с редакционна типография и плавни scroll-driven моменти.

## 1. Visual Theme & Atmosphere

**Style**: Editorial community landing page
**Keywords**: човешко, смело, светло, мрежа, движение, разговор, доверие
**Tone**: уверено и топло — NOT корпоративно, шумно или стерилно
**Feel**: като добре подредена среща, в която всяка следваща карта отваря нов разговор.

**Interaction Tier**: L2 — плавен scroll reveal и native video scrub
**Dependencies**: CSS + native HTML video + requestAnimationFrame

## 2. Color Palette & Roles

```css
:root {
  --bg: #f7f5ef; --surface: #ffffff; --surface-alt: #eaf7fa; --surface-hover: #f4c95d;
  --border: #dcdad2; --border-hover: #1b1d3a;
  --text: #1b1d3a; --text-secondary: #5f5f69; --text-tertiary: #777681;
  --accent: #ed715b; --accent-hover: #c95745;
  --bg-rgb: 247,245,239; --accent-rgb: 237,113,91;
  --success: #65a879; --error: #c95745; --warning: #f4c95d;
}
```

**Color Rules:** Use the existing palette; keep one accent per section; use yellow only for action or emphasis; avoid hard-coded colors in new components.

## 3. Typography Rules

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
```

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---:|---:|---:|---:|
| Hero H1 | Space Grotesk | clamp(4rem, 9vw, 8rem) | 700 | .98 | -.06em |
| Section H2 | Space Grotesk | clamp(3rem, 6vw, 6rem) | 600 | .98 | -.06em |
| H3 | Space Grotesk | 27px | 600 | 1 | -.04em |
| Body | DM Sans | 16–24px | 400 | 1.5 | — |
| Label | DM Sans | 12–14px | 600 | 1.2 | .1em |

**Typography Rules:** Headings use tight editorial rhythm; body copy stays readable; never use decorative display fonts or all-caps for long text.

**Text Decoration:** Hero and section headings use color contrast, not gradients or text shadows.

## 4. Component Stylings

Buttons use rounded pills, dark text on yellow primary, white text on ink secondary, with hover lift and visible `:focus-visible` outline. Cards use white or pale-blue surfaces, 18–24px radius, 1px borders, and no heavy shadows. Navigation links underline or shift accent color on hover; disabled controls use muted text and `not-allowed`.

## 5. Layout Principles

**Container:** max-width 1240px; page padding 32px desktop / 20px mobile; narrow text width 760px.

**Spacing Scale:** section padding 100–150px; component gap 16–32px; card padding 16–24px.

**Grid:** Use two-column editorial layouts on desktop; collapse to one column below 760px; guest cards become a touch-scroll row.

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | solid surface | sections and footer |
| Subtle | 1px border | form cards and guest cards |
| Elevated | 5px ink offset | primary CTA |

## 7. Animation & Interaction

**Motion Philosophy**: native, smooth, low-dependency movement that supports reading.
**Tier**: L2

### Base Setup

The scroll story uses a sticky media panel and `requestAnimationFrame` to map section progress to `video.currentTime`. No GSAP or scroll-jacking.

### Entrance Animation

Use `opacity` + `transform: translateY(18px)` for reveal; no moving blur.

### Scroll Behavior

The story section pins its media panel while three overlay cards fade in/out at equal progress intervals. Video playback pauses outside the section and reduces to a poster on mobile or reduced-motion settings.

### Hover & Focus States

All buttons and links have hover color/transform feedback and `:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }`.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .story-video { display: none; }
  .story-media { background-image: var(--story-poster); }
  .story-card { opacity: 1; transform: none; }
}
```

## 8. Do's and Don'ts

### Do

- Keep the existing cream, ink, coral, yellow, and pale-blue system.
- Use native HTML controls and semantic headings.
- Keep scroll motion tied to content, not decoration.
- Use real event photos and video before production.
- Preserve keyboard focus and reduced-motion behavior.

### Don't

- ❌ Add GSAP, Lenis, or a new UI framework for this effect.
- ❌ Use scroll-jacking or permanent smooth-scroll wrappers.
- ❌ Add more than one heavy media section.
- ❌ Use fake speaker portraits as final assets.
- ❌ Hide essential copy behind animation.
- ❌ Use hard-coded colors in new CSS.
- ❌ Autoplay audio.
- ❌ Let mobile layouts overflow horizontally except the intended guest carousel.

## 9. Responsive Behavior

| Name | Width | Key Changes |
|---|---:|---|
| Desktop | > 1024px | two-column layout, sticky scrub panel, 3 overlay cards |
| Tablet | 761–1024px | tighter grid, reduced media height |
| Mobile | < 760px | one column, poster fallback, touch-scroll cards |

**Touch Targets:** minimum 44px.
**Collapsing Strategy:** stack sections; keep the primary registration CTA visible; turn guest cards into horizontal scroll.
