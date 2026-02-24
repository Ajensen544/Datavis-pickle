/**
 * trial.js
 * ─────────────────────────────────────────────
 * Trial engine – manages experiment flow, click capture,
 * error calculation, and results collection.
 *
 * Each trial can carry per-trial overrides:
 *   { start, end, speed, height, ballColor, courtColor }
 */

import { simulateShot } from "./ball.js";
import { setCourtColor } from "./court.js";

/**
 * Create and start a trial engine.
 *
 * @param {d3.Selection} svg        – The court <g> group.
 * @param {Object}       config     – Global config object (see config.js).
 * @param {Array}        trials     – Array of trial objects:
 *   {
 *     start:      [xFt, yFt],          // required
 *     end:        [xFt, yFt],          // required
 *     speed:      number (ms),         // optional – shot duration
 *     height:     number (px),         // optional – arc peak extra radius
 *     ballColor:  string,              // optional – e.g. "#ff0000"
 *     courtColor: string,              // optional – changes court fill for this trial
 *   }
 * @param {Function}     onComplete – Called with the results array when done.
 * @returns {{ results: Array }}
 */
export async function createTrialEngine(svg, config, trials, onComplete) {
    const { scale } = config;

    // Fetch the next available ID from the server so IDs never reset
    let startId = 1;
    try {
        const resp = await fetch("/api/next-id");
        const data = await resp.json();
        startId = data.nextId;
    } catch (e) {
        console.warn("Could not fetch next ID, starting at 1");
    }

    let currentTrial = 0;
    let canClick = false;
    let actualLanding = { x: 0, y: 0 };
    const results = [];

    // Keep track of the original court color so we can restore it
    const originalCourtColor = config.colors.court;
    const originalKitchenColor = config.colors.kitchen;

    // ── Click handler (single, owns all click logic) ──
    svg.on("click", function (event) {
        if (!canClick) return;
        canClick = false; // lock immediately

        const [mx, my] = d3.pointer(event);
        const guessX = mx / scale;
        const guessY = my / scale;

        // Pythagorean error (in feet)
        const error = Math.sqrt(
            Math.pow(guessX - actualLanding.x, 2) +
            Math.pow(guessY - actualLanding.y, 2)
        );

        const trial = trials[currentTrial];
        const trialResult = {
            trialId: startId + currentTrial,
            timestamp: new Date().toISOString(),
            // ── Inputs ──
            startX: trial.start[0],
            startY: trial.start[1],
            endX: trial.end[0],
            endY: trial.end[1],
            speed: trial.speed ?? config.ball.shotDuration,
            height: trial.height ?? config.ball.arcHeight,
            ballColor: trial.ballColor ?? config.colors.ball,
            courtColor: trial.courtColor ?? config.colors.court,
            // ── Outputs ──
            guessX: +guessX.toFixed(2),
            guessY: +guessY.toFixed(2),
            errorFt: +error.toFixed(2),
        };

        results.push(trialResult);
        console.log(
            `Trial ${trialResult.trialId} | ` +
            `Start: (${trialResult.startX}, ${trialResult.startY}) → ` +
            `End: (${trialResult.endX}, ${trialResult.endY}) | ` +
            `Guess: (${trialResult.guessX}, ${trialResult.guessY}) | ` +
            `Error: ${trialResult.errorFt} ft`
        );

        // ── Save to CSV on the server ──
        fetch("/api/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(trialResult),
        }).catch((err) => console.warn("Could not save trial:", err));

        // ── Show click highlight (expanding ring) ──
        svg
            .append("circle")
            .attr("cx", mx)
            .attr("cy", my)
            .attr("r", 4)
            .style("fill", "none")
            .style("stroke", config.colors.guessColor)
            .style("stroke-width", 3)
            .style("opacity", 1)
            .transition()
            .duration(600)
            .attr("r", 20)
            .style("opacity", 0)
            .on("end", function () { d3.select(this).remove(); });

        // Small dot that stays to mark the guess
        svg
            .append("circle")
            .classed("guess-marker", true)
            .attr("cx", mx)
            .attr("cy", my)
            .attr("r", 4)
            .style("fill", config.colors.guessColor)
            .style("opacity", 0.7);

        // ── Show correct-landing feedback ──
        svg
            .append("circle")
            .classed("actual-marker", true)
            .attr("cx", actualLanding.x * scale)
            .attr("cy", actualLanding.y * scale)
            .attr("r", 5)
            .style("fill", config.colors.feedbackCorrect)
            .style("opacity", 0.7);

        // Advance after delay
        currentTrial++;
        setTimeout(() => {
            svg.selectAll("circle").remove();
            runTrial();
        }, config.trialDelay);
    });

    // ── Run a single trial ──
    function runTrial() {
        if (currentTrial >= trials.length) {
            // Restore original court color
            setCourtColor(svg, originalCourtColor, originalKitchenColor);
            console.log("Experiment Complete!");
            if (onComplete) onComplete(results);
            return;
        }

        const trial = trials[currentTrial];
        actualLanding = { x: trial.end[0], y: trial.end[1] };

        // ── Apply per-trial court color (if specified) ──
        if (trial.courtColor) {
            setCourtColor(svg, trial.courtColor);
        } else {
            setCourtColor(svg, originalCourtColor, originalKitchenColor);
        }

        // ── Build per-trial overrides for the ball ──
        const shotOverrides = {};
        if (trial.speed !== undefined) shotOverrides.speed = trial.speed;
        if (trial.height !== undefined) shotOverrides.height = trial.height;
        if (trial.ballColor !== undefined) shotOverrides.ballColor = trial.ballColor;

        simulateShot(
            svg,
            config,
            trial.start[0],
            trial.start[1],
            trial.end[0],
            trial.end[1],
            shotOverrides
        );

        // Enable clicking once the ball "lands"
        const duration = trial.speed ?? config.ball.shotDuration;
        setTimeout(() => {
            canClick = true;
            console.log("Click where you think the ball landed!");
        }, duration);
    }

    // Kick off the first trial
    runTrial();

    return { results };
}
