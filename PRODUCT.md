# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the author.** Basketpal began as a personal tool for watching NBA and WNBA games on a feed that runs behind live, where every mainstream scores app spoils the outcome before the broadcast reaches it.

**It has since become primarily a portfolio piece.** The evaluating audience is **engineers judging architecture and systems thinking**. The intended takeaway: this is built properly — hexagonal backend, an agentic AI pipeline with deterministic fact-checks, real-time polling — not a toy.

Other people using it is a nice-to-have, not a goal. Design decisions should not be justified by hypothetical mass adoption.

## Product Purpose

Track a live NBA or WNBA game — score, on-court players, advanced stats, shot chart — in a way that stays in sync with what the viewer is actually watching, plus AI-generated pregame previews and postgame reports.

Success is twofold and both must hold: the author can use it during a real game without being spoiled, and an engineer reading the code or using the app comes away convinced the system underneath is well-built.

## Positioning

**Broadcast delay sync.** The delay control (0s / 10s / 30s / 45s / 60s / 90s / 2min) replays game state as of N seconds ago, so the app matches the viewer's stream instead of getting ahead of it. This is the mechanism a competing scores app could not truthfully copy — it requires storing time-scored snapshots of every in-progress game, which mainstream apps have no reason to build.

Everything else the product does — fact-checked agentic reports, live advanced stats, shot charts — is real and differentiating, but delay sync is the headline claim.

## Operating Context

- The real usage scene is watching a game while consulting the app as a second screen.
- Game state is polled continuously while a game is in progress (5s boxscore polling on the game page, 30s on the schedule).
- Games move through three states that change what the interface shows entirely: SCHEDULED (1) → IN_PROGRESS (2) → FINAL (3). Every surface must handle all three.
- Two leagues run as first-class parallels: NBA and WNBA, with separate routes, team sets, and schedule pages. *(Inferred from the codebase — routes, `League` enum, and both team tables in `util/settings.js` — not separately confirmed.)*

## Capabilities and Constraints

**Confirmed constraint — never violate:** data comes from the unofficial `nba_api`. No NBA or WNBA branding, endorsement, licensing, partnership, or commercial claim may ever be implied anywhere in the product.

**Shipped capabilities:** schedule with date bar; live scoreboard with period breakdown and the broadcast delay slider; on-court player table; team stats comparison (16 rows); SVG shot chart; pregame preview; postgame report with player of the game and keys to the win; agentic pregame/postgame reports with a visible research trace; blind model-comparison view.

**Current implementation facts** (true today, but *not* declared inviolable — future work may change them):
- Settings, favorite teams and preferences live in `localStorage` under `basketpal_settings`. No accounts, no login, no cross-device sync.
- The palette in `app/styles/global.css` is dark-only; there is no light theme.
- Both services deploy on Render's free tier, so cold starts and slow first loads are a routine condition rather than a rare edge case.

**Explicitly undecided / unbuilt:** Spoiler Shield exists as a settings toggle and copy but is not wired to anything. Favorite teams and AI preferences are likewise unwired. `BACKLOG.md` holds the rest.

**Terminology used throughout:** PIE (Player Impact Estimate, used to rank Player of the Game), Game Score, True Shooting %, Keys to the Win, tricode, Microtron (schedule game card), Minitron (game page).

## Brand Commitments

- Name: **Basketpal**.
- Typeface loaded from Typekit (`din3oqv`) in `root.jsx`.
- Icons use `@phosphor-icons/react` — a standing rule in `CLAUDE.md`/`AGENTS.md`.

No aesthetic direction, palette, or visual reference was declared binding during init.

## Evidence on Hand

- Real live and historical game data from `nba_api` — no fixtures or mock data needed to demonstrate the product.
- Official team colors for all 30 NBA and 13 WNBA teams in `app/util/settings.js`.
- Real AI-generated report output, including the tool-call research trace rendered by `ResearchLog.jsx`.

There are no users, no usage metrics, no testimonials, no press, and no revenue. Future work must not fabricate any of these.

## Product Principles

1. **Never spoil the viewer.** The app's whole reason to exist is staying behind the truth on purpose. Anything that leaks a result ahead of the user's stream is a defect, not a feature.
2. **The engineering must be legible.** The evaluating audience is engineers. Where the system does something genuinely hard — delay snapshots, fact-checked agent loops — the interface should let that be seen rather than hide it behind magic.
3. **Claim nothing that isn't true.** Unofficial data, no partnership, no users. Every word in the product has to survive that.
4. **Three game states, always.** Scheduled, live, and final are not variants of one screen; each has its own job. A design that only works for one of them is unfinished.
5. **Built for one real viewer, not a hypothetical market.** Scope decisions answer to actual use during an actual game, not to imagined adoption.
