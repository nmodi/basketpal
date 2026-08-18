---
name: Basketpal
description: A live NBA and WNBA game tracker built as an arena scoreboard — dark, tonal, and deliberately behind the broadcast.
colors:
  arena-dark: "#14171f"
  panel-raised: "#1a1e27"
  well-sunken: "#0b0d13"
  surface: "#1e222c"
  surface-high: "#2e3340"
  hairline: "#2e3340"
  hairline-strong: "#474d5c"
  fg: "#f2f4f8"
  fg-muted: "#a1a7b5"
  fg-dim: "#858ca0"
  fg-inverse: "#ffffff"
  bulb-warm-white: "#fff2d6"
  jumbotron-amber: "#facc15"
  buzzer-red: "#df3a3e"
  buzzer-red-soft: "#e76568"
typography:
  display:
    fontFamily: "monte-stella, sans-serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "0.07em"
  numeric:
    fontFamily: "tt-autonomous-mono, monospace"
    fontSize: "50px"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "normal"
  headline:
    fontFamily: "tt-autonomous-mono, monospace"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "normal"
  title:
    fontFamily: "tt-autonomous-mono, monospace"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
  body:
    fontFamily: "soleil, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "tt-autonomous-mono, monospace"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.16em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  pill: "9999px"
spacing:
  2xs: "4px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  card:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "0"
  card-well:
    backgroundColor: "{colors.well-sunken}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "16px 12px"
  score-box:
    backgroundColor: "{colors.well-sunken}"
    textColor: "{colors.bulb-warm-white}"
    typography: "{typography.numeric}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  live-badge:
    backgroundColor: "{colors.buzzer-red}"
    textColor: "{colors.fg-inverse}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "4px 16px"
  final-badge:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "6px 16px"
  button-primary:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.arena-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "12px 32px"
  button-primary-hover:
    backgroundColor: "{colors.fg-inverse}"
    textColor: "{colors.arena-dark}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.fg-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-secondary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.xs}"
    padding: "4px"
  button-icon-hover:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.fg-muted}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "0 0 12px"
  tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
  select-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  option-hover:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.fg}"
    rounded: "{rounded.xs}"
    padding: "6px 8px"
  checkbox:
    backgroundColor: "transparent"
    rounded: "{rounded.sm}"
    size: "26px"
  checkbox-checked:
    backgroundColor: "{colors.jumbotron-amber}"
    textColor: "{colors.arena-dark}"
    rounded: "{rounded.sm}"
    size: "26px"
  chip-team:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.fg}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    size: "36px"
  table-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg-dim}"
    typography: "{typography.label}"
    padding: "12px 16px"
  table-cell-total:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.fg}"
    padding: "7px 16px"
---

# Design System: Basketpal

## Overview

**Creative North Star: "The Arena Scoreboard"**

Basketpal is not a website about basketball; it is a piece of arena hardware rendered in a browser. The reference is the physical scoreboard hanging over the floor: a dark housing, score digits recessed into wells, team colors running down the edges of each side, and warm bulb-white numerals that read from across the building. Every surface decision answers to that object.

Depth comes from tonal layering, not from ornament. Four greys stack from the room (`#14171f`) up to a raised panel (`#1a1e27`) and back down into a sunken well (`#0b0d13`) where the numbers live. That ramp is the structural system; the drop shadows on cards are ambient lift on top of it, not the mechanism. Type does the rest of the work: a heavy condensed display face shouting team names in uppercase, and a monospace face holding every number, clock, label and tricode in fixed columns so nothing shifts as the score changes during a live poll.

The palette is almost entirely achromatic on purpose, because color belongs to the teams. Thirty NBA and fifteen WNBA palettes flow through the interface via a strategy engine, and the system's own chrome stays out of their way. Restraint here isn't minimalism — it's deference.

**Key Characteristics:**
- Dark-only, four-step tonal ground; no light theme exists
- Two typefaces carrying two jobs: identity (display) and data (mono)
- Uppercase, wide-tracked labels everywhere — broadcast convention, not decoration
- Team color is the loudest thing on screen; app chrome never competes
- Numbers sit in recessed wells with hairline borders, like inset scoreboard panels
- Controls recede at rest and resolve on hover and focus

## Colors

An almost fully achromatic dark system with three signal colors, holding space for 45 team palettes that pass through it.

