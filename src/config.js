// Every tuning number lives here. Values are starting points, not design decisions.
export const CONFIG = {
  // Economy
  BASE_YIELD: 1,                 // stock per second from a sun at V = 1, S = 0
  LINK_YIELD_PER_SUN: 0.25,      // an open gate or knot yields this share of a sun, per sun it joins
  COST_BASE: 15,                 // light needed to wake the second sun
  COST_GROWTH: 1.4,              // each further sun costs this much more
  OFFLINE_CAP_HOURS: 24,         // offline progress stops accruing after this

  // Tier rules (handoff section 7)
  DEVELOPED_SATURATION: 0.25,    // a tile counts as developed at or above this
  BICHROME_MIN_SHARE: 0.25,      // smaller hue family's share of developed tiles
  POLYCHROME_MIN_SATURATION: 0.7,

  // New garden
  START_PATTERN: 'trellis',
  START_PALETTE: 'tropical',
  START_SCHEME: 'poster',
  SIM_SCHEME: 'poster',          // yields are computed from this style's colors, so changing style never changes income

  // Loop and saving
  TICK_MS: 250,
  SAVE_INTERVAL_MS: 10000,
  SAVE_KEY: 'gods-save-v1',
  AFTERGLOW_MIN_SECONDS: 60,     // shorter absences don't show the Afterglow panel

  // Tiles, as shares of a pattern's edge length
  TILE_GAP: 0.12,                // space between neighboring tiles
  TILE_RADIUS: 0.07,             // corner rounding
  LATENT_LIFT: 9,                // how much lighter than the ground a sleeping tile is (lightness points)
  FRONTIER_LIFT: 19,             // the same, for a sun that can be woken next
  LATENT_SATURATION: 30,

  // Sky
  STAR_COUNT: 230,
  SKY_SEED: 20261109,
};
