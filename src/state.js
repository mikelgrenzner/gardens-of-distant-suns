// Game state, new games, and saving. State holds only what can't be derived:
// which suns are awake in each pattern, the stocks, the chosen pattern, palette
// and style, and a timestamp. Geometry and colors are recomputed.
import { CONFIG } from './config.js';

export const STATE_VERSION = 2;

export function newGame({ now = Date.now(), cfg = CONFIG } = {}) {
  return {
    version: STATE_VERSION,
    pattern: cfg.START_PATTERN,
    palette: cfg.START_PALETTE,
    scheme: cfg.START_SCHEME,
    stocks: { energy: 0, life: 0, information: 0 },
    awake: {},                     // pattern key -> ids of awake suns; filled in on first use
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
