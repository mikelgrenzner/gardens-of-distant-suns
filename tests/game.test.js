import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rgbToHsv, hsvToRgb, hueFamily, hueDistance, systemTier, TIER } from '../src/color.js';
import { PALETTES, SCHEMES, litRgb, luminance, contrast, hslToRgb, groundHsl } from '../src/palettes.js';
import { buildGarden, frontier, openLinks, paintGarden } from '../src/garden.js';
import { newGame } from '../src/state.js';
import { advance, tileYield, ratePerSecond, awakeIds, light, wakeCost } from '../src/sim.js';
import { wake } from '../src/actions.js';

const tile = (h, s, v = 0.8) => ({ rgb: hsvToRgb(h, s, v) });

test('hsv round trip and hue families', () => {
  for (const [h, s, v] of [[0, 1, 1], [120, 0.5, 0.6], [250, 0.3, 0.9], [330, 0.8, 0.4]]) {
    const back = rgbToHsv(hsvToRgb(h, s, v));
    assert.ok(hueDistance(back.h, h) < 2);
    assert.ok(Math.abs(back.s - s) < 0.02 && Math.abs(back.v - v) < 0.01);
  }
  assert.equal(hueFamily(350), 0);
  assert.equal(hueFamily(245), 4);
});

test('tier rules from the handoff', () => {
  assert.equal(systemTier(Array.from({ length: 9 }, () => tile(120, 0.1))), TIER.LATENT);
  assert.equal(systemTier(Array.from({ length: 9 }, (_, n) => tile(240, n < 5 ? 0.6 : 0.1))), TIER.MONOCHROME);
  assert.equal(systemTier(Array.from({ length: 9 }, (_, n) => tile(n % 2 ? 0 : 180, 0.6))), TIER.BICHROMATIC);
  assert.equal(systemTier(Array.from({ length: 9 }, (_, n) => tile([0, 120, 240][n % 3], 0.9))), TIER.POLYCHROME);
});

test('every palette in every style stands out from its ground', () => {
  for (const pal of Object.values(PALETTES)) {
    for (const scheme of Object.keys(SCHEMES)) {
      const ground = luminance(hslToRgb(...groundHsl(pal, scheme)));
      assert.ok(ground < 0.05, `${pal.name}/${scheme} ground is dark`);
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        assert.ok(contrast(luminance(litRgb(t, pal, scheme)), ground) >= 3, `${pal.name}/${scheme} at ${t}`);
      }
    }
  }
});

test('a new garden starts with its central sun awake and neighbors wakeable', () => {
  const s = newGame({ now: 0 });
  const g = buildGarden(s.pattern);
  assert.deepEqual(awakeIds(s), [g.origin]);
  assert.equal(frontier(g, new Set(awakeIds(s))).size, 6);
  const total = Object.values(ratePerSecond(s)).reduce((a, b) => a + b, 0);
  assert.ok(total > 1 && total < 2.5, `one sun yields ${total}`);
});

test('yield follows BASE x V x (1 + S) and advance is time-linear', () => {
  const y = tileYield(hsvToRgb(0, 0.5, 1));
  assert.ok(Math.abs(y.energy + y.life + y.information - 1.5) < 0.01);
  const a = newGame({ now: 0 }), b = newGame({ now: 0 });
  advance(a, 3600);
  for (let n = 0; n < 3600; n++) advance(b, 1);
  assert.ok(Math.abs(light(a) - light(b)) < 1e-6);
});

test('waking costs light, needs a neighbor, and opens gates that pay', () => {
  const s = newGame({ now: 0 });
  const g = buildGarden(s.pattern);
  const [first] = [...g.neighbors.get(g.origin)];
  const far = g.suns.find((x) => !g.neighbors.get(g.origin).has(x.id) && x.id !== g.origin).id;

  assert.equal(wake(s, first).reason, 'not enough light');
  s.stocks = { energy: 10, life: 20, information: 30 };
  assert.equal(wake(s, far).reason, 'not next to an awake sun');
  const cost = wakeCost(s);
  const before = ratePerSecond(s);
  assert.ok(wake(s, first).ok);
  assert.ok(Math.abs(light(s) - (60 - cost)) < 1e-9);
  assert.ok(Math.abs(s.stocks.information / s.stocks.energy - 3) < 1e-9, 'cost is taken in proportion');
  assert.equal(wake(s, first).reason, 'already awake');
  assert.ok(wakeCost(s) > cost);

  // One gate joins the two awake suns, so income is more than two suns alone.
  const awake = new Set(awakeIds(s));
  assert.equal(openLinks(g, awake).length, 1);
  const sum = (r) => r.energy + r.life + r.information;
  assert.ok(sum(ratePerSecond(s)) > sum(before) * 2);

  const paint = paintGarden(g, awake, PALETTES[s.palette], s.scheme);
  assert.equal(paint.get(g.origin).state, 'awake');
  assert.equal(paint.get(openLinks(g, awake)[0].id).state, 'open');
  assert.ok(paint.get(openLinks(g, awake)[0].id).grad.stops.length === 2);
  assert.ok([...paint.values()].some((p) => p.state === 'partial'));
});