### Primary

- **Jumbotron Amber** (`#facc15`): the generic interactive and affirmative accent — active tab underline, checked settings box, the winning score and trophy, the better value in a stat comparison, tool names in the AI research trace. It is the app's neutral UI accent, not a brand color. Where a team owns the space, team color wins and amber stands down.

### Secondary

- **Buzzer Red** (`#df3a3e`): live state only. The `LIVE` badge fill and nothing else at full strength.
- **Buzzer Red Soft** (`#e76568`): the running game clock and period readout while a game is in progress. The lighter tone exists so a 40px clock does not vibrate against the dark ground the way full-strength red would.

### Tertiary

- **Bulb Warm White** (`#fff2d6`): the default score numeral. Warmer than the interface white by design — the incandescent cast of a scoreboard bulb. Every score is this color until a game goes final, at which point the winner turns Jumbotron Amber and the loser drops to Muted Grey.

### Neutral

- **Arena Dark** (`#14171f`): the room. Page background and fixed header ground.
- **Panel Raised** (`#1a1e27`): the housing. Every card, scoreboard, modal, and container body.
- **Well Sunken** (`#0b0d13`): the recess. Score boxes, the center column of a game card, table body rows. Darker than the page itself — this is what reads as "cut into the panel."
- **Surface** (`#1e222c`): table headers, dropdown menus, select controls, hover fills.
- **Surface High** (`#2e3340`): total columns, selected options, team chips — the top tonal step.
- **Hairline** (`#2e3340`): every 1px divider and card border. Shares a value with Surface High, which is why a divider reads as an edge of the next tonal step rather than as a drawn line.
- **Hairline Strong** (`#474d5c`): borders that must be seen — score box outlines, dropdown edges, card hover state, badge outlines.
- **Foreground** (`#f2f4f8`) / **Muted** (`#a1a7b5`) / **Dim** (`#858ca0`): the three-step text ramp. Primary values, secondary prose and inactive controls, then labels and metadata. Dim is pinned to the lightest value that still clears WCAG AA (4.5:1) on every ground it sits on — do not darken it.

### Team Color

Team color is generated, not authored. `util/teamColorStrategy.js` resolves a tricode into a `{ barColor, nameColor, getGradient() }` triple through one of five named strategies — `baseline`, `twoTone`, `pop`, `bold`, `twoTonePop` — with `bold` as the default and per-team overrides for the ~30 teams whose official palettes fail on a dark ground. Accent selection picks the most chromatic non-primary color in a team's set, excluding anything near-white or near-black, and any color used as text is gated on a luminance check (`> 0.12`) before it is allowed near a dark background. Team color surfaces in exactly four places: the 4–5px edge bars flanking a game card, the team name text, a 3px gradient rule at the top of a team container, and low-alpha panel gradients (0.18–0.45).

### Named Rules

**The Deference Rule.** Team color is the only saturated color allowed to carry identity. If a team owns the region, the app's own accents stand down. Jumbotron Amber appears only where no team has a claim.

**The Warm Numeral Rule.** Live and scheduled scores are Bulb Warm White (`#fff2d6`), never interface white (`#f2f4f8`). The warmth is the difference between a scoreboard and a spreadsheet, and it is worth the extra token.

**The Luminance Gate.** No team color reaches text without passing `getLuminance() > 0.12`. Failing colors fall back to Foreground. Never hand-place a team color as text without the gate.

## Typography

**Display Font:** monte-stella (with sans-serif fallback)
**Body Font:** soleil (with sans-serif fallback)
**Label / Numeric Font:** tt-autonomous-mono (with monospace fallback)

All three load from a single Typekit kit (`din3oqv`) in `root.jsx`.

**Character:** A heavy condensed display face against a technical monospace — the pairing of a jersey wordmark and a stat feed. monte-stella appears at weight 900, uppercase, with negative-feeling leading (0.95) and wide tracking (0.07em), so team names read as painted-on lettering rather than typeset text. tt-autonomous-mono handles every number, clock, tricode, and label; its fixed advance width is functional, not stylistic, because the score changes every five seconds and nothing may reflow. soleil enters for exactly one job: multi-sentence AI report prose, where a proportional face is simply more readable.

### Hierarchy

