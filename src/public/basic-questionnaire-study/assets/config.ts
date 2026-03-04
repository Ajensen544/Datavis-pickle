/**
 * config.js
 * ─────────────────────────────────────────────
 * Central configuration for the pickleball court experiment.
 * Every tunable parameter lives here so you never have to
 * dig through drawing or logic code to change a value.
 */

export const defaultConfig = {
  // ── Court real-world dimensions (in feet) ──
  courtWidthFt: 20,
  courtHeightFt: 44,
  kitchenDepthFt: 7, // Non-Volley Zone depth from the net

  // ── Scaling ──
  scale: 24, // pixels per foot

  // ── SVG Margins ──
  margin: {
    top: 40, right: 40, bottom: 40, left: 40,
  },

  // ── Colors ──
  colors: {
    court: '#2e7d32',
    kitchen: '#1b5e20',
    lines: 'white',
    lineWidth: 3,
    netWidth: 4,
    ball: '#ccff00',
    ballStroke: 'black',
    feedbackCorrect: 'green',
    guessColor: 'red',
  },

  // ── Ball Animation ──
  ball: {
    radius: 4,
    shotDuration: 1500, // ms – how long the shot animation takes
    dropDuration: 500, // ms – fade-in duration for dropBall
    arcHeight: 10, // extra radius at the peak of the arc
  },

  // ── Trial Timing ──
  trialDelay: 2000, // ms – pause between trials
};

type PixelConfig = Pick<typeof defaultConfig, 'courtWidthFt' | 'courtHeightFt' | 'kitchenDepthFt' | 'scale'>;

/**
 * Helper: derive pixel values from a config object.
 * Call this once and pass the result wherever you need px values.
 */
export function derivePixels(config: PixelConfig) {
  const s = config.scale;
  return {
    courtW: config.courtWidthFt * s,
    courtH: config.courtHeightFt * s,
    kitchenSize: config.kitchenDepthFt * s,
  };
}
