/**
 * main.js
 * ─────────────────────────────────────────────
 * Entry point – wires together config, court drawing,
 * and the trial engine. Import this as type="module"
 * from index.html.
 */

import { defaultConfig, derivePixels } from "./config.js";
import { drawCourt } from "./court.js";
import { createTrialEngine } from "./trial.js";

// ─── 1. Configuration ────────────────────────
// Use the defaults, or override anything you like:
const config = {
    ...defaultConfig,
    // Example overrides (uncomment to try):
    // scale: 30,
    // courtWidthFt: 20,
    // colors: { ...defaultConfig.colors, court: "#1a237e" },
};

// ─── 2. Create SVG ───────────────────────────
const { courtW, courtH } = derivePixels(config);
const { margin } = config;

const svg = d3
    .select("#container")
    .append("svg")
    .attr("width", courtW + margin.left + margin.right)
    .attr("height", courtH + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// ─── 3. Draw the court ──────────────────────
drawCourt(svg, config);

// ─── 4. Generate randomized trials ──────────
//
// randomBetween(min, max) → random float in [min, max], rounded to 1 decimal
function randomBetween(min, max) {
    return +(min + Math.random() * (max - min)).toFixed(1);
}

/**
 * Generate `count` trials with randomized positions, speed, and height.
 * Each range is [min, max]. Omit any optional range to use global defaults.
 *
 * @param {number} count     – How many trials to generate.
 * @param {Object} ranges    – Required: { startX, startY, endX, endY }
 *                             Optional: { speed, height } — each as [min, max]
 * @param {Object} [extras]  – Optional fixed overrides (ballColor, courtColor, etc.)
 * @returns {Array} trials
 */
function generateTrials(count, ranges, extras = {}) {
    const trials = [];
    for (let i = 0; i < count; i++) {
        const trial = {
            start: [
                randomBetween(ranges.startX[0], ranges.startX[1]),
                randomBetween(ranges.startY[0], ranges.startY[1]),
            ],
            end: [
                randomBetween(ranges.endX[0], ranges.endX[1]),
                randomBetween(ranges.endY[0], ranges.endY[1]),
            ],
            ...extras,
        };
        // Copy shotType label if provided
        if (ranges.shotType) {
            trial.shotType = ranges.shotType;
        }
        // Randomize speed if a range is provided
        if (ranges.speed) {
            trial.speed = Math.round(randomBetween(ranges.speed[0], ranges.speed[1]));
        }
        // Randomize height if a range is provided
        if (ranges.height) {
            trial.height = Math.round(randomBetween(ranges.height[0], ranges.height[1]));
        }
        // Pick a random ball color from the list (if provided)
        if (ranges.ballColors) {
            trial.ballColor = ranges.ballColors[Math.floor(Math.random() * ranges.ballColors.length)];
        }
        // Pick a random court color from the list (if provided)
        if (ranges.courtColors) {
            trial.courtColor = ranges.courtColors[Math.floor(Math.random() * ranges.courtColors.length)];
        }
        trials.push(trial);
    }
    return trials;
}

// ─────────────────────────────────────────────────────────────
// Court geometry reference:
//   Width  (X): 0 – 20 ft   (sideline to sideline)
//   Length (Y): 0 – 44 ft   (baseline to baseline, net at 22)
//   Each half‑court is 22 ft deep.
//   "Back"  = near baseline,  "Front" = near net.
// ─────────────────────────────────────────────────────────────

// ── Shared shot-type position/speed/height ranges ────────────
const DRIVE = {                           // Hard drive to back of far side
    shotType: "drive",
    startX: [0, 20], startY: [0, 2.2],   // back 10% of near half
    endX: [0, 20], endY: [38.5, 44], // back 25% of far half
    speed: [800, 1200],                  // fast
    height: [3, 10],                      // low–mid arc
};
const DROP = {                            // Soft drop into the kitchen
    shotType: "drop",
    startX: [0, 20], startY: [0, 6.6],   // back 30% of near half
    endX: [0, 20], endY: [23.1, 25.3],// front 5–15% of far half
    speed: [1600, 2200],                 // slow–mid
    height: [3, 10],                      // low–mid arc
};
const LOB = {                             // High lob deep
    shotType: "lob",
    startX: [0, 20], startY: [0, 4.4],   // back 20% of near half
    endX: [0, 20], endY: [40.7, 44], // back 15% of far half
    speed: [1200, 1800],                 // medium
    height: [18, 25],                     // high arc
};

// ── Color palettes ───────────────────────────────────────────
const BALL_COLORS = {
    neonYellow: "#ccff00",
    orange: "#ff6600",
    hotPink: "#ff69b4",
    cyan: "#00e5ff",
};
const COURT_COLORS = {
    blue: "#1a237e",
    green: "#2e7d32",
    purple: "#4a148c",
    red: "#c62828",
};

// ═════════════════════════════════════════════════════════════
//  TRIALS
// ═════════════════════════════════════════════════════════════

const trials = [

    // ─────────────────────────────────────────────────────────
    //  BASELINE — Neon yellow ball, blue court  (15 trials)
    //  5 drives + 5 drops + 5 lobs
    // ─────────────────────────────────────────────────────────
    ...generateTrials(5, { ...DRIVE, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.blue] }),
    ...generateTrials(5, { ...DROP, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.blue] }),
    ...generateTrials(5, { ...LOB, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.blue] }),

    // ─────────────────────────────────────────────────────────
    //  BALL COLOR TEST — Court fixed: blue  (27 trials)
    //  3 ball colors × 3 shot types × 3 trials each
    // ─────────────────────────────────────────────────────────

    // Orange ball
    ...generateTrials(3, { ...DRIVE, ballColors: [BALL_COLORS.orange], courtColors: [COURT_COLORS.blue] }),
    ...generateTrials(3, { ...DROP, ballColors: [BALL_COLORS.orange], courtColors: [COURT_COLORS.blue] }),
    ...generateTrials(3, { ...LOB, ballColors: [BALL_COLORS.orange], courtColors: [COURT_COLORS.blue] }),

    // Hot pink ball
    ...generateTrials(3, { ...DRIVE, ballColors: [BALL_COLORS.hotPink], courtColors: [COURT_COLORS.blue] }),
    ...generateTrials(3, { ...DROP, ballColors: [BALL_COLORS.hotPink], courtColors: [COURT_COLORS.blue] }),
    ...generateTrials(3, { ...LOB, ballColors: [BALL_COLORS.hotPink], courtColors: [COURT_COLORS.blue] }),

    // Cyan ball
    ...generateTrials(3, { ...DRIVE, ballColors: [BALL_COLORS.cyan], courtColors: [COURT_COLORS.blue] }),
    ...generateTrials(3, { ...DROP, ballColors: [BALL_COLORS.cyan], courtColors: [COURT_COLORS.blue] }),
    ...generateTrials(3, { ...LOB, ballColors: [BALL_COLORS.cyan], courtColors: [COURT_COLORS.blue] }),

    // ─────────────────────────────────────────────────────────
    //  COURT COLOR TEST — Ball fixed: neon yellow  (27 trials)
    //  3 court colors × 3 shot types × 3 trials each
    // ─────────────────────────────────────────────────────────

    // Green court
    ...generateTrials(3, { ...DRIVE, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.green] }),
    ...generateTrials(3, { ...DROP, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.green] }),
    ...generateTrials(3, { ...LOB, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.green] }),

    // Purple court
    ...generateTrials(3, { ...DRIVE, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.purple] }),
    ...generateTrials(3, { ...DROP, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.purple] }),
    ...generateTrials(3, { ...LOB, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.purple] }),

    // Red court
    ...generateTrials(3, { ...DRIVE, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.red] }),
    ...generateTrials(3, { ...DROP, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.red] }),
    ...generateTrials(3, { ...LOB, ballColors: [BALL_COLORS.neonYellow], courtColors: [COURT_COLORS.red] }),
];

// ─── 5. Run the experiment ──────────────────
createTrialEngine(svg, config, trials, (results) => {
    console.log("All results:", results);

    // Pretty-print the CSV to the console
    const header = "trialId,timestamp,shotType,startX,startY,endX,endY,speed,height,ballColor,courtColor,guessX,guessY,errorFt";
    const rows = results.map(
        (r) =>
            `${r.trialId},${r.timestamp},${r.shotType},${r.startX},${r.startY},${r.endX},${r.endY},${r.speed},${r.height},${r.ballColor},${r.courtColor},${r.guessX},${r.guessY},${r.errorFt}`
    );
    console.log([header, ...rows].join("\n"));
});
