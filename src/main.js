// Wiring: load or start a game, run the loop, save, and show Afterglow on return.
import { CONFIG } from './config.js';
import { newGame, load, save } from './state.js';
import { advance, ratePerSecond } from './sim.js';
import { render } from './render.js';
import { systemTier, TIER_NAMES } from './color.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => (n < 1000 ? n.toFixed(1) : Math.round(n).toLocaleString());

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function updateHud(state) {
  const rate = ratePerSecond(state);
  for (const k of ['energy', 'life', 'information']) {
    $(`stock-${k}`).textContent = fmt(state.stocks[k]);
    $(`rate-${k}`).textContent = `+${rate[k].toFixed(2)}/s`;
  }
  $('tier').textContent = TIER_NAMES[systemTier(state.systems[0].tiles)];
}

function showAfterglow(before, after, seconds) {
  const gained = ['energy', 'life', 'information']
    .map((k) => `${fmt(after[k] - before[k])} ${k}`)
    .join(', ');
  $('afterglow-text').textContent = `While you were away for ${formatDuration(seconds)}, your garden gathered ${gained}.`;
  $('afterglow').hidden = false;
}

const state = load() ?? newGame();

const away = (Date.now() - state.lastSeen) / 1000;
if (away >= CONFIG.AFTERGLOW_MIN_SECONDS) {
  const before = { ...state.stocks };
  const credited = Math.min(away, CONFIG.OFFLINE_CAP_HOURS * 3600);
  advance(state, credited);
  showAfterglow(before, state.stocks, credited);
}

render($('garden'), state);
updateHud(state);

$('afterglow-close').addEventListener('click', () => { $('afterglow').hidden = true; });

let last = performance.now();
setInterval(() => {
  const now = performance.now();
  advance(state, (now - last) / 1000);
  last = now;
  updateHud(state);
}, CONFIG.TICK_MS);

setInterval(() => save(state), CONFIG.SAVE_INTERVAL_MS);
addEventListener('pagehide', () => save(state));
addEventListener('visibilitychange', () => { if (document.hidden) save(state); });
