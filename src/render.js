// Drawing. Reads state, never changes it.
import { CONFIG } from './config.js';
import { buildField, R } from './geometry.js';
import { ROLE_ANGLES, hsvToRgb, rgbCss } from './color.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Deterministic per-position number in [0, 1) for the decorative field.
function hash(i, j, salt) {
  const x = Math.sin(i * 127.1 + j * 311.7 + salt * 74.7) * 43758.5453;
  return x - Math.floor(x);
}

// Systems that aren't playable yet: dim, faintly tinted.
function decorStarColor(i, j, shape, k) {
  const h = ROLE_ANGLES[Math.floor(hash(i, j, 1) * 6)];
  const h2 = (h + (hash(i, j, 2) < 0.5 ? 180 : 60)) % 360;
  if (shape === 'core') return rgbCss(hsvToRgb(h, 0.08, 0.30));
  return rgbCss(hsvToRgb(k % 2 ? h2 : h, 0.14, k % 2 ? 0.34 : 0.38));
}

function polygon(poly, fill, cfg) {
  const el = document.createElementNS(SVG_NS, 'polygon');
  el.setAttribute('points', poly.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(' '));
  el.setAttribute('fill', fill);
  el.setAttribute('stroke', cfg.GROUT);
  el.setAttribute('stroke-width', '0.035');
  el.setAttribute('stroke-linejoin', 'round');
  return el;
}

export function render(svg, state, cfg = CONFIG) {
  const { stars, junctions } = buildField(cfg.FIELD_COLS, cfg.FIELD_ROWS);
  const w = (4 * cfg.FIELD_COLS + 2) * R;
  const h = (4 * cfg.FIELD_ROWS + 2) * R;
  svg.setAttribute('viewBox', `${-w / 2} ${-h / 2} ${w} ${h}`);
  svg.replaceChildren();

  const bg = document.createElementNS(SVG_NS, 'rect');
  Object.entries({ x: -w / 2, y: -h / 2, width: w, height: h, fill: cfg.GROUT })
    .forEach(([k, v]) => bg.setAttribute(k, v));
  svg.append(bg);

  for (const jn of junctions) {
    for (const t of jn.tiles) {
      const fill = t.shape === 'hub' ? rgbCss(hsvToRgb(225, 0.2, 0.2)) : rgbCss(hsvToRgb(225, 0.14, 0.26));
      svg.append(polygon(t.poly, fill, cfg));
    }
  }

  const playable = new Map(state.systems.map((s) => [`${s.i},${s.j}`, s]));
  for (const star of stars) {
    const system = playable.get(`${star.i},${star.j}`);
    const colors = system ? new Map(system.tiles.map((t) => [t.id, t.rgb])) : null;
    star.tiles.forEach((t, n) => {
      const fill = colors ? rgbCss(colors.get(t.id)) : decorStarColor(star.i, star.j, t.shape, n);
      const el = polygon(t.poly, fill, cfg);
      if (colors) {
        el.dataset.system = system.id;
        el.dataset.tile = t.id;
        el.classList.add('playable');
      }
      svg.append(el);
    });
  }
}
