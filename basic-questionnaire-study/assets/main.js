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

// ── Hardcode your ranges & options here ─────────────────
// Position ranges in feet, speed in ms, height in px.
// ballColors / courtColors: arrays of CSS colors to randomly pick from.

const trials = generateTrials(5, {
    startX: [5, 15],
    startY: [0, 5],
    endX: [2, 18],
    endY: [20, 40],
    speed: [800, 2500],
    height: [5, 25],
    ballColors: ["#ccff00", "#ff6600", "#ff69b4", "#00e5ff"],  // yellow, orange, pink, cyan
    courtColors: ["#2e7d32", "#1a237e", "#4a148c"],             // green, blue, purple
});

// You can also mix in manual trials or fixed-override batches:
// const trials = [
//     ...generateTrials(3, { startX:[8,12], startY:[0,2], endX:[2,18], endY:[25,40], speed:[1000,2000], height:[8,20] }),
//     ...generateTrials(2, { startX:[8,12], startY:[0,2], endX:[2,18], endY:[25,40], speed:[500,800], height:[3,8] }, { ballColor: "#ff6600" }),
//     { start: [10, 0], end: [10, 30], speed: 2000, height: 15, ballColor: "#ff69b4" },
// ];

// ─── 5. Run the experiment ──────────────────
createTrialEngine(svg, config, trials, (results) => {
    console.log("All results:", results);

    // Pretty-print the CSV to the console
    const header = "trialId,timestamp,startX,startY,endX,endY,speed,height,ballColor,courtColor,guessX,guessY,errorFt";
    const rows = results.map(
        (r) =>
            `${r.trialId},${r.timestamp},${r.startX},${r.startY},${r.endX},${r.endY},${r.speed},${r.height},${r.ballColor},${r.courtColor},${r.guessX},${r.guessY},${r.errorFt}`
    );
    console.log([header, ...rows].join("\n"));
});
