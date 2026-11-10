// A garden: one pattern's tiles plus who touches whom, and how to color it for a given
// set of awake suns. Pure functions; no DOM and no saved state.
import { CONFIG } from './config.js';
import { PATTERNS, adjacency, center } from './tilings.js';
import { litRgb, latentRgb } from './palettes.js';

const cache = new Map();

export function buildGarden(key) {
  if (cache.has(key)) return cache.get(key);
  const pattern = PATTERNS[key] || PATTERNS[CONFIG.START_PATTERN];
  const { unit, tiles } = pattern.build();
  const byId = new Map(tiles.map((t) => [t.id, t]));
  const adj = adjacency(tiles);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const t of tiles) {
    t.c = center(t.poly);
    for (const [x, y] of t.poly) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  // t: where the tile sits on the diagonal from one corner of the field (0) to the other (1).
  const cs = tiles.map((t) => t.c);
  const lo = [Math.min(...cs.map((c) => c[0])), Math.min(...cs.map((c) => c[1]))];
  const hi = [Math.max(...cs.map((c) => c[0])), Math.max(...cs.map((c) => c[1]))];
  for (const t of tiles) {
    t.t = ((t.c[0] - lo[0]) / (hi[0] - lo[0] || 1) + (t.c[1] - lo[1]) / (hi[1] - lo[1] || 1)) / 2;
  }

  const suns = tiles.filter((t) => t.kind === 'sun');
  const links = tiles.filter((t) => t.kind !== 'sun');
  // Where the builder didn't say which suns a gate or knot joins, it joins the suns it shares an edge with.
  for (const l of links) {
    if (!l.links) l.links = [...adj.get(l.id)].filter((id) => byId.get(id).kind === 'sun');
  }
  // Two suns are neighbors if they share an edge, or a gate or knot joins them.
  const neighbors = new Map(suns.map((s) => [s.id, new Set()]));
  for (const s of suns) {
    for (const id of adj.get(s.id)) if (byId.get(id).kind === 'sun') neighbors.get(s.id).add(id);
  }
  for (const l of links) {
    for (const a of l.links) for (const b of l.links) if (a !== b) neighbors.get(a).add(b);
  }
  const mid = [(minX + maxX) / 2, (minY + maxY) / 2];
  const dist = (s) => Math.hypot(s.c[0] - mid[0], s.c[1] - mid[1]);
  const origin = suns.reduce((best, s) => (dist(s) < dist(best) - 1e-9 ? s : best)).id;

  const garden = { key, name: pattern.name, blurb: pattern.blurb, unit, tiles, byId, suns, links, neighbors, origin,
    bounds: { minX, minY, maxX, maxY } };
  cache.set(key, garden);
  return garden;
}

// Sleeping suns that touch an awake one: the suns that can be woken next.
export function frontier(garden, awake) {
  const out = new Set();
  for (const id of awake) {
    for (const n of garden.neighbors.get(id) || []) if (!awake.has(n)) out.add(n);
  }
  return out;
}

// A gate or knot is open once every sun it joins is awake.
export function openLinks(garden, awake) {
  return garden.links.filter((l) => l.links.length >= 2 && l.links.every((id) => awake.has(id)));
}

export function sunRgb(tile, pal, schemeKey) {
  return litRgb(tile.t, pal, schemeKey);
}

const mean = (colors) => [0, 1, 2].map((k) => Math.round(colors.reduce((s, c) => s + c[k], 0) / colors.length));

export function linkRgb(garden, link, pal, schemeKey) {
  return mean(link.links.map((id) => sunRgb(garden.byId.get(id), pal, schemeKey)));
}

// How to draw every tile. Returns Map<tileId, paint>, where paint is
//   { state, fill: rgb }                         a flat color, or
//   { state, grad: { from, to, stops } }         a blend running between the suns the tile joins.
// state is 'awake' | 'frontier' | 'latent' for suns and 'open' | 'partial' | 'latent' for gates and knots.
export function paintGarden(garden, awake, pal, schemeKey, cfg = CONFIG) {
  const paint = new Map();
  const edge = frontier(garden, awake);
  const sleeping = (t, lift = cfg.LATENT_LIFT) => latentRgb(t, pal, schemeKey, lift, cfg.LATENT_SATURATION);

  for (const s of garden.suns) {
    if (awake.has(s.id)) paint.set(s.id, { state: 'awake', fill: sunRgb(s, pal, schemeKey) });
    else if (edge.has(s.id)) paint.set(s.id, { state: 'frontier', fill: sleeping(s.t, cfg.FRONTIER_LIFT) });
    else paint.set(s.id, { state: 'latent', fill: sleeping(s.t) });
  }

  for (const l of garden.links) {
    const joined = l.links.map((id) => garden.byId.get(id)).sort((a, b) => a.t - b.t);
    const lit = joined.filter((s) => awake.has(s.id)).length;
    if (lit === 0) { paint.set(l.id, { state: 'latent', fill: sleeping(l.t) }); continue; }
    const state = lit === joined.length ? 'open' : 'partial';
    const color = (s) => (awake.has(s.id) ? sunRgb(s, pal, schemeKey) : sleeping(s.t));
    if (joined.length === 1) { paint.set(l.id, { state, fill: color(joined[0]) }); continue; }

    // The blend runs along the line between the two suns furthest apart on the palette,
    // squeezed to the tile's own extent so the whole blend is visible inside it.
    const a = joined[0], b = joined[joined.length - 1];
    const ax = b.c[0] - a.c[0], ay = b.c[1] - a.c[1], len2 = ax * ax + ay * ay;
    const along = ([x, y]) => ((x - a.c[0]) * ax + (y - a.c[1]) * ay) / len2;
    const span = l.poly.map(along);
    const p0 = Math.min(...span), p1 = Math.max(...span);
    const point = (p) => [a.c[0] + ax * p, a.c[1] + ay * p];
    // Suns at the same place along the line (the two side suns of a four-way knot) share a stop.
    const groups = new Map();
    for (const s of joined) {
      const off = Math.round(Math.min(1, Math.max(0, along(s.c))) * 100) / 100;
      if (!groups.has(off)) groups.set(off, []);
      groups.get(off).push(color(s));
    }
    const stops = [...groups.entries()].sort((x, y) => x[0] - y[0]).map(([off, colors]) => ({ off, rgb: mean(colors) }));
    paint.set(l.id, { state, grad: { from: point(p0), to: point(p1), stops } });
  }
  return paint;
}
