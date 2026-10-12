// Zellige star-and-cross tessellation (handoff section 11, "Tile geometry").
// Unit coordinates: star point radius R = 1. Screen y points down.
// Geometry is always derived from lattice position and never saved.

export const R = 1;
export const A = R / Math.SQRT2;                              // ~0.7071
export const H = R - A;                                       // ~0.2929
export const RHO = A * Math.sqrt(1 + (Math.SQRT2 - 1) ** 2);  // ~0.7654, inner vertex radius
export const SPACING = 2 * R;                                 // star lattice spacing

const polar = (cx, cy, deg, rad) => {
  const t = (deg * Math.PI) / 180;
  return [cx + rad * Math.cos(t), cy + rad * Math.sin(t)];
};

const rot90 = ([x, y], k) => {
  for (let n = 0; n < k; n++) [x, y] = [-y, x];
  return [x, y];
};

// Arm pointing up (toward -y), relative to the junction center.
const ARM = [[-H, -H], [-H, -A], [0, -R], [H, -A], [H, -H]];

// For arm k (0 up, 1 right, 2 down, 3 left): the two stars it sits between,
// as offsets from the junction's (i, j).
export const ARM_NEIGHBORS = [
  [[0, 0], [1, 0]],
  [[1, 0], [1, 1]],
  [[0, 1], [1, 1]],
  [[0, 0], [0, 1]],
];

export function starCenter(i, j) {
  return [i * SPACING, j * SPACING];
}

// A system: octagon core plus 8 triangular points. 9 tiles.
export function starTiles(i, j) {
  const [cx, cy] = starCenter(i, j);
  const tiles = [{
    id: `s${i},${j}:core`,
    shape: 'core',
    poly: Array.from({ length: 8 }, (_, k) => polar(cx, cy, 22.5 + 45 * k, RHO)),
  }];
  for (let k = 0; k < 8; k++) {
    tiles.push({
      id: `s${i},${j}:p${k}`,
      shape: 'point',
      poly: [
        polar(cx, cy, 45 * k, R),
        polar(cx, cy, 45 * k + 22.5, RHO),
        polar(cx, cy, 45 * k - 22.5, RHO),
      ],
    });
  }
  return tiles;
}

// A junction sits between stars (i, j), (i+1, j), (i, j+1) and (i+1, j+1).
// Center square plus 4 pentagonal arms. 5 tiles.
export function junctionTiles(i, j) {
  const [sx, sy] = starCenter(i, j);
  const cx = sx + R;
  const cy = sy + R;
  const tiles = [{
    id: `j${i},${j}:hub`,
    shape: 'hub',
    poly: [[cx - H, cy - H], [cx + H, cy - H], [cx + H, cy + H], [cx - H, cy + H]],
  }];
  for (let k = 0; k < 4; k++) {
    tiles.push({
      id: `j${i},${j}:a${k}`,
      shape: 'arm',
      poly: ARM.map((p) => {
        const [x, y] = rot90(p, k);
        return [cx + x, cy + y];
      }),
    });
  }
  return tiles;
}

export function junctionSystems(i, j) {
  return [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]];
}

// All stars and junctions covering the rectangle of stars -cols..cols by -rows..rows.
export function buildField(cols, rows) {
  const stars = [];
  const junctions = [];
  for (let i = -cols; i <= cols; i++) {
    for (let j = -rows; j <= rows; j++) stars.push({ i, j, tiles: starTiles(i, j) });
  }
  for (let i = -cols - 1; i <= cols; i++) {
    for (let j = -rows - 1; j <= rows; j++) junctions.push({ i, j, tiles: junctionTiles(i, j) });
  }
  return { stars, junctions };
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
  const r = Math.round(v * 1e6) / 1e6;
  return (r === 0 ? 0 : r).toFixed(6);
};

// Direction-independent key for the edge from p to q.
export function edgeKey(p, q) {
  const a = `${coord(p[0])},${coord(p[1])}`;
  const b = `${coord(q[0])},${coord(q[1])}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// Tile adjacency from shared polygon edges. Returns Map<tileId, Set<tileId>>.
export function adjacency(tiles) {
  const edgeOwners = new Map();
  for (const t of tiles) {
    for (let n = 0; n < t.poly.length; n++) {
      const e = edgeKey(t.poly[n], t.poly[(n + 1) % t.poly.length]);
      if (!edgeOwners.has(e)) edgeOwners.set(e, []);
      edgeOwners.get(e).push(t.id);
    }
  }
  const adj = new Map(tiles.map((t) => [t.id, new Set()]));
  for (const owners of edgeOwners.values()) {
    for (const a of owners) for (const b of owners) if (a !== b) adj.get(a).add(b);
  }
  return adj;
}
