import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rgbToHsv, hsvToRgb, hueFamily, hueDistance, systemTier, TIER } from '../src/color.js';
import { newGame } from '../src/state.js';
import { advance, tileYield } from '../src/sim.js';

const tile = (h, s, v = 0.8) => ({ rgb: hsvToRgb(h, s, v) });

test('hsv round trip', () => {
  for (const [h, s, v] of [[0, 1, 1], [120, 0.5, 0.6], [250, 0.3, 0.9], [330, 0.8, 0.4]]) {
    const back = rgbToHsv(hsvToRgb(h, s, v));
    assert.ok(hueDistance(back.h, h) < 2, `hue ${h} -> ${back.h}`);
    assert.ok(Math.abs(back.s - s) < 0.02);
    assert.ok(Math.abs(back.v - v) < 0.01);
  }
});

test('hue families snap to the nearest role', () => {
  assert.equal(hueFamily(10), 0);
  assert.equal(hueFamily(350), 0);
  assert.equal(hueFamily(65), 1);
  assert.equal(hueFamily(245), 4);
});

test('tier rules from the handoff', () => {
  const muted = Array.from({ length: 9 }, () => tile(120, 0.1));
  assert.equal(systemTier(muted), TIER.LATENT);

  const mono = Array.from({ length: 9 }, (_, n) => tile(240, n < 5 ? 0.6 : 0.1));
  assert.equal(systemTier(mono), TIER.MONOCHROME);

  const bi = Array.from({ length: 9 }, (_, n) => tile(n % 2 ? 0 : 180, 0.6));
  assert.equal(systemTier(bi), TIER.BICHROMATIC);

  const lopsided = Array.from({ length: 9 }, (_, n) => tile(n === 0 ? 0 : 180, 0.6));
  assert.equal(systemTier(lopsided), TIER.MONOCHROME, 'second hue under 25% share');

  const poly = Array.from({ length: 9 }, (_, n) => tile([0, 120, 240][n % 3], 0.9));
  assert.equal(systemTier(poly), TIER.POLYCHROME);

  const dullPoly = Array.from({ length: 9 }, (_, n) => tile([0, 120, 240][n % 3], 0.4));
  assert.equal(systemTier(dullPoly), TIER.BICHROMATIC, 'three hues but too muted');
});

test('a new game starts latent with two primary candidates', () => {
  const g = newGame({ now: 0, rand: () => 0 });
  const sys = g.systems[0];
  assert.equal(sys.tiles.length, 9);
  assert.equal(new Set(sys.candidates).size, 2);
  for (const h of sys.candidates) assert.ok([0, 120, 240].includes(h));
  assert.equal(systemTier(sys.tiles), TIER.LATENT);
});

test('yield follows BASE x V x (1 + S) and advance is time-linear', () => {
  const y = tileYield(hsvToRgb(0, 0.5, 1));
  const total = y.energy + y.life + y.information;
  assert.ok(Math.abs(total - 1.5) < 0.01, `got ${total}`);

  const a = newGame({ now: 0, rand: () => 0.4 });
  const b = structuredClone(a);
  advance(a, 3600);
  for (let n = 0; n < 3600; n++) advance(b, 1);
  for (const k of ['energy', 'life', 'information']) {
    assert.ok(Math.abs(a.stocks[k] - b.stocks[k]) < 1e-6);
  }
});
