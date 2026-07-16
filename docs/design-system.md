# Design System

## Colour Tokens

```css
--color-anthracite: #2d302f;       /* Shell, navigation, workspace */
--color-anthracite-deep: #1c1f1e;  /* Deep backgrounds, hero */
--color-timberwolf: #d7d0c7;       /* Forms, report surfaces */
--color-timberwolf-light: #ebe6df; /* Light reading surfaces */
--color-raw-umber: #7a5938;        /* Secondary surfaces, hover */
--color-raw-umber-dark: #533b27;   /* Deep umber surfaces */

--color-gold: #c6a15b;             /* Active focus, Ming/Shen emphasis */
--color-gold-soft: #dcc590;        /* Soft gold accents */
--color-gold-muted: #9d7d45;       /* Muted gold for secondary */

--color-error: #9f5146;            /* Errors, blocked interpretation */
--color-source-needed: #a77b43;    /* Source review required */
--color-reviewed: #6e806f;         /* Reviewed source status */

--surface-dark: rgba(45, 48, 47, 0.94);
--surface-paper: rgba(215, 208, 199, 0.94);
--surface-umber: rgba(122, 89, 56, 0.92);

--border-dark: rgba(215, 208, 199, 0.16);
--border-gold: rgba(198, 161, 91, 0.42);
```

## Typography

| Role | Font | Fallback |
|------|------|----------|
| UI / Body | Manrope | Inter, system-ui |
| Editorial Headings | Cormorant Garamond | Source Serif 4, Georgia |
| Hanzi | Noto Serif TC | Source Han Serif TW, serif |

- Body line height: 1.5
- Heading line height: 1.15
- No gold body copy
- Readable line lengths

## Surfaces

| Surface | Usage | Value |
|---------|-------|-------|
| Dark | Shell, nav, atlas | `--surface-dark` |
| Paper | Forms, reading | `--surface-paper` |
| Umber | Secondary panels | `--surface-umber` |

## Spacing

```
--space-xs: 4px    --space-sm: 8px    --space-md: 16px
--space-lg: 24px   --space-xl: 32px   --space-2xl: 48px
--space-3xl: 64px  --space-4xl: 96px
```

## Borders

- Default: `1px solid var(--border-dark)`
- Gold focus: `2px solid var(--color-gold)`, offset 2px
- Radius: sm(4px), md(8px), lg(16px), xl(24px)

## Status Semantics

| Status | Colour | Icon | Text Label |
|--------|--------|------|------------|
| REVIEWED | `--color-reviewed` | ✓ | Reviewed |
| PARTIAL | `--color-gold-muted` | ◐ | Partial |
| SOURCE_NEEDED | `--color-source-needed` | ⚠ | Source Needed |

**Colour never communicates status alone.** Text labels and icons always accompany colour.

## Motion Hierarchy

1. Palace network reveal: Primary motion (SVG stroke animation)
2. Mineral backdrop: Atmospheric (slow CSS transforms, max 10px)
3. Bento spotlight: Secondary (CSS radial gradient, max opacity 0.12)
4. Page transitions: Subtle opacity and transform

## Prohibited Design Patterns

- No purple or neon gradients
- No glassmorphism or frosted-glass effects
- No starfield or galaxy backgrounds
- No zodiac animal imagery
- No pseudo-Chinese ornament
- No red/green binary status (good/bad)
- No gold body text
- No full-screen glow effects
