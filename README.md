# Gardens of Distant Suns

A colorful solarpunk idle game. Your garden is a field of large tiles on a dark, starry ground. Big tiles are suns. The small tiles between them are gates and knots, which blend the colors of the suns they join and light up as those suns wake.

The look follows [Undertone](https://mikelgrenzner.github.io/undertone/): big rounded tiles with clear gaps, and the same color palettes.

## Play it locally

The game is plain HTML and JavaScript with no build step. Browsers won't load its modules from a double-clicked file, so serve the folder:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## How it plays today

- Your central sun starts awake and gathers energy, life and information.
- Spend that light to wake a sun next to your garden. Each one costs more than the last.
- When every sun a gate or knot touches is awake, it opens and adds income of its own.
- Close the tab and come back: the Afterglow panel shows what was gathered while you were away.
- Pattern, Palette and Style can be switched freely. "Preview colors" lights every tile so you can compare them.

## Patterns

| Pattern | Shapes | Notes |
|---|---|---|
| Trellis | Hexagons, squares, triangles | A square is a gate between two suns; a triangle is a knot where three meet |
| Courtyard | Octagons, squares | Suns touch directly; each square is a knot where four meet |
| Plot | Squares | Every tile is a sun |
| Deep field | Penrose rhombs | Advanced. The pattern never repeats |

## Run the tests

```sh
npm test
```

Needs Node 20 or later. Nothing to install.

## Layout

| Path | What it holds |
|---|---|
| `index.html` | The page and its styling |
| `src/config.js` | Every tuning number |
| `src/tilings.js` | The tile patterns |
| `src/palettes.js` | Palettes, styles and color picking |
| `src/garden.js` | Who touches whom, and how each tile is painted |
| `src/color.js` | HSV math and tier rules |
| `src/state.js` | New games and saving |
| `src/sim.js` | Yield, cost and time |
| `src/actions.js` | Player actions |
| `src/render.js` | Drawing the garden and the sky |
| `src/main.js` | Wiring and the game loop |
| `tests/` | Unit tests |
