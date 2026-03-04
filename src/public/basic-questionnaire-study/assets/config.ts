/**
 * config.ts
 * ─────────────────────────────────────────────
 * Central configuration for the pickleball court experiment.
 * Every tunable parameter lives here so you never have to
 * dig through drawing or logic code to change a value.
 */

// ── HSV to Hex helper ──
function hsv(h: number, s: number, v: number): string {
  const sat = s / 100;
  const val = v / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  let r: number;
  let g: number;
  let b: number;
  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  return `#${[r + m, g + m, b + m].map((ch) => Math.round(ch * 255).toString(16).padStart(2, '0')).join('')}`;
}

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
    court: hsv(198, 71, 56),
    kitchen: hsv(103, 31, 63),
    lines: 'white',
    lineWidth: 3,
    netWidth: 4,
    ball: hsv(62, 100, 94),
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