- **Display** (monte-stella, 900, 24px → 30px ≥768px, line-height 0.95, tracking 0.07em, uppercase): team names on game cards and the scoreboard. Drops to 20px → 24px when a team name exceeds 8 characters.
- **Numeric** (tt-autonomous-mono, 50px → 60px ≥768px, line-height 0.9): scores. The game clock is a sibling at 40px → 48px with 0.04em tracking.
- **Headline** (mono, 800, 34px, line-height 1.15): AI report headlines. The only place a large non-numeric value appears in the mono face.
- **Title** (mono, 700, 15px, tracking 0.08em, uppercase): container headers — team header rows, Player of the Game.
- **Body** (soleil, 16px, line-height 1.6, Muted): report paragraphs. Left-aligned, `white-space: pre-line` to honor the model's own paragraph breaks.
- **Label** (mono, 700, 10–14px, tracking 0.10–0.25em, uppercase, Dim or Muted): everything else — table headers, stat labels, the delay bar, tabs, section titles, nav, badges.

### Named Rules

**The Fixed-Column Rule.** Any value that updates during a live poll is set in tt-autonomous-mono. Scores, clocks, period numbers, stat cells. A proportional face would make the whole card twitch on every fetch.

**The Tracking Ladder.** Label tracking scales inversely with size: 10–12px labels take 0.16–0.25em, 14px labels take 0.10–0.14em, and 24px+ display takes 0.07em. Small and wide, large and tight — never the reverse.

**The One Prose Face.** soleil appears only in AI-generated report body copy. If a block is not multi-sentence narrative, it is mono or display.

## Layout

A single centered column, phone-first, with one breakpoint at **768px** that scales type and padding rather than reorganizing structure.

The schedule page is a `600px` max-width column of full-bleed game cards on a `12px` page gutter, under two stacked fixed bars: a `53px` header (`z-index: 100`) and a date strip pinned directly beneath it at `top: 53px` (`z-index: 99`). The page compensates with `133px` of top padding. The game page runs at `90%` width with a `53px` top offset for the header alone.

Spacing follows a 4px base with the ladder `4 · 6 · 8 · 12 · 16 · 20 · 24 · 28 · 32`. Container padding is `16px` on phones and `20–24px` above 768px; card-to-card rhythm is `12px`; section groups separate at `20–24px`.

Game cards are a three-part horizontal split: two flexible team panels with a fixed `28%` center column between them (`20%` on the full scoreboard), carrying hairline borders on both sides and the sunken well background. Card body height floors at `138px`, rising to `150px` above 768px. Postgame lays out on an explicit grid — a `3fr 2fr` top row and a `repeat(4, 1fr)` keys row.

At 768px and up, only these change: display type `24→30px`, scores `50→60px`, clock `40→48px`, panel padding `16→20/24px`, card height `138→150px`. Nothing rewraps.

### Named Rules

**The No-Reflow Rule.** The 768px breakpoint scales; it does not rearrange — with one sanctioned exception: a multi-column grid whose columns physically cannot fit a phone viewport (the postgame `3fr 2fr` top row and `repeat(4, 1fr)` keys row, the pregame summary/injury split, the two-table On Court row) stacks to a single column below 768px. Scaling still handles everything else; a layout that only works on one side of the breakpoint is a defect.

**The Stacked Chrome Rule.** The header and date bar are a fixed pair. Any new page-level chrome joins the stack and increases page top padding to match — never overlaps the first card.

## Elevation & Depth

**Depth is tonal, not cast.** The four-step ground ramp — Arena Dark → Panel Raised → Well Sunken, with Surface and Surface High for interactive layers — is the real elevation system, and it is what defines every structural relationship in the interface. Shadow is a secondary, ambient effect applied to a small set of genuinely floating containers, and it is never load-bearing: remove every shadow in the codebase and the hierarchy still reads correctly.

Note the inversion that makes this system work: the "raised" panel is *lighter* than the page, and the recessed well is *darker* than the page. Depth reads in both directions from the ground plane, which is what produces the sense of a physical housing with parts cut into it.

### Shadow Vocabulary

