// Every tuning number lives here. Values are starting points, not design decisions.
export const CONFIG = {
  // Economy
  BASE_YIELD: 1,                 // stock per second from a tile at V = 1, S = 0
  OFFLINE_CAP_HOURS: 24,         // offline progress stops accruing after this

  // Tier rules (handoff section 7)
  DEVELOPED_SATURATION: 0.25,    // a tile counts as developed at or above this
  BICHROME_MIN_SHARE: 0.25,      // smaller hue family's share of developed tiles
  POLYCHROME_MIN_SATURATION: 0.7,

  // Starting look of a latent system
  LATENT_SATURATION: 0.12,
  LATENT_VALUE: 0.65,

  // Starting palette: 3 bits total = 1 bit per channel = 8 colors
  START_BIT_DEPTH: 3,

  // Loop and saving
  TICK_MS: 250,
  SAVE_INTERVAL_MS: 10000,
  SAVE_KEY: 'gods-save-v1',
  AFTERGLOW_MIN_SECONDS: 60,     // shorter absences don't show the Afterglow screen

  // Display
  FIELD_COLS: 3,                 // stars drawn from -cols..cols horizontally
  FIELD_ROWS: 2,                 // and -rows..rows vertically
  GROUT: '#0f1226',
};
