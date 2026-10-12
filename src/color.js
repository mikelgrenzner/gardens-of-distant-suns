// Color rules (handoff sections 5 to 7). Tiles store RGB; everything else is derived.
import { CONFIG } from './config.js';

// Red energy, yellow industry, green life, cyan synthetic minds, blue information, magenta exotic matter.
export const ROLE_ANGLES = [0, 60, 120, 180, 240, 300];
export const ROLE_NAMES = ['energy', 'industry', 'life', 'synthetic minds', 'information', 'exotic matter'];
export const PRIMARY_ANGLES = [0, 120, 240];

export const TIER = { LATENT: 0, MONOCHROME: 1, BICHROMATIC: 2, POLYCHROME: 3 };
export const TIER_NAMES = ['Latent', 'Monochrome', 'Bichromatic', 'Polychrome'];

// rgb: [0..255, 0..255, 0..255] -> { h: 0..360, s: 0..1, v: 0..1 }
export function rgbToHsv([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: (h + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((n) => Math.round((n + m) * 255));
}

export function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

// Index into ROLE_ANGLES of the nearest role.
export function hueFamily(h) {
  let best = 0;
  for (let n = 1; n < ROLE_ANGLES.length; n++) {
    if (hueDistance(h, ROLE_ANGLES[n]) < hueDistance(h, ROLE_ANGLES[best])) best = n;
  }
  return best;
}

// tiles: [{ rgb }] -> TIER value
export function systemTier(tiles, cfg = CONFIG) {
  const hsv = tiles.map((t) => rgbToHsv(t.rgb));
  const developed = hsv.filter((c) => c.s >= cfg.DEVELOPED_SATURATION);
  if (developed.length === 0 || developed.length < tiles.length / 2) return TIER.LATENT;

  const counts = new Map();
  for (const c of developed) {
    const f = hueFamily(c.h);
    counts.set(f, (counts.get(f) || 0) + 1);
  }
  const sizes = [...counts.values()].sort((a, b) => b - a);

  if (sizes.length === 1) return TIER.MONOCHROME;
  if (sizes.length === 2) {
    return sizes[1] / developed.length >= cfg.BICHROME_MIN_SHARE ? TIER.BICHROMATIC : TIER.MONOCHROME;
  }
  const meanS = hsv.reduce((sum, c) => sum + c.s, 0) / hsv.length;
  return meanS >= cfg.POLYCHROME_MIN_SATURATION ? TIER.POLYCHROME : TIER.BICHROMATIC;
}

export const rgbCss = ([r, g, b]) => `rgb(${r},${g},${b})`;