- **Panel lift** (`box-shadow: 0 20px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03)`): the resting state for floating containers — game cards, the scoreboard, the on-court table. The inset hairline is a top light source; the outer shadow is diffuse room shadow.
- **Panel lift, hover** (`box-shadow: 0 24px 48px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)`), paired with `transform: translateY(-2px)` and a border shift to Hairline Strong: the card rising toward the cursor.
- **Panel seam** (`inset 0 1px 0 rgba(255,255,255,0.03)`): applied alone to team panels inside a card, so an interior division still catches the same light without implying a second floating object.
- **Scrim** (`rgba(0,0,0,0.6)`): dialog backdrop.

### Named Rules

**The Tonal-First Rule.** Depth is expressed by moving a surface along the tonal ramp. Reach for shadow only when an element genuinely floats above the page — a card, a dropdown, a modal. Interior structure is flat and separated by hairlines.

**The Single Light Source Rule.** Light comes from directly above. Every lifted surface carries the same `inset 0 1px 0 rgba(255,255,255,0.03)` top highlight and casts downward. No side shadows, no glow, no inner shadow on the bottom edge.

## Shapes

Rectilinear and tight. Four radius steps do all the work: **4px** for small hard elements (badges, chips, score boxes on the scoreboard, table cells, dropdown options), **6px** for interactive controls and mid-size containers (select buttons, checkboxes, secondary buttons, date items, report cards, the Player of the Game card), **8px** for top-level floating containers (game cards, the scoreboard, the settings dialog, the on-court table), and **9999px** for the two genuinely round things in the system — the delay slider track and thumb, and status dots.

Borders are `1px` hairlines, never thicker, with three exceptions that are all deliberate signals: the `3–5px` team color bars on card edges, the `3px` team gradient rule at the top of a team container, and the `2px` bottom border on the active tab. Nothing else in the system draws a heavy line.

The recurring silhouette is the **inset well**: a Well Sunken fill inside a Hairline Strong border at 4–6px radius, sized to content (`width: fit-content`). It appears wherever a number needs to look physically seated in the panel rather than printed on it.

### Named Rules

**The Radius Ladder Rule.** Radius scales with how much the element floats: 4px sits in a surface, 6px is a control, 8px floats above the page. A 12px or 16px radius does not exist in this system.

**The Hairline Default Rule.** Borders are 1px. A thicker line is a signal — team identity or active state — and must mean one of those two things.

## Components

### Cards / Containers

Machined housings that read as physical panels. **Corner style:** 8px (`{rounded.md}`) for top-level, 6px for nested. **Background:** Panel Raised. **Border:** 1px Hairline, shifting to Hairline Strong on hover. **Shadow:** Panel lift (see Elevation). **Internal padding:** 16px phone / 20–24px desktop, with `overflow: hidden` so team color bars clip to the radius. Interactive cards add `transform: translateY(-2px)` and a `0.18s ease` transition on hover.

### Buttons

Recessive at rest, resolving on interaction. Nothing is filled unless it is the single committing action on the surface.

- **Primary:** Foreground fill, Arena Dark text, 4px radius, `12px 32px`, mono label at 13px / 0.15em / bold / uppercase. Hover goes to pure white. This is the Save button and nothing else per surface.
- **Secondary:** transparent with a 1px Hairline border, Muted text, 6px radius, `12px 20px`. Hover lifts text to Foreground and border to Hairline Strong.
- **Icon:** no background, no border, Muted at rest, Foreground on hover, `0.15s` color transition, 4px hit padding.

Every button transition is color or opacity over `0.12–0.18s`. Controls do not scale, bounce, or shadow on press.

### Chips

40×40px (28px in dropdown lists, 36px in team headers), 4–6px radius, mono label at 10–12px bold. Team chips take the team's official `c1` as background and `c2` as text, straight from `util/settings.js`. Non-team chips use Surface High.

### Inputs / Fields

**Select:** Surface fill, 1px Hairline, 6px radius, `10px 12px`, `font: inherit`. Focus removes the outline and shifts the border to Hairline Strong. The options panel is Surface with a Hairline Strong border, `max-height: 280px`, scrolling, with a `4px` inner pad; options highlight to Surface High on hover *and* focus-visible.

**Checkbox:** a 26px `appearance: none` square, 1px Hairline Strong, 6px radius, transparent at rest. Checked fills Jumbotron Amber and draws a CSS checkmark in Arena Dark via a rotated `::after` border — no icon asset.

