// Tile patterns. Every pattern tessellates: its tiles fill the plane edge to edge.
// Each builder returns { unit, tiles } where unit is the pattern's edge length and
// a tile is { id, kind, poly, links? }.
//
// Tile kinds carry the rules:
//   sun   a large tile. A star system; the thing you wake.
//   gate  a small tile joining two suns.
//   knot  a small tile joining three or four suns.
// Where a builder knows which suns a gate or knot joins, it lists them in `links`.
// Geometry is always derived from the pattern and never saved.

const SQ2 = Math.SQRT2;
const SQ3 = Math.sqrt(3);
const PHI = (1 + Math.sqrt(5)) / 2;
const rad = (deg) => (deg * Math.PI) / 180;

// Plot: plain squares, every tile a sun with four neighbors.
function plot() {
  const cols = 8, rows = 5, tiles = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      tiles.push({ id: `p${i},${j}`, kind: 'sun', poly: [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]] });
    }
  }
  return { unit: 1, tiles };
}

// Courtyard: octagons and squares (4.8.8). Octagon suns touch four other suns directly;
// each square is a knot where four suns meet.
function courtyard() {
  const cols = 6, rows = 4, a = 1, w = a * (1 + SQ2), d = a / SQ2, tiles = [];
  const id = (i, j) => `o${i},${j}`;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * w, y = j * w, p = a / 2, q = w / 2;
      tiles.push({ id: id(i, j), kind: 'sun', poly: [
        [x + p, y - q], [x + q, y - p], [x + q, y + p], [x + p, y + q],
        [x - p, y + q], [x - q, y + p], [x - q, y - p], [x - p, y - q],
      ] });
    }
  }
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const x = (i + 0.5) * w, y = (j + 0.5) * w;
      tiles.push({ id: `k${i},${j}`, kind: 'knot', poly: [[x, y - d], [x + d, y], [x, y + d], [x - d, y]],
        links: [id(i, j), id(i + 1, j), id(i, j + 1), id(i + 1, j + 1)] });
    }
  }
  return { unit: a, tiles };
}

// Trellis: hexagons, squares and triangles (3.4.6.4). Each square is a gate between
// two hexagon suns; each triangle is a knot where three suns meet.
function trellis() {
  const cols = 5, rows = 4, L = 1 + SQ3, tiles = [];
  const u = (k) => [Math.cos(rad(60 * k)), Math.sin(rad(60 * k))];          // toward neighbor k
  const v = (deg) => [Math.cos(rad(deg)), Math.sin(rad(deg))];              // hexagon corner, radius 1
  const id = (q, r) => `h${q},${r}`;
  const step = [[1, 0], [0, 1], [-1, 1]];                                   // axial neighbors at 0, 60 and 120 degrees
  const cells = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const q = c - Math.floor(r / 2);
      cells.set(id(q, r), { q, r, x: (q + r / 2) * L, y: r * L * SQ3 / 2 });
    }
  }
  const at = (cell, [dx, dy]) => [cell.x + dx, cell.y + dy];
  const add = ([ax, ay], [bx, by]) => [ax + bx, ay + by];
  for (const [key, cell] of cells) {
    tiles.push({ id: key, kind: 'sun', poly: [0, 1, 2, 3, 4, 5].map((m) => at(cell, v(30 + 60 * m))) });
  }
  for (const [key, cell] of cells) {
    const nb = step.map(([dq, dr]) => id(cell.q + dq, cell.r + dr));
    for (let k = 0; k < 3; k++) {
      if (!cells.has(nb[k])) continue;
      const p1 = v(60 * k - 30), p2 = v(60 * k + 30);
      tiles.push({ id: `g${cell.q},${cell.r}:${k}`, kind: 'gate', links: [key, nb[k]],
        poly: [at(cell, p1), at(cell, p2), at(cell, add(p2, u(k))), at(cell, add(p1, u(k)))] });
    }
    for (let k = 0; k < 2; k++) {
      if (!cells.has(nb[k]) || !cells.has(nb[k + 1])) continue;
      const p = v(60 * k + 30);
      tiles.push({ id: `k${cell.q},${cell.r}:${k}`, kind: 'knot', links: [key, nb[k], nb[k + 1]],
        poly: [at(cell, p), at(cell, add(p, u(k))), at(cell, add(p, u(k + 1)))] });
    }
  }
  return { unit: 1, tiles };
}

