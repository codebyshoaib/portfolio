# DESIGN.md

The design standard for the public site. Read it before building or changing UI under
`src/components/sections`, `src/app/(portfolio)` or `src/app/v2`. It describes what is
already implemented; the CSS files are the source of truth, this explains how to use them.

## Character

An editorial site: it should read like a well-set long-form publication, not a SaaS
landing page. Serif headings, sans body, mono for meta, one teal accent, hairline rules.

- **Two surfaces, two systems, never mixed.**
  - The main site (`/`, `/decisions`, `/notes`): editorial, tokens in `src/app/globals.css`,
    long-form rules in `src/app/(portfolio)/editorial.css`.
  - `/v2`, the recruiter terminal: its own `--term-*` tokens and fonts in
    `src/app/v2/terminal.css`. Nothing from it leaks into the main site, and the
    reverse holds too.
- **Teal is the only accent.** `--brand` is for links, the active state, and the one
  thing per section that should catch the eye. Everything else is the neutral ramp.
- **Structure carries information.** Rules, indexes and eyebrows have to mean something
  (a sequence, a group). Never add them as decoration.
- **Refine, don't replace.** New work extends the existing tokens and components. A new
  colour, font, radius or shadow needs a reason, written in the PR.

## Tokens

All colour comes from the custom properties in `src/app/globals.css` (shadcn names,
oklch values). Never hard-code a colour in a component. Dark values live under `.dark`,
so every new token needs both blocks.

| Token | Use |
| --- | --- |
| `--background` / `--foreground` | Page ground and primary text. Neutrals carry a faint teal bias (hue ~185) on purpose. |
| `--muted-foreground` | Body copy, secondary text, meta |
| `--border` | Hairline rules between sections and list rows |
| `--accent` / `--muted` | Hover washes, chips, placeholders |
| `--brand` / `--brand-muted` | The single accent. Links, active state, focus ring. |
| `--destructive` | Errors only |
| `--chart-*` | Charts only, never UI chrome |

`--foreground` and `--foreground-hsl` are the same colour in two spaces. Change both
together; nothing enforces it (see the comment in `globals.css`). Alpha ramps on
`/decisions` read the HSL triplet because `hsl()` cannot take an oklch value.

Status colours are `--accent-status-*` in `globals.css`, measured to 4.5:1 on both grounds,
exposed to Tailwind as `status-success`, `status-warning`, `status-error` and `status-info`
(`text-status-error`, `bg-status-success/10`). Never use raw palette colours like `green-500`.

## Type

| Role | Face | Where |
| --- | --- | --- |
| Headings `h1`–`h6` | Source Serif 4 (`--font-serif`), 600, `-0.015em` | Set globally in `globals.css` |
| Body | Inter (`--font-inter`) | `html, body` |
| Meta, eyebrows, indexes | System mono (`--font-mono`), 11px, uppercase | `SectionHeader`, dates, tags |
| Long-form body | Serif (`.body-serif`) | `/decisions`, `/notes` only |

Rules:

- **One tracking for the uppercase mono meta role: `0.18em`.** `editorial.css` defines it as
  `--meta-track`. Tags are the exception (see Tag tracking below).
- Meta text is 11px. Below 13px, text needs at least 0.62 foreground alpha to hold 4.5:1
  (budget in the header of `editorial.css`).
- Prose measure caps at `70ch` (`--measure`), applied to the text and never to a container.
- Sentence case for titles and copy. Uppercase belongs to the mono meta role only.

## Shape and depth

- Sections are full-width with a top `border-t border-border` hairline (`Section` in
  `src/components/sections/Section.tsx`). The first block passes `bare`.
- Content sits in `max-w-6xl`, with padding `px-6 md:px-10 lg:px-16` and vertical rhythm
  `py-16 md:py-24`.
- Radius comes from `--radius` (`0.625rem`) through the `rounded-*` scale. Small chips and
  tags use `rounded`.
- **Shadows only on floating chrome** (dock, sidebar toggle, floating buttons). In-flow
  content stays flat: rules, not cards with shadows.

## Components

Reuse these before writing new markup.

| Need | Use | File |
| --- | --- | --- |
| A page section | `Section` + `SectionHeader` (eyebrow, optional index, serif title) | `sections/Section.tsx` |
| Long-form page | `.editorial-root` scope | `(portfolio)/editorial.css` |
| Rich text body | `PortableTextBody` | `components/PortableTextBody.tsx` |
| Portrait | `.portrait-duotone`: grayscale tinted teal, true colour on hover/focus | `globals.css` |
| Primitives | Radix + shadcn | `components/ui/` |

## Motion

- One entrance only: `.editorial-fade` (8px fade-up, 0.6s, staggered `-2`…`-4`), gated on
  `prefers-reduced-motion: no-preference`.
- Every other motion answers a user action (hover, focus, open).
- The global `prefers-reduced-motion: reduce` block collapses CSS motion. JS-driven motion
  (canvas, rAF, intervals, framer-motion) has to gate itself with `useReducedMotion` or
  `matchMedia`, because CSS cannot stop it.
- Hover reveals must also show on `:focus-visible` (the duotone portrait does both).

## Accessibility

- Visible focus on every interactive element: `2px solid var(--brand)`, `2px` offset, set once
  on `:focus-visible` in `globals.css`. `/v2` recolours it to `--term-accent`. A component
  that draws its own ring (`focus-visible:outline-none` + `ring-*`) overrides it.
- One `h1` per page. Section titles are `h2`.
- Colour is never the only signal. Status badges carry text.
- Decorative images and glyphs get `alt=""` or `aria-hidden`.

## Tag tracking

Bordered chips (skills, stack tags, services, certification tags) use `tracking-[0.14em]`.
That's the tag role, the same idea as `.hashtags` sitting tighter on `/decisions`.
Eyebrows, labels and meta lines use `0.18em`.

## Styling tools

Tailwind plus the tokens above. `styled-components` is installed only because Sanity
Studio requires it as a peer dependency. Don't use it in site components, and don't
remove it.

`global-error.tsx` uses `text-gray-600` on purpose: it renders without the root layout,
so the tokens may not exist there.
