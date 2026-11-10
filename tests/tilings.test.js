import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PATTERNS, edgeCounts, polygonArea } from '../src/tilings.js';
import { buildGarden, frontier } from '../src/garden.js';

for (const key of Object.keys(PATTERNS)) {
  test(`${key}: tiles fit edge to edge with no overlaps`, () => {
    const g = buildGarden(key);
    assert.ok(g.tiles.length > 10);
    assert.equal(new Set(g.tiles.map((t) => t.id)).size, g.tiles.length, 'ids are unique');
    for (const c of edgeCounts(g.tiles).values()) assert.ok(c <= 2, 'an edge is used by more than two tiles');
    // Every edge of every tile has the pattern's edge length.
    for (const t of g.tiles) {
      for (let n = 0; n < t.poly.length; n++) {
        const [x1, y1] = t.poly[n], [x2, y2] = t.poly[(n + 1) % t.poly.length];
        assert.ok(Math.abs(Math.hypot(x2 - x1, y2 - y1) - g.unit) < 1e-6, `${t.id} has an edge of the wrong length`);
      }
    }
  });

  test(`${key}: every sun can be reached from the origin`, () => {
    const g = buildGarden(key);
    const awake = new Set([g.origin]);
    for (;;) {
      const next = frontier(g, awake);
      if (next.size === 0) break;
      for (const id of next) awake.add(id);
    }
    assert.equal(awake.size, g.suns.length);
  });
}

test('trellis: squares join two suns and triangles join three, all touching', () => {
  const g = buildGarden('trellis');
  for (const l of g.links) {
    assert.equal(l.links.length, l.kind === 'gate' ? 2 : 3);
    assert.equal(l.poly.length, l.kind === 'gate' ? 4 : 3);
  }
  assert.equal(g.suns.length, 20);
  // An interior hexagon is ringed by 6 gates and 6 other suns.
  assert.equal(g.links.filter((l) => l.kind === 'gate' && l.links.includes(g.origin)).length, 6);
  assert.equal(g.neighbors.get(g.origin).size, 6);
});

test('courtyard: each knot joins four suns', () => {
  const g = buildGarden('courtyard');
  for (const l of g.links) assert.equal(l.links.length, 4);
  assert.equal(g.neighbors.get(g.origin).size, 8, 'four direct neighbors plus four across knots');
});

test('deep field: rhombs come in exactly two shapes, about a golden ratio apart in number', () => {
  const g = buildGarden('deepfield');
  const thick = Math.sin((72 * Math.PI) / 180), thin = Math.sin((36 * Math.PI) / 180);
  for (const t of g.tiles) {
    assert.equal(t.poly.length, 4);
    assert.ok(Math.abs(polygonArea(t.poly) - (t.kind === 'sun' ? thick : thin)) < 1e-6);
  }
  const ratio = g.suns.length / g.links.length;
  assert.ok(ratio > 1.3 && ratio < 2, `thick to thin ratio ${ratio}`);
  for (const l of g.links) assert.ok(l.links.length >= 1, 'a thin rhomb touches no sun');
});