// Deep field: Penrose rhombs. The pattern follows strict local rules but never repeats,
// so no two neighborhoods are alike. Thick rhombs are suns; thin rhombs are gates that
// join however many suns they happen to touch.
function deepField() {
  const levels = 4, reach = 0.46;                                            // crop radius, as a share of the starting wheel: a round rosette
  const cis = (a) => [Math.cos(a), Math.sin(a)];
  const lerp = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
  // Half-rhomb triangles [thick?, A, B, C], starting from a wheel of ten around the center.
  let tris = [];
  for (let i = 0; i < 10; i++) {
    let B = cis(((2 * i - 1) * Math.PI) / 10), C = cis(((2 * i + 1) * Math.PI) / 10);
    if (i % 2 === 0) [B, C] = [C, B];
    tris.push([false, [0, 0], B, C]);
  }
  for (let n = 0; n < levels; n++) {
    const next = [];
    for (const [thick, A, B, C] of tris) {
      if (!thick) {
        const P = lerp(A, B, 1 / PHI);
        next.push([false, C, P, B], [true, P, C, A]);
      } else {
        const Q = lerp(B, A, 1 / PHI), Rr = lerp(B, C, 1 / PHI);
        next.push([true, Rr, C, A], [true, Q, Rr, B], [false, Rr, Q, A]);
      }
    }
    tris = next;
  }
  // Two mirror-image triangles share the base B-C and make one rhomb.
  const scale = PHI ** levels;                                              // so the rhomb edge is 1
  const halves = new Map();
  const tiles = [];
  for (const [thick, A, B, C] of tris) {
    const key = edgeKey(B, C);
    const other = halves.get(key);
    if (!other) { halves.set(key, A); continue; }
    const cx = (A[0] + other[0]) / 2, cy = (A[1] + other[1]) / 2;
    if (Math.hypot(cx, cy) > reach) continue;
    tiles.push({ kind: thick ? 'sun' : 'gate', poly: [A, B, other, C].map(([x, y]) => [x * scale, y * scale]) });
  }
  tiles.sort((a, b) => center(a.poly)[1] - center(b.poly)[1] || center(a.poly)[0] - center(b.poly)[0]);
  tiles.forEach((t, n) => { t.id = `${t.kind === 'sun' ? 'r' : 'n'}${n}`; });
  return { unit: 1, tiles };
}

export const PATTERNS = {
  trellis:   { name: 'Trellis',   build: trellis,
    blurb: 'Hexagons are suns. A square is a gate between two suns; a triangle is a knot where three meet.' },
  courtyard: { name: 'Courtyard', build: courtyard,
    blurb: 'Octagons are suns, and neighbors touch directly. Each small square is a knot where four suns meet.' },
  plot:      { name: 'Plot',      build: plot,
    blurb: 'Every square is a sun with four neighbors. The simplest garden.' },
  deepfield: { name: 'Deep field', build: deepField, advanced: true,
    blurb: 'A pattern that never repeats. Thick rhombs are suns; thin rhombs are gates joining whichever suns they touch.' },
};

export function center(poly) {
  const n = poly.length;
  return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
}

export function polygonArea(poly) {
  let sum = 0;
  for (let n = 0; n < poly.length; n++) {
    const [x1, y1] = poly[n];
    const [x2, y2] = poly[(n + 1) % poly.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

// Rounds away float noise and negative zero so shared edges get identical keys.
const coord = (v) => {
  const r = Math.round(v * 1e5) / 1e5;
  return (r === 0 ? 0 : r).toFixed(5);
};

// Direction-independent key for the edge from p to q.
export function edgeKey(p, q) {
  const a = `${coord(p[0])},${coord(p[1])}`;
  const b = `${coord(q[0])},${coord(q[1])}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// How many tiles use each edge. In a valid tiling no edge is used more than twice.
export function edgeCounts(tiles) {
  const counts = new Map();
  for (const t of tiles) {
    for (let n = 0; n < t.poly.length; n++) {
      const e = edgeKey(t.poly[n], t.poly[(n + 1) % t.poly.length]);
      counts.set(e, (counts.get(e) || 0) + 1);
    }
  }
  return counts;
}

// Tile adjacency from shared polygon edges. Returns Map<tileId, Set<tileId>>.
export function adjacency(tiles) {
  const owners = new Map();
  for (const t of tiles) {
    for (let n = 0; n < t.poly.length; n++) {
      const e = edgeKey(t.poly[n], t.poly[(n + 1) % t.poly.length]);
      if (!owners.has(e)) owners.set(e, []);
      owners.get(e).push(t.id);
    }
  }
  const adj = new Map(tiles.map((t) => [t.id, new Set()]));
  for (const ids of owners.values()) {
    for (const a of ids) for (const b of ids) if (a !== b) adj.get(a).add(b);
  }
  return adj;
}
