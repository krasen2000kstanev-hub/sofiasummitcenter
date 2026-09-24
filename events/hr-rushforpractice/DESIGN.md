# DESIGN.md

> HR:RUSH FOR PRACTICE с жив bokeh фон, който добавя енергия, без да пречи на съдържанието.

## 1. Visual Theme & Atmosphere

**Style**: Editorial tech / practical career energy  
**Keywords**: динамичен, уверен, светъл, професионален, младежки, фокусиран  
**Tone**: енергичен и достъпен — NOT хаотичен или неонов.  
**Feel**: цветни светлинни петна зад сцена преди началото на състезание.

**Interaction Tier**: L1 — постоянна атмосфера без scroll hijacking  
**Dependencies**: CSS + Canvas 2D, без външни библиотеки

## 2. Color Palette & Roles

```css
:root {
  --bg: #20243d; --surface: #ffffff; --surface-alt: #eef0f5;
  --surface-hover: #e7e9f1; --border: #dfe3ee; --border-hover: #12c9db;
  --text: #181c30; --text-secondary: #5a6089; --text-tertiary: #9297ba;
  --accent: #12c9db; --accent-hover: #5fe0ec;
  --bg-rgb: 32,36,61; --accent-rgb: 18,201,219;
  --coral: #ff5b72; --amber: #ffab2e;
  --success: #24b47e; --error: #e23a52; --warning: #ffab2e;
}
```

**Color Rules:** bokeh lights use only cyan, coral, amber and steel-blue variants; section surfaces stay light; contrast wins over atmosphere.

## 3. Typography Rules

```css
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800&family=Manrope:wght@500;600;700;800&display=swap');
```

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Hero H1 | Unbounded | clamp(2.2rem, 6vw, 5.5rem) | 800 | 1.04 | -.02em |
| Section H2 | Unbounded | clamp(1.7rem, 3.2vw, 2.5rem) | 700 | 1.04 | -.01em |
| H3 | Manrope | 1.1rem | 800 | 1.25 | 0 |
| Body | Manrope | 1rem | 500 | 1.65 | 0 |
| Label | Manrope | .7rem | 800 | 1.2 | .12em |

Keep existing Bulgarian typography and do not add decorative glow to headings.

## 4. Component Stylings

### Buttons
```css
.btn{min-height:44px;border-radius:999px;transition:transform .15s ease,background .15s ease;}
.btn:hover{transform:translateY(-2px);}.btn:active{transform:scale(.98);}
.btn:focus-visible{outline:2px solid var(--accent);outline-offset:3px;}
.btn[disabled]{opacity:.55;cursor:wait;transform:none;}
```

### Cards
```css
.card{background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:0 18px 40px -30px rgba(24,28,48,.35);}
.card:hover{border-color:var(--border-hover);transform:translateY(-3px);}
.card:focus-within{border-color:var(--border-hover);}
```

### Navigation and Links
```css
header.scrolled{background:rgba(255,255,255,.92);border-color:var(--border);}
a:hover{color:#0a94a3;}a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;}
```

### Ambient Background
```css
.ambient-bokeh{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.62;}
```

## 5. Layout Principles

**Container:** max-width 1280px; padding 24px desktop / 18px mobile; narrow text width 720px.  
**Spacing:** sections 72–112px; component gaps 12–24px; card padding 18–28px.

```css
.container{max-width:1280px;margin:0 auto;padding:0 24px;}
@media(max-width:640px){.container{padding:0 18px;}}
```

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | transparent/light surface | section backgrounds |
| Subtle | `0 12px 32px rgba(24,28,48,.10)` | cards |
| Elevated | `0 24px 60px rgba(24,28,48,.18)` | apply form |
| Ambient | low-opacity canvas lights | atmosphere only |

## 7. Animation & Interaction

**Motion Philosophy**: slow organic movement; content stays stable.  
**Tier**: L1

**Dependencies:** none; use Canvas 2D.

The background renders only soft moving color circles behind the page content, pauses when the document is hidden, and remains unobtrusive instead of tinting the entire screen.

```css
@keyframes ambientFade{from{opacity:0}to{opacity:1}}
.ambient-bokeh{animation:ambientFade .8s ease both;}
@media(prefers-reduced-motion:reduce){.ambient-bokeh{display:none;animation:none;}}
```

No scroll-linked background work, cursor tracking, pinning or scroll hijacking.

## 8. Do's and Don'ts

### Do
- Keep the bokeh behind content and use the HR:RUSH palette.
- Limit particle count for stable performance.
- Pause animation when the document is hidden.
- Respect reduced motion.
- Keep the effect decorative and non-interactive.

### Don't
- ❌ Copy the CodePen's non-commercial package directly.
- ❌ Add Three.js for a decorative-only background.
- ❌ Use blur filters on many moving DOM elements.
- ❌ Put bright particles behind long-form text.
- ❌ Add cursor tracking or scroll hijacking.
- ❌ Animate every section independently.
- ❌ Let the canvas intercept clicks or touch gestures.
- ❌ Change the existing content hierarchy for the effect.

## 9. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop >900px | 8–10 slow lights, opacity .62 |
| Tablet 641–900px | 5–6 lights, reduced opacity |
| Mobile <640px | static gradient or disabled canvas |

Touch targets stay at least 44px and the page must not gain horizontal overflow.

### Student testimonial deck (local preview)
- Present one full, readable testimonial at a time, with adjacent cards fanned behind it in HR:RUSH navy/cyan/coral/amber tones.
- Advance automatically after the active quote's estimated reading time (200 words/minute plus a 4-second buffer; 14-second minimum); allow previous/next controls, side-card activation, and left/right arrow keys.
- Pause while hovered, keyboard-focused, or the tab is hidden; restart a full reading interval afterward. Reduced-motion preference disables autoplay and card transitions.
- Keep the card content and participant identity intact; inactive cards are removed from keyboard/screen-reader navigation.
- On narrow screens reduce the fan and card padding; honor `prefers-reduced-motion` and preserve a normal card grid if JavaScript is unavailable.
