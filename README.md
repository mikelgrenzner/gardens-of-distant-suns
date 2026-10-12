# Gardens of Distant Suns

A colorful solarpunk idle game. Your garden is a Moroccan zellige mosaic: each 8-point star is a star system, and each cross between stars is a junction where wormhole gates form. Systems start as muted gray possibilities and grow, while you're away, into monochrome, two-color and finally fully vibrant patterns.

## Play it locally

The game is plain HTML and JavaScript with no build step. Browsers won't load its modules from a double-clicked file, so serve the folder:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Run the tests

```sh
npm test
```

Needs Node 20 or later. Nothing to install.

## Status

Milestone 0 is in progress: one system you can grow from gray to monochrome. The garden draws, stocks accumulate, progress saves, and the Afterglow panel reports what grew while you were away. Choosing a hue and cultivating tiles come next.

## Layout

| Path | What it holds |
|---|---|
| `index.html` | The page |
| `src/config.js` | Every tuning number |
| `src/geometry.js` | The zellige star-and-cross tessellation |
| `src/color.js` | Color math and tier rules |
| `src/state.js` | New games and saving |
| `src/sim.js` | Yield and time |
| `src/actions.js` | Player actions |
| `src/render.js` | Drawing the garden |
| `src/main.js` | Wiring and the game loop |
| `tests/` | Unit tests |
