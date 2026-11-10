# Gardens of Distant Suns

A web-based solarpunk idle game. The garden is a field of large tiles on a dark, starry ground. Large tiles are suns; the small tiles between them are gates (joining two suns) and knots (joining three or four), which blend the colors of the suns they join.

## Where the design lives

The design document is not in this repo. It is `claude/HANDOFF.md` in the claude.ai project "Gardens Of Distant Suns Idle". Read it before changing game rules. Its tags say what is safe to change: **[Decided]** needs Mikel's approval, **[Assumed]** is cheap to change, **[Open]** has a recommended default. When a rule changes here, update the handoff to match.

## Never edit Undertone

Undertone (mikelgrenzner/undertone, Mikel's pomodoro timer at mikelgrenzner.github.io/undertone) is the visual style reference for this game: largish tiles with clear gaps, a dark ground, and its color palettes (copied into `src/palettes.js`). Work on this game may read it but must never edit, commit to, or push to it. Don't request push access to it from here. Copy anything borrowed into this repo instead. This rule applies to work on this game only; it does not restrict work done for Undertone itself.

## Conventions

- Plain JavaScript ES modules. No build step and no dependencies. The game must run by serving the repo root as static files (GitHub Pages works).
- Every tuning number lives in `src/config.js`.
- `src/sim.js` and `src/garden.js` never touch the DOM. `src/render.js` never changes state.
- State stores only which suns are awake, the stocks, and the chosen pattern, palette and style. Geometry, adjacency and colors are derived every time and never saved.
- Every pattern in `src/tilings.js` must tessellate, with all edges the same length. The tests check both.
- Income is computed from the `SIM_SCHEME` style's colors, so switching display style never changes income.
- Bump `STATE_VERSION` in `src/state.js` when the save shape changes.
- Run `npm test` (Node 20+, nothing to install) before committing.

## Status

A playable base: four patterns (Trellis, Courtyard, Plot, and the never-repeating Deep field), waking suns for light, links that open and pay, saving, and the Afterglow panel. The tier rules in `src/color.js` are not used yet. The handoff's section 12 lists gameplay proposals that are waiting on Mikel; don't build them until he picks.