**Range (delay slider):** a 2px Well Sunken track at pill radius with a 14px Foreground thumb, styled identically across `-webkit-` and `-moz-`. Tick labels sit below in 10px mono Dim, with first and last translated to align flush to the track ends.

### Navigation

A fixed 53px bar, Arena Dark, 1px Hairline bottom, `0 24px`. Links are 14px mono bold, 0.15em tracking, uppercase, Muted at rest and Foreground when active or hovered — no underline, no pill, no background.

**Tabs** are the secondary nav: mono label at 14px / 0.1em / uppercase, Muted, `0 0 12px` padding with a transparent 2px bottom border pulled onto the container's own border line by `margin-bottom: -1px`. Active state is Foreground text plus a Jumbotron Amber underline.

### Tables

Header row: Surface background, Dim text, mono label at 14px / 0.14em / uppercase / weight 500, `12px 16px`. Body rows: Well Sunken, separated by 1px Hairline bottom borders. Numeric cells are right-aligned at 16–18px; total columns get Surface High and Foreground at 20px bold. The winning side of a stat comparison takes Jumbotron Amber and bold.

### Signature Component: the game card (Microtron)

The system's defining object. A three-panel split — away team, fixed 28% center column, home team — with absolutely positioned 5px team color bars pinned full-height to the outer left and right edges. Each team panel carries the display-face team name (with a 22px amber trophy inline for the winner), a record line in Dim, and a score in an inset well. The center column drops to Well Sunken with hairline borders on both sides, and its contents swap entirely by game state: tipoff time plus a countdown when scheduled, a Buzzer Red `LIVE` badge over a period-and-clock readout when live, and an outlined `Final` plate when over. Losing scores fade to `opacity: 0.45`, ties to `0.7`.

### Signature Component: the research log

A collapsed `<details>` disclosure under an AI report, separated by a hairline. Rows are `TOOL_NAME` in Jumbotron Amber mono, a Hairline Strong outlined status badge, a truncating result string in Dim, and a right-aligned duration in 10px mono. The default marker is suppressed and replaced with a caret that rotates 180° on `[open]` over `0.15s`.

## Do's and Don'ts

### Do:

- **Do** express depth by moving a surface along the tonal ramp — Arena Dark, Panel Raised, Well Sunken, Surface, Surface High — before reaching for a shadow.
- **Do** set every value that updates during a live poll in tt-autonomous-mono, so the layout cannot twitch on a fetch.
- **Do** route all team color through `getTeamStyle(tricode)` in `util/teamColorStrategy.js`. It carries the luminance gate and the per-team strategy overrides.
- **Do** give every new surface a complete answer for all three game states — scheduled, live, and final.
- **Do** keep label type uppercase, mono, and wide-tracked, scaling tracking inversely with size (0.25em at 12px down to 0.07em at 24px).
- **Do** use `#fff2d6` for score numerals and `#f2f4f8` for interface text. They are not interchangeable.
- **Do** let controls recede at rest — transparent or hairline — and resolve on hover and `:focus-visible`, which are always styled together.
- **Do** seat numbers in an inset well: Well Sunken fill, Hairline Strong border, 4–6px radius, `width: fit-content`.

### Don't:

- **Don't** introduce a light theme or a `prefers-color-scheme` branch. The dark ground is the product, not a mode.
- **Don't** put Jumbotron Amber anywhere a team already owns the region. Amber is the neutral UI accent; team color carries identity.
- **Don't** place a raw team color as text without the `getLuminance() > 0.12` gate — many official palettes are unreadable on `#14171f`.
- **Don't** use a radius outside 4 / 6 / 8 / 9999px. There is no 12px or 16px corner in this system.
- **Don't** draw a border thicker than 1px unless it is team color or an active tab.
- **Don't** add a shadow to interior structure. Inside a card, separation is hairlines and tonal steps only.
- **Don't** set a fourth typeface, or use soleil for anything but multi-sentence AI report prose.
- **Don't** reorganize layout at the 768px breakpoint beyond the sanctioned stacking exception. It scales type and padding; multi-column grids that cannot fit a phone stack to one column, and nothing else rewraps.
- **Don't** animate a control's size, scale, or shadow on press. State change is color and opacity over 0.12–0.18s.
- **Don't** overlay the fixed header/date-bar stack. New page chrome joins the stack and increases page top padding to match.
