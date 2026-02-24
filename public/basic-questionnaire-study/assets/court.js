/**
 * court.js
 * ─────────────────────────────────────────────
 * Responsible for drawing the pickleball court.
 * Every visual element is parameterized through `config`.
 */

import { derivePixels } from "./config.js";

/**
 * Draw the full pickleball court onto `svg`.
 *
 * @param {d3.Selection} svg    – The <g> group to draw into.
 * @param {Object}       config – A config object (see config.js).
 */
export function drawCourt(svg, config) {
    const { courtW, courtH, kitchenSize } = derivePixels(config);
    const c = config.colors;

    // ── 1. Main court boundary ──
    svg
        .append("rect")
        .classed("court-bg", true)
        .attr("width", courtW)
        .attr("height", courtH)
        .style("fill", c.court)
        .style("stroke", c.lines)
        .style("stroke-width", c.lineWidth);

    // ── 2. Net (horizontal midline) ──
    svg
        .append("line")
        .attr("x1", 0)
        .attr("y1", courtH / 2)
        .attr("x2", courtW)
        .attr("y2", courtH / 2)
        .style("stroke", c.lines)
        .style("stroke-width", c.netWidth);

    // ── 3. Kitchen / Non-Volley Zones ──
    // Top kitchen (above the net)
    svg
        .append("rect")
        .classed("kitchen-bg", true)
        .attr("y", courtH / 2 - kitchenSize)
        .attr("width", courtW)
        .attr("height", kitchenSize)
        .style("fill", c.kitchen)
        .style("stroke", c.lines);

    // Bottom kitchen (below the net)
    svg
        .append("rect")
        .classed("kitchen-bg", true)
        .attr("y", courtH / 2)
        .attr("width", courtW)
        .attr("height", kitchenSize)
        .style("fill", c.kitchen)
        .style("stroke", c.lines);

    // ── 4. Service-court center lines ──
    // Top half: baseline → kitchen line
    svg
        .append("line")
        .attr("x1", courtW / 2)
        .attr("y1", 0)
        .attr("x2", courtW / 2)
        .attr("y2", courtH / 2 - kitchenSize)
        .style("stroke", c.lines);

    // Bottom half: kitchen line → baseline
    svg
        .append("line")
        .attr("x1", courtW / 2)
        .attr("y1", courtH / 2 + kitchenSize)
        .attr("x2", courtW / 2)
        .attr("y2", courtH)
        .style("stroke", c.lines);
}

/**
 * Update the court color on the fly (e.g. between trials).
 *
 * @param {d3.Selection} svg       – The court <g> group.
 * @param {string}       courtColor – New fill for the main court rect.
 * @param {string}       [kitchenColor] – Optional new fill for kitchen zones.
 */
export function setCourtColor(svg, courtColor, kitchenColor) {
    svg.select(".court-bg").style("fill", courtColor);
    if (kitchenColor) {
        svg.selectAll(".kitchen-bg").style("fill", kitchenColor);
    }
}
