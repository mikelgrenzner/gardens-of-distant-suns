// Wiring: load or start a game, run the loop, handle clicks, save, and show Afterglow on return.
import { CONFIG } from './config.js';
import { newGame, load, save } from './state.js';
import { PATTERNS } from './tilings.js';
import { PALETTES, SCHEMES } from './palettes.js';
import { buildGarden, paintGarden, openLinks } from './garden.js';
import { STOCKS, advance, ratePerSecond, awakeIds, paletteOf, light, wakeCost } from './sim.js';
import { wake } from './actions.js';
import { renderGarden, drawSky, applyTheme } from './render.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => (n < 100 ? n.toFixed(1) : Math.round(n).toLocaleString());

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

let state = load() ?? newGame();
if (!PATTERNS[state.pattern]) state.pattern = CONFIG.START_PATTERN;
if (!PALETTES[state.palette]) state.palette = CONFIG.START_PALETTE;
if (!SCHEMES[state.scheme]) state.scheme = CONFIG.START_SCHEME;

let preview = false;          // show every tile lit, to compare palettes and patterns; the game is not affected
let fresh = new Set();        // tiles to pop on the next draw
let notice = '';

function fillSelect(el, entries, value) {
  const plain = entries.filter(([, v]) => !v.advanced);
  const advanced = entries.filter(([, v]) => v.advanced);
  el.replaceChildren(...plain.map(([k, v]) => new Option(v.name, k)));
  if (advanced.length) {
    const group = document.createElement('optgroup');
    group.label = 'Advanced';
    group.append(...advanced.map(([k, v]) => new Option(v.name, k)));
    el.append(group);
  }
  el.value = value;
}

function draw() {
  const garden = buildGarden(state.pattern);
  const awake = preview ? new Set(garden.suns.map((s) => s.id)) : new Set(awakeIds(state));
  applyTheme(paletteOf(state), state.scheme);
  renderGarden($('garden'), garden, paintGarden(garden, awake, paletteOf(state), state.scheme), { fresh, interactive: !preview });
  fresh = new Set();
  $('legend').textContent = preview
    ? 'Preview: every tile lit, to compare palettes and patterns. Your garden is not affected.'
    : garden.blurb;
  updateHud();
}

function updateHud() {
  const garden = buildGarden(state.pattern);
  const ids = awakeIds(state);
  const rate = ratePerSecond(state);
  for (const k of STOCKS) {
    $(`stock-${k}`).textContent = fmt(state.stocks[k]);
    $(`rate-${k}`).textContent = `+${rate[k].toFixed(1)}/s`;
  }
  const open = openLinks(garden, new Set(ids)).length;
  $('count').textContent = `${ids.length} of ${garden.suns.length} suns awake`
    + (garden.links.length ? ` · ${open} of ${garden.links.length} links open` : '');
  const done = ids.length >= garden.suns.length;
  const cost = wakeCost(state), have = light(state);
  const ready = !done && have >= cost;
  $('next').textContent = done ? 'Every sun in this garden is awake.'
    : notice || (ready ? 'Ready: choose a glowing tile next to your garden to wake it.'
      : `Next sun: ${fmt(have)} of ${fmt(cost)} light`);
  $('meter').style.width = `${done ? 100 : Math.min(100, (have / cost) * 100).toFixed(1)}%`;
  $('garden').classList.toggle('ready', ready && !preview);
}

function tryWake(tileId) {
  if (preview) return;
  const garden = buildGarden(state.pattern);
  const before = new Set(openLinks(garden, new Set(awakeIds(state))).map((l) => l.id));
  const result = wake(state, tileId);
  if (result.ok) {
    notice = '';
    fresh = new Set([tileId, ...openLinks(garden, new Set(awakeIds(state))).map((l) => l.id).filter((id) => !before.has(id))]);
    save(state);
    draw();
  } else if (result.reason === 'not enough light') {
    notice = `That sun needs ${fmt(result.short)} more light.`;
    updateHud();
    setTimeout(() => { notice = ''; updateHud(); }, 2500);
  }
}

// Offline progress
const away = (Date.now() - state.lastSeen) / 1000;
if (away >= CONFIG.AFTERGLOW_MIN_SECONDS) {
  const before = { ...state.stocks };
  const credited = Math.min(away, CONFIG.OFFLINE_CAP_HOURS * 3600);
  advance(state, credited);
  const gained = STOCKS.map((k) => `${fmt(state.stocks[k] - before[k])} ${k}`).join(', ');
  $('afterglow-text').textContent = `While you were away for ${formatDuration(credited)}, your garden gathered ${gained}.`;
  $('afterglow').hidden = false;
}

// Controls
fillSelect($('selPattern'), Object.entries(PATTERNS), state.pattern);
fillSelect($('selPalette'), Object.entries(PALETTES), state.palette);
fillSelect($('selScheme'), Object.entries(SCHEMES), state.scheme);
for (const [id, key] of [['selPattern', 'pattern'], ['selPalette', 'palette'], ['selScheme', 'scheme']]) {
  $(id).addEventListener('change', (e) => { state[key] = e.target.value; save(state); draw(); });
}
$('previewBtn').addEventListener('click', () => {
  preview = !preview;
  $('previewBtn').setAttribute('aria-pressed', String(preview));
  draw();
});
let resetArmed = null;
$('resetBtn').addEventListener('click', () => {
  if (!resetArmed) {
    $('resetBtn').textContent = 'Really start over?';
    resetArmed = setTimeout(() => { resetArmed = null; $('resetBtn').textContent = 'Start over'; }, 4000);
    return;
  }
  clearTimeout(resetArmed); resetArmed = null;
  $('resetBtn').textContent = 'Start over';
  state = { ...newGame(), pattern: state.pattern, palette: state.palette, scheme: state.scheme };
  save(state);
  draw();
});
$('afterglow-close').addEventListener('click', () => { $('afterglow').hidden = true; });
$('garden').addEventListener('click', (e) => {
  const tile = e.target.closest('[data-tile]');
  if (tile) tryWake(tile.dataset.tile);
});
$('garden').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const tile = e.target.closest('[data-tile]');
  if (tile) { e.preventDefault(); tryWake(tile.dataset.tile); }
});

drawSky($('sky'));
draw();

let last = performance.now();
setInterval(() => {
  const now = performance.now();
  advance(state, (now - last) / 1000);
  last = now;
  updateHud();
}, CONFIG.TICK_MS);

setInterval(() => save(state), CONFIG.SAVE_INTERVAL_MS);
addEventListener('pagehide', () => save(state));
addEventListener('visibilitychange', () => { if (document.hidden) save(state); });
