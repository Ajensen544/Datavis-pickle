/**
 * ball.js
 * ─────────────────────────────────────────────
 * Ball animation helpers – dropping and shooting.
 * All positions are in FEET; scaling is handled internally.
 *
 * Every function accepts an optional `overrides` object so
 * individual trials can customize speed, height, and color.
 */

/**
 * Drop a stationary ball onto the court at (xFeet, yFeet).
 *
 * @param {d3.Selection} svg       – The court <g> group.
 * @param {Object}       config    – Global config object.
 * @param {number}       xFeet     – X position in feet.
 * @param {number}       yFeet     – Y position in feet.
 * @param {Object}       [overrides] – Per-trial overrides:
 *   { ballColor, speed, height }
 * @returns {d3.Selection} The appended circle element.
 */
export function dropBall(svg, config, xFeet, yFeet, overrides = {}) {
    const { scale, colors, ball } = config;
    const fillColor = overrides.ballColor ?? colors.ball;

    return svg
        .append("circle")
        .attr("cx", xFeet * scale)
        .attr("cy", yFeet * scale)
        .attr("r", ball.radius + 1)
        .style("fill", fillColor)
        .style("stroke", colors.ballStroke)
        .style("opacity", 0)
        .transition()
        .duration(ball.dropDuration)
        .style("opacity", 1);
}

/**
 * Animate a ball travelling from (startX, startY) → (endX, endY).
 * A parabolic arc is faked by tweening the circle radius.
 *
 * @param {d3.Selection} svg       – The court <g> group.
 * @param {Object}       config    – Global config object.
 * @param {number}       startX    – Start X in feet.
 * @param {number}       startY    – Start Y in feet.
 * @param {number}       endX      – End X in feet.
 * @param {number}       endY      – End Y in feet.
 * @param {Object}       [overrides] – Per-trial overrides:
 *   { ballColor, speed (ms), height (px extra radius) }
 * @returns {d3.Selection} The animated circle element.
 */
export function simulateShot(svg, config, startX, startY, endX, endY, overrides = {}) {
    const { scale, colors, ball } = config;

    // Per-trial values (fall back to global config defaults)
    const fillColor = overrides.ballColor ?? colors.ball;
    const duration = overrides.speed ?? ball.shotDuration;
    const arcHeight = overrides.height ?? ball.arcHeight;

    const circle = svg
        .append("circle")
        .attr("r", ball.radius)
        .attr("cx", startX * scale)
        .attr("cy", startY * scale)
        .style("fill", fillColor)
        .style("stroke", colors.ballStroke);

    circle
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .attr("cx", endX * scale)
        .attr("cy", endY * scale)
        .attrTween("r", () => (t) => {
            // Sine curve peaks at t = 0.5 → simulates height arc
            return ball.radius + Math.sin(Math.PI * t) * arcHeight;
        })
        .on("end", () => circle.remove()); // vanish on landing

    return circle;
}
