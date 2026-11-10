// Palettes and styles. The palette values and the way a color is picked by position
// follow Undertone (mikelgrenzner/undertone), copied here; Undertone itself is never edited.
// A palette is a walk through a few hues. A tile's position in the field, t from 0 to 1,
// picks its place on that walk, so a full garden shows the whole palette corner to corner.

export const PALETTES = {
  tropical:  { name: 'Tropical',      h: [168, 334, 38] },
  aurora:    { name: 'Aurora',        h: [176, 230, 278] },
  sunrise:   { name: 'Sunrise',       h: [226, 16, 50], stops: [226, 318, 18, 50], tone: [[1, 2], [.95, 6], [.85, 12], [1, 10]] },
  sunset:    { name: 'Sunset',        h: [282, 338, 28] },
  inferno:   { name: 'Inferno',       h: [356, 24, 48] },
  citrus:    { name: 'Citrus',        h: [88, 40, 4], stops: [92, 56, 30, 4] },
  bubblegum: { name: 'Bubblegum',     h: [318, 196, 52] },
  // tone: per stop, how vivid it is and how much lighter or darker, so one stop can be a mist grey
  cascadia:  { name: 'Cascadia',      h: [212, 204, 150], sat: .5, tone: [[1, -6], [.2, 22], [1.05, -13]] },
  ash:       { name: 'White Ash',     h: [90, 46, 354], sat: .6, stops: [90, 50, 28, 354], tone: [[.95, 3], [1.25, 10], [1, 3], [.85, -18]] },
  bog:       { name: 'Cranberry Bog', h: [346, 192, 150], sat: .62, stops: [346, 356, 40, 150, 192], tone: [[1, -8], [.75, 6], [.22, 20], [.6, 2], [.85, -6]] },
  gourds:    { name: 'Gourds',        h: [168, 30, 18], sat: .62, stops: [168, 150, 48, 30, 18], tone: [[.55, 2], [.4, 10], [.3, 18], [.9, 6], [1, -2]] },
  frost:     { name: 'First Frost',   h: [214, 18, 210], sat: .62, stops: [16, 24, 210, 214], tone: [[1, -4], [.5, 8], [.14, 24], [.7, -4]] },
  bonfire:   { name: 'Bonfire',       h: [238, 22, 44], sat: .62, stops: [238, 250, 20, 44], tone: [[.7, -8], [.15, 8], [1, -2], [.9, 8]] },
  larch:     { name: 'Larch',         h: [150, 50, 208], sat: .62, stops: [50, 70, 150, 190, 208], tone: [[1, 8], [.8, 2], [.75, -10], [.6, 0], [.75, 2]] },
  hollow:    { name: 'Hollow',        h: [276, 256, 96], sat: .5, stops: [278, 252, 96], tone: [[.95, -7], [.16, 20], [.75, -2]] },
};

// Styles: all dark. bg/hi/line/ink/soft are [saturation, lightness] on the palette's first hue;
// cell is [saturation, lightness at t = 0, lightness at t = 1] for lit tiles.
export const SCHEMES = {
  poster:   { name: 'Poster',   bg: [58, 11], hi: [48, 18], line: [40, 30], ink: [45, 96], soft: [30, 76], cell: [92, 54, 64], accent: 1,   wash: .24 },
  midnight: { name: 'Midnight', bg: [35, 5],  hi: [30, 10], line: [30, 25], ink: [35, 94], soft: [22, 72], cell: [98, 56, 66], accent: 1,   wash: .15 },
  dusk:     { name: 'Dusk',     bg: [26, 15], hi: [22, 22], line: [18, 36], ink: [25, 93], soft: [16, 76], cell: [48, 52, 64], accent: .5,  wash: .16 },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const norm = (h) => ((h % 360) + 360) % 360;

// h in degrees, s and l in percent -> [r, g, b] each 0..255
export function hslToRgb(h, s, l) {
  h = norm(h); s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}

export function luminance([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Where t falls on the palette's walk: its hue, and that stop's vividness and lightness shift.
function walk(t, pal) {
  const stops = pal.stops || pal.h;
  const last = stops.length - 1;
  const x = Math.min(last - 1e-4, clamp(t, 0, 1) * last);
  const i = Math.floor(x);
  const f = x - i;
  let d = norm(stops[i + 1]) - norm(stops[i]);
  if (d > 180) d -= 360; else if (d < -180) d += 360;          // the short way round the wheel
  const tone = (k) => (pal.tone ? pal.tone[i][k] + (pal.tone[i + 1][k] - pal.tone[i][k]) * f : 1 - k);
  return { h: stops[i] + d * f, vivid: tone(0), shift: tone(1) };
}

export function groundHsl(pal, schemeKey) {
  const sc = SCHEMES[schemeKey] || SCHEMES.poster;
  return [pal.h[0], sc.bg[0] * (pal.sat || 1), sc.bg[1]];
}

// The color of a lit tile at position t. Lightened if needed until it stands out from the ground (3.15:1).
export function litRgb(t, pal, schemeKey = 'poster') {
  const sc = SCHEMES[schemeKey] || SCHEMES.poster;
  const [sat, from, to] = sc.cell;
  const w = walk(t, pal);
  const s = sat * (pal.sat || 1) * w.vivid;
  let l = from + (to - from) * clamp(t, 0, 1) + w.shift;
  const ground = luminance(hslToRgb(...groundHsl(pal, schemeKey)));
  for (let n = 0; n < 40 && l < 96 && contrast(luminance(hslToRgb(w.h, s, l)), ground) < 3.15; n++) l += 2;
  return hslToRgb(w.h, s, l);
}

// A sleeping tile: a hint of the color it could become, barely lifted off the ground.
export function latentRgb(t, pal, schemeKey, lift, saturation) {
  const sc = SCHEMES[schemeKey] || SCHEMES.poster;
  const w = walk(t, pal);
  return hslToRgb(w.h, saturation * (pal.sat || 1) * Math.min(1, w.vivid), sc.bg[1] + lift);
}

export const rgbCss = ([r, g, b]) => `rgb(${r},${g},${b})`;

// Page colors for a palette and style, as CSS custom properties.
export function theme(pal, schemeKey) {
  const sc = SCHEMES[schemeKey] || SCHEMES.poster;
  const sat = pal.sat || 1;
  const [h1, h2, h3] = pal.h;
  const on = (pair) => rgbCss(hslToRgb(h1, pair[0] * sat, pair[1]));
  const accent = (h, s, l) => rgbCss(hslToRgb(h, s * sat * sc.accent, l));
  return {
    '--bg': on(sc.bg), '--bg-hi': on(sc.hi), '--line': on(sc.line), '--ink': on(sc.ink), '--ink-soft': on(sc.soft),
    '--c': accent(h1, 88, 64), '--c-ink': rgbCss(hslToRgb(h1, 45, 9)),
    '--a': accent(h2, 92, 60), '--a-ink': rgbCss(hslToRgb(h2, 45, 9)),
    '--b': accent(h3, 86, 63), '--b-ink': rgbCss(hslToRgb(h3, 45, 9)),
    '--wash': String(sc.wash),
  };
}
