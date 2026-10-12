// The simulation. Advances by elapsed seconds, so a live tick and an
// eight-hour absence run the same code. Never touches the DOM.
import { CONFIG } from './config.js';
import { rgbToHsv } from './color.js';

// Yield per second of a tile = BASE x V x (1 + S), split across the
// three stocks in proportion to the tile's red, green and blue.
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

export function ratePerSecond(state, cfg = CONFIG) {
  const rate = { energy: 0, life: 0, information: 0 };
  for (const system of state.systems) {
    for (const tile of system.tiles) {
      const y = tileYield(tile.rgb, cfg);
      rate.energy += y.energy;
      rate.life += y.life;
      rate.information += y.information;
    }
  }
  return rate;
}

export function advance(state, seconds, cfg = CONFIG) {
  if (!(seconds > 0)) return state;
  const rate = ratePerSecond(state, cfg);
  for (const k of Object.keys(rate)) state.stocks[k] += rate[k] * seconds;
  return state;
}
