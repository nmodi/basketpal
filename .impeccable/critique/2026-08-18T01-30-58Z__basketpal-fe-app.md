---
target: the app
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-18T01-30-58Z
slug: basketpal-fe-app
---
Method: dual-agent (A: design-review subagent · B: detector/browser subagent)

# Design Critique — Basketpal (the app)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No "N s behind" confirmation; Render cold start = blank tab (no axios timeout, SSR blocks, no shell) |
| 2 | Match System / Real World | 3 | OT labeled "Q5:"; local time relabeled "ET" with AM/PM stripped — ambiguous and wrong outside ET |
| 3 | User Control and Freedom | 2 | Delay resets every reload; settings X silently discards edits; selected date lost on league switch |
| 4 | Consistency and Standards | 3 | Model-comparison page fully off-system (system-ui font, filled rounded button); UA-default focus ring in settings |
| 5 | Error Prevention | 1 | The spoiler is the product's defined error and it is not prevented: live score on load, delay defaults 0, Spoiler Shield unwired |
| 6 | Recognition Rather Than Recall | 3 | Emoji performance badges explained only via hover `title` — no legend, nothing on touch |
| 7 | Flexibility and Efficiency | 1 | Cards/dates are `div onClick` — no cmd-click/new-tab; no shortcuts; no deep link to tab or delay |
| 8 | Aesthetic and Minimalist Design | 4 | Genuinely excellent — tonal ramp, one accent, deference to team color, verified in screenshots |
| 9 | Error Recovery | 2 | "Article unavailable" dead ends; injuries fail silently; cold start shows nothing |
| 10 | Help and Documentation | 1 | PIE, Game Score, badges, and the delay slider itself are never explained anywhere |
| **Total** | | **22/40** | **Acceptable — beautiful system undermined by unprotected core flow, mobile breakage, and a trust-destroying data bug** |

## Design Specificity Verdict

**LLM assessment:** Authored, not interchangeable. The "Arena Scoreboard" world is genuinely executed — recessed warm-white score wells, team color bars clipped to card edges, mono type on every polling value so nothing twitches on refresh, winner turns amber while the loser fades. Schedule, game page, and settings read as one physical object; this is not a template. But the product's headline claim — broadcast delay sync — is nearly invisible in the product: it renders only during a live game, sits as a 10px footer label, defaults to 0, is never persisted, and the frontend never uses the backend's `?delay=N` parameter, so opening a live game always flashes the live score first. The one thing the product exists to prevent happens on every page load.

**Deterministic scan:** The CLI scan of `basketpal-fe/app` source was clean (exit 0, zero findings). In-browser scans across five rendered views found 149 elements (57 schedule, 37 pregame, 43 postgame, 11 team stats, 1 model-comparison). The dominant signal is a single token: `#6c7384` (fg-dim) failing WCAG contrast on every dark surface it touches — 85 instances at 2.6–4.1:1 (needs 4.5:1). Second: `ResearchLog.jsx` accounts for all `text-overflow` findings (result spans overflowing 491–560px on postgame) and all `undersized-ui-text` findings (10px functional text). Also flagged: ~136-char line length in pregame prose, cramped padding on report cards, and a flat type hierarchy on the off-system model-comparison page. Probable false positives: "thin border + wide shadow" ×16 (this is the committed panel-lift treatment in DESIGN.md), "cyan neon text" (team colors under the Deference Rule), and em-dash-overuse (fires on the repeated "TODAY — MON AUG 17" date-header template, not prose).

**Where they agree:** the detector's 560px ResearchLog overflow is the mechanical proof of Assessment A's "the FACT CHECK row — the money shot — truncates mid-sentence." The 85 contrast failures confirm A's accessibility finding on dim labels. The flat-hierarchy hit on model-comparison confirms A's "fully off-system" verdict.

## Overall Impression

The visual system is the best thing here and it is genuinely good — disciplined, physical, authored. The failure is that the product's three proudest claims are each betrayed on screen: the delay feature doesn't protect you at page load, the fact-checked postgame report sits next to a Player of the Game chosen by a NaN sort, and the second-screen phone scenario — the actual usage scene — cannot read player stats because the game-page grids never stack. The single biggest opportunity: make delay sync a persisted, visible app mode instead of a buried per-page widget, and let the data layer earn the trust the research log already demonstrates.

## What's Working

1. **The tonal system is real and disciplined.** Wells darker than the page, panels lighter, warm bulb numerals distinct from interface white, amber only where no team owns the region — verified rule-for-rule against DESIGN.md in every screenshot. Rare coherence for a solo project.
2. **The research log is the best idea in the product.** Amber mono tool names, per-team badges, millisecond timings, and a visible FACT CHECK failure make the hard engineering legible — exactly the product's stated principle — while staying collapsed for casual readers.
3. **State-aware composition.** Scheduled/live/final swap the card center, tab set, and polling cadence coherently; skeleton shimmer for pending reports; date-bar dots for game days.

## Priority Issues

