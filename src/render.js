// Drawing. Reads state, never changes it.
import { CONFIG } from './config.js';
import { rgbCss, theme } from './palettes.js';

// Shrink a convex polygon by moving every edge inward by d.
function inset(poly, d) {
  const n = poly.length;
  const cx = poly.reduce((s, p) => s + p[0], 0) / n;
  const cy = poly.reduce((s, p) => s + p[1], 0) / n;
  const lines = poly.map((p, k) => {
    const q = poly[(k + 1) % n];
    let dx = q[0] - p[0], dy = q[1] - p[1];
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    let nx = -dy, ny = dx;
    if ((cx - (p[0] + q[0]) / 2) * nx + (cy - (p[1] + q[1]) / 2) * ny < 0) { nx = -nx; ny = -ny; }
    return { px: p[0] + nx * d, py: p[1] + ny * d, dx, dy };
  });
  return poly.map((_, k) => {
    const a = lines[(k - 1 + n) % n], b = lines[k];
    const den = a.dx * b.dy - a.dy * b.dx;
    if (Math.abs(den) < 1e-9) return [b.px, b.py];
    const t = ((b.px - a.px) * b.dy - (b.py - a.py) * b.dx) / den;
    return [a.px + a.dx * t, a.py + a.dy * t];
  });
}

const num = (v) => v.toFixed(3);

// Draws the garden. `paint` comes from paintGarden; `fresh` is the set of tile ids that
// changed with the last action, which get a one-off pop.
export function renderGarden(svg, garden, paint, { fresh = new Set(), interactive = true } = {}, cfg = CONFIG) {
  const { minX, minY, maxX, maxY } = garden.bounds;
  svg.setAttribute('viewBox', `${num(minX)} ${num(minY)} ${num(maxX - minX)} ${num(maxY - minY)}`);
  const r = cfg.TILE_RADIUS * garden.unit;
  const pull = (cfg.TILE_GAP / 2) * garden.unit + r;                         // inset, then a round stroke restores the size with soft corners
  let defs = '', shapes = '', gid = 0;
  for (const tile of garden.tiles) {
    const p = paint.get(tile.id);
    let fill;
    if (p.grad) {
      const id = `blend${gid++}`;
      const { from, to, stops } = p.grad;
      defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${num(from[0])}" y1="${num(from[1])}" x2="${num(to[0])}" y2="${num(to[1])}">`
        + stops.map((s) => `<stop offset="${s.off}" stop-color="${rgbCss(s.rgb)}"/>`).join('') + '</linearGradient>';
      fill = `url(#${id})`;
    } else {
      fill = rgbCss(p.fill);
    }
    const pts = inset(tile.poly, pull).map(([x, y]) => `${num(x)},${num(y)}`).join(' ');
    const wakeable = interactive && p.state === 'frontier';
    shapes += `<polygon class="tile ${tile.kind} ${p.state}${fresh.has(tile.id) ? ' pop' : ''}" data-tile="${tile.id}" points="${pts}"`
      + ` fill="${fill}" stroke="${fill}" stroke-width="${num(2 * r)}" stroke-linejoin="round"`
      + (wakeable ? ' tabindex="0" role="button" aria-label="Wake this sun"' : '') + '/>';
  }
  svg.innerHTML = `<defs>${defs}</defs>${shapes}`;
}

// Small deterministic random generator, so the sky is the same every visit.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A field of stars behind everything. Colors come from CSS variables, so the sky follows the palette.
export function drawSky(svg, cfg = CONFIG) {
  const rnd = mulberry32(cfg.SKY_SEED);
  svg.setAttribute('viewBox', '0 0 1600 1000');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  let out = '';
  for (let n = 0; n < cfg.STAR_COUNT; n++) {
    const x = rnd() * 1600, y = rnd() * 1000;
    const size = 0.5 + rnd() ** 3 * 2;
    const tint = rnd();
    const fill = tint < 0.8 ? 'var(--ink)' : tint < 0.9 ? 'var(--a)' : 'var(--b)';
    const opacity = 0.2 + rnd() * 0.6;
    const twinkle = rnd() < 0.12 ? ` class="twinkle" style="animation-delay:${(rnd() * 6).toFixed(1)}s"` : '';
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(2)}" fill="${fill}" opacity="${opacity.toFixed(2)}"${twinkle}/>`;
  }
  svg.innerHTML = out;
}

export function applyTheme(pal, schemeKey) {
  const vars = theme(pal, schemeKey);
  for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
  document.getElementById('themeColor')?.setAttribute('content', vars['--bg']);
}
