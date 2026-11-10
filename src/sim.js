// The simulation. Advances by elapsed seconds, so a live tick and an
// eight-hour absence run the same code. Never touches the DOM.
import { CONFIG } from './config.js';
import { rgbToHsv } from './color.js';
import { PALETTES } from './palettes.js';
import { buildGarden, openLinks, sunRgb, linkRgb } from './garden.js';

export const STOCKS = ['energy', 'life', 'information'];

// The suns awake in the current pattern. A garden always starts with its central sun awake.
export function awakeIds(state) {
  const garden = buildGarden(state.pattern);
  if (!state.awake[state.pattern] || state.awake[state.pattern].length === 0) {
    state.awake[state.pattern] = [garden.origin];
  }
  return state.awake[state.pattern];
}

export const paletteOf = (state) => PALETTES[state.palette] || PALETTES[CONFIG.START_PALETTE];

// Yield per second of a color = BASE x V x (1 + S), split across the
// three stocks in proportion to its red, green and blue.
export function tileYield(rgb, cfg = CONFIG) {
  const { s, v } = rgbToHsv(rgb);
  const total = cfg.BASE_YIELD * v * (1 + s);
  const sum = rgb[0] + rgb[1] + rgb[2] || 1;
  return {
    energy: (total * rgb[0]) / sum,
    life: (total * rgb[1]) / sum,
    information: (total * rgb[2]) / sum,
  };
}

// Awake suns yield their color. An open gate or knot yields the blend of the suns it joins,
// scaled by how many it joins: relationships pay, and bigger ones pay more.
export function ratePerSecond(state, cfg = CONFIG) {
  const garden = buildGarden(state.pattern);
  const awake = new Set(awakeIds(state));
  const pal = paletteOf(state);
  const rate = { energy: 0, life: 0, information: 0 };
  const add = (y, scale) => { for (const k of STOCKS) rate[k] += y[k] * scale; };
  for (const id of awake) add(tileYield(sunRgb(garden.byId.get(id), pal, cfg.SIM_SCHEME), cfg), 1);
  for (const l of openLinks(garden, awake)) {
    add(tileYield(linkRgb(garden, l, pal, cfg.SIM_SCHEME), cfg), cfg.LINK_YIELD_PER_SUN * l.links.length);
  }
  return rate;
}

export function advance(state, seconds, cfg = CONFIG) {
  if (!(seconds > 0)) return state;
  const rate = ratePerSecond(state, cfg);
  for (const k of STOCKS) state.stocks[k] += rate[k] * seconds;
  return state;
}

// Light is the three stocks together. Waking a sun costs light.
export const light = (state) => STOCKS.reduce((sum, k) => sum + state.stocks[k], 0);

export function wakeCost(state, cfg = CONFIG) {
  return cfg.COST_BASE * cfg.COST_GROWTH ** (awakeIds(state).length - 1);
}
