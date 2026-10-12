# Gardens of Distant Suns

A web-based solarpunk idle game. Systems are 8-point zellige stars that develop from muted gray to vivid color, linked by gates at the cross-shaped junctions between them.

## Where the design lives

The design document is not in this repo. It is `claude/HANDOFF.md` in the claude.ai project "Gardens Of Distant Suns Idle". Read it before changing game rules. Its tags say what is safe to change: **[Decided]** needs Mikel's approval, **[Assumed]** is cheap to change, **[Open]** has a recommended default. When a rule changes here, update the handoff to match.

## Conventions

- Plain JavaScript ES modules. No build step and no dependencies. The game must run by serving the repo root as static files (GitHub Pages works).
- Every tuning number lives in `src/config.js`.
- `src/sim.js` never touches the DOM. `src/render.js` never changes state.
- Tiles store RGB only. HSV, hue family and tier are derived every time and never saved.
- Geometry comes from lattice position (`src/geometry.js`) and is never saved.
- Bump `STATE_VERSION` in `src/state.js` when the save shape changes.
- Run `npm test` (Node 20+, nothing to install) before committing.

## Status

Milestone 0 is in progress. Built: zellige geometry, color and tier rules, the yield formula, saving, offline progress with the Afterglow panel, and drawing the garden. Not built: `chooseHue` and `cultivate` in `src/actions.js`, and the click handling that calls them.