1. **[P0] Player of the Game is effectively random.** `calculatePIE` (`app/util/statFunctions.js`) reads `teamStats.points` and `teamStats.reboundsDefensive`, which the backend `TeamStats` model doesn't contain → every PIE is NaN → the sort is a no-op → `getTopPlayers` returns the first roster entry. Observed live: a 0-point POTG ("🚀 0 PTS") beside an AI story praising the actual stars. **Why:** the flagship postgame surface lies, and it cancels the credibility the fact-checked pipeline earns on the same screen. **Fix:** compute the PIE denominator from summed player stats (or add the missing fields to `TeamStats`), and guard against NaN/0-minute heroes. **Command:** /impeccable harden
2. **[P0] Mobile game page is structurally broken.** `Postgame.module.css` has zero media queries: the `3fr 2fr` top row clips the POTG card at 390px; `repeat(4,1fr)` keys force page-level horizontal scroll; the On Court flex row pushes PTS/REB/AST fully off-canvas (765px scrollWidth vs 390 viewport). **Why:** the phone-as-second-screen scene is the product's actual usage scene. **Fix:** stack all three grids below 768px — and amend DESIGN.md's No-Reflow Rule, which currently forbids the fix. **Command:** /impeccable adapt
3. **[P1] Delay sync doesn't protect at entry and is invisible.** Default 0, unpersisted, loader always fetches live data (`?delay=N` never sent), and raising the slider freezes rather than rewinds. No affordance ever confirms "you are N seconds behind"; without a live game the feature has zero pixels anywhere. **Fix:** persist delay in `basketpal_settings`, request `boxscore?delay=N` on first fetch, render a persistent "⏱ 60S BEHIND" plate in the scoreboard center, and give the feature a presence in scheduled/final states. **Command:** /impeccable harden (behavior) + /impeccable shape (delay-as-app-mode)
4. **[P1] Accessibility floor.** Keyboard users cannot open a game or change the date (cards and DateBar items are non-focusable `div`s); the delay slider has `outline: none` with no replacement; the only `:focus-visible` styles in the app live in the settings modal; scores have no `aria-live`; winner conveyed by icon+color only; and the detector measured 85 instances of `#6c7384` below AA (2.6–4.1:1) on the 10–12px labels where contrast matters most. **Fix:** real links for cards, focus styles on every control, lighten fg-dim (or reserve it for ≥14px), `aria-live="polite"` on scores. **Command:** /impeccable audit → harden
5. **[P1] WNBA team identity colors are wrong — in the league currently in season.** `settings.js` WNBA team ids are misassigned (e.g. the id the API uses for Atlanta maps to Washington's colors), so chips and POTG accents wear the wrong franchise's colors. A second, correct source exists (`teamColorStrategy.js` by tricode). **Fix:** delete the id-keyed lookup, route everything through `getTeamStyle(tricode)`. **Command:** /impeccable harden

## Persona Red Flags

**Alex (power user):** cannot cmd/middle-click any game card (`div onClick`, no `<a>`); must re-drag the delay slider from NONE after every reload; no deep links to tab or delay; schedule countdowns go stale because nothing re-renders without live games; `/nba` bounces through two redirects.

**Sam (accessibility):** cannot reach a single game by keyboard; flagship slider is focus-invisible; emoji badges have no accessible name and no touch path; 85 measured contrast failures on dim labels; native `<dialog>` with Escape in settings is the one bright spot.

**Casey (distracted mobile):** cold start is a blank dark tab with zero feedback ("site is down"); on the game page her thumb meets a clipped POTG card, sideways-scrolling keys, and stat columns off-canvas; her delay setting and tab evaporate on refresh. The schedule itself is excellent on mobile — which makes the game-page collapse more jarring.

**The hiring engineer (60-second skim):** finds the research log in ~20s — then the FACT CHECK row truncates mid-sentence (detector: 560px overflow, no expansion). The same screen shows a 0-point POTG, which reads as "the data layer is broken." The delay machinery has no UI presence without a live game. The model-comparison view is linked from nowhere. CLAUDE.md promises an SVG shot chart that does not exist in the frontend — docs an engineer will read, then not find.

## Minor Observations

- ResearchLog result text: 10px type, overflowing spans (491–560px), no way to read a truncated fact-check — the portfolio money shot needs room.
- Pregame page never shows tipoff time (`gameTime` in `GamePreview.jsx` is computed and never rendered); scoreboard shows 0–0 over an empty black center at the most anticipatory moment.
- Key moments prose set in mono at dim contrast (violates the system's own One Prose Face rule); overtime labeled "Q5:".
- "Ball Security −5 TO" — sign conventions flip per stat with no cue; "0 / 0 → 0%" FT row presents undefined as zero.
- Settings: all four toggles decorative/unwired; Notifications promises pushes that don't exist (brushes "claim nothing that isn't true"); mono face used for multi-sentence descriptions.
- `body { font-family: sans-serif }` fallback silently drops unstyled elements out of the type system (visible on 404 page).
- No `<h1>` or `<main>` landmark on any page; wordmark isn't a home link and vanishes on game pages.
- NBA empty state says "No games scheduled" without mentioning the offseason or that WNBA is one click away.
- Pregame report prose runs ~136 chars/line (detector); postgame ~88.
- Dead code in a portfolio repo: `gameTime`, `.startLabel`.

## Questions to Consider

1. Why is delay a page widget instead of an app mode? "I'm watching a 60s-delayed stream" is a session-level truth — a persisted global mode could gate the game-page load, dim schedule scores, and wear a permanent "60S BEHIND" plate, making the headline feature visible even with no live game.
2. What does an arena scoreboard show before tipoff? Not 0–0 over a void — the countdown clock is pure arena character, currently a dead variable.
3. Could the research log be the portfolio's front door instead of its footnote — an always-available "how this app works" surface with real traces?
4. Should deterministic widgets be allowed to contradict the fact-checked AI? If every claim on the postgame surface passed one shared validation gate, the POTG bug would have been structurally impossible.
