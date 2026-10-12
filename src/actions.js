// Player actions for Milestone 0. These are the next thing to build.
// Each takes the state, changes it, and returns { ok, reason? }.

// Choose which candidate hue a latent system collapses toward.
// TODO(M0): validate hue is in system.candidates, set system.chosenHue,
// and decide whether this immediately recolors tiles or only steers cultivation.
export function chooseHue(state, systemId, hue) {
  return { ok: false, reason: 'not built yet' };
}

// Spend stock to cultivate one tile: raise its saturation and value toward the chosen hue.
// TODO(M0): cost curve and step sizes go in CONFIG. Requires chosenHue to be set.
export function cultivate(state, systemId, tileId) {
  return { ok: false, reason: 'not built yet' };
}
