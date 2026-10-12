// Game state, new games, and saving. State holds only what can't be derived:
// tile colors, stocks, timestamps. Geometry and tiers are recomputed.
import { CONFIG } from './config.js';
import { starTiles } from './geometry.js';
import { PRIMARY_ANGLES, hsvToRgb } from './color.js';

export const STATE_VERSION = 1;

function latentTiles(i, j, [hA, hB], cfg) {
  return starTiles(i, j).map((t, n) => {
    // Core shows the first candidate faintly; points alternate between both candidates.
    const hue = t.shape === 'core' || n % 2 === 1 ? hA : hB;
    const s = t.shape === 'core' ? cfg.LATENT_SATURATION / 2 : cfg.LATENT_SATURATION;
    return { id: t.id, shape: t.shape, rgb: hsvToRgb(hue, s, cfg.LATENT_VALUE) };
  });
}

export function newGame({ now = Date.now(), rand = Math.random, cfg = CONFIG } = {}) {
  // Primaries are found, secondaries are made: a fresh system's candidates are two primaries.
  const first = Math.floor(rand() * 3);
  const second = (first + 1 + Math.floor(rand() * 2)) % 3;
  const candidates = [PRIMARY_ANGLES[first], PRIMARY_ANGLES[second]];
  return {
    version: STATE_VERSION,
    stocks: { energy: 0, life: 0, information: 0 },
    systems: [{
      id: 'origin',
      body: 'planetary',
      i: 0,
      j: 0,
      candidates,
      chosenHue: null,
      tiles: latentTiles(0, 0, candidates, cfg),
    }],
    gates: [],
    bitDepth: cfg.START_BIT_DEPTH,
    lastSeen: now,
  };
}

export function save(state, storage = globalThis.localStorage, cfg = CONFIG) {
  try {
    state.lastSeen = Date.now();
    storage.setItem(cfg.SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;   // private mode, blocked storage, quota: the game keeps running unsaved
  }
}

export function load(storage = globalThis.localStorage, cfg = CONFIG) {
  try {
    const raw = storage?.getItem(cfg.SAVE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    return state && state.version === STATE_VERSION ? state : null;
  } catch {
    return null;
  }
}
