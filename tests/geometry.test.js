import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starTiles, junctionTiles, polygonArea, adjacency, buildField, edgeKey, SPACING } from '../src/geometry.js';

const area = (tiles) => tiles.reduce((s, t) => s + polygonArea(t.poly), 0);

test('a star has 9 tiles and a junction has 5', () => {
  assert.equal(starTiles(0, 0).length, 9);
  assert.equal(junctionTiles(0, 0).length, 5);
});

test('one star plus one junction exactly fills one lattice cell', () => {
  const total = area(starTiles(0, 0)) + area(junctionTiles(0, 0));
  assert.ok(Math.abs(total - SPACING * SPACING) < 1e-9, `got ${total}`);
});

test('tile areas match the handoff figures', () => {
  assert.ok(Math.abs(area(starTiles(0, 0)) - 2.343) < 0.001);
  assert.ok(Math.abs(area(junctionTiles(0, 0)) - 1.657) < 0.001);
});

test('interior tiles have the expected neighbors', () => {
  const { stars, junctions } = buildField(2, 2);
  const tiles = [...stars, ...junctions].flatMap((x) => x.tiles);
  const adj = adjacency(tiles);
  assert.equal(adj.get('s0,0:core').size, 8, 'core touches all 8 points');
  for (let k = 0; k < 8; k++) {
    const n = adj.get(`s0,0:p${k}`);
    assert.equal(n.size, 3, `point ${k} touches core plus two arms`);
    assert.ok(n.has('s0,0:core'));
  }
  assert.equal(adj.get('j0,0:hub').size, 4, 'hub touches its 4 arms');
  // An arm touches the hub plus two points on each of the two stars it sits between.
  assert.equal(adj.get('j0,0:a0').size, 5);
});

test('no gaps or overlaps: every interior edge is shared by exactly two tiles', () => {
  const { stars, junctions } = buildField(1, 1);
  const tiles = [...stars, ...junctions].flatMap((x) => x.tiles);
  const counts = new Map();
  for (const t of tiles) {
    for (let n = 0; n < t.poly.length; n++) {
      const e = edgeKey(t.poly[n], t.poly[(n + 1) % t.poly.length]);
      counts.set(e, (counts.get(e) || 0) + 1);
    }
  }
  for (const c of counts.values()) assert.ok(c <= 2, 'an edge is shared by more than two tiles');
  // Every edge of the central star must be shared: no gaps around it.
  for (const t of starTiles(0, 0)) {
    for (let n = 0; n < t.poly.length; n++) {
      assert.equal(counts.get(edgeKey(t.poly[n], t.poly[(n + 1) % t.poly.length])), 2);
    }
  }
});
