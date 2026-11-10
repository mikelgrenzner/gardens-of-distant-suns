// Player actions. Each takes the state, changes it, and returns { ok, reason? }.
import { CONFIG } from './config.js';
import { buildGarden, frontier } from './garden.js';
import { STOCKS, awakeIds, light, wakeCost } from './sim.js';

// Wake a sleeping sun that touches an awake one. The cost is taken from the three
// stocks in proportion to what's held.
export function wake(state, tileId, cfg = CONFIG) {
  const garden = buildGarden(state.pattern);
  const ids = awakeIds(state);
  const tile = garden.byId.get(tileId);
  if (!tile || tile.kind !== 'sun') return { ok: false, reason: 'not a sun' };
  if (ids.includes(tileId)) return { ok: false, reason: 'already awake' };
  if (!frontier(garden, new Set(ids)).has(tileId)) return { ok: false, reason: 'not next to an awake sun' };
  const cost = wakeCost(state, cfg);
  const have = light(state);
  if (have < cost) return { ok: false, reason: 'not enough light', short: cost - have };
  for (const k of STOCKS) state.stocks[k] -= (state.stocks[k] / have) * cost;
  ids.push(tileId);
  return { ok: true };
}
