/**
 * ball.js
 * ─────────────────────────────────────────────
 * Ball animation helpers – dropping and shooting.
 * All positions are in FEET; scaling is handled internally.
 *
 * Every function accepts an optional `overrides` object so
 * individual trials can customize speed, height, and color.
 */

import * as d3 from 'd3';

interface ShotOverrides {
    speed?: number;
    height?: number;
    ballColor?: string;
    percentageOfArc?: number;
}

interface Config {
    scale: number;
    colors: {
        ball: string;
        ballStroke: string;
    };
    ball: {
        radius: number;
        shotDuration: number;
        dropDuration: number;
        arcHeight: number;
    };
}

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
export function dropBall(
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
  config: Config,
  xFeet: number,
  yFeet: number,
  overrides: ShotOverrides = {},
): d3.Transition<SVGCircleElement, unknown, HTMLElement, unknown> {
  const { scale, colors, ball } = config;
  const fillColor = overrides.ballColor ?? colors.ball;

  return svg
    .append('circle')
    .attr('cx', xFeet * scale)
    .attr('cy', yFeet * scale)
    .attr('r', ball.radius + 1)
    .style('fill', fillColor)
    .style('stroke', colors.ballStroke)
    .style('opacity', 0)
    .transition()
    .duration(ball.dropDuration)
    .style('opacity', 1);
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
export function simulateShot(
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
  config: Config,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  overrides: ShotOverrides = {},
): d3.Selection<SVGCircleElement, unknown, HTMLElement, unknown> {
  const { scale, colors, ball } = config;

  // Per-trial values (fall back to global config defaults)
  const fillColor = overrides.ballColor ?? colors.ball;
  const duration = overrides.speed ?? ball.shotDuration;
  const arcHeight = overrides.height ?? ball.arcHeight;
  const rawArcPercentage = overrides.percentageOfArc ?? 100;
  const arcPercentage = Math.max(0, Math.min(100, rawArcPercentage));
  const arcFraction = arcPercentage / 100;
  const shownDuration = Math.max(0, Math.round(duration * arcFraction));

  const circle = svg
    .append('circle')
    .attr('r', ball.radius)
    .attr('cx', startX * scale)
    .attr('cy', startY * scale)
    .style('fill', fillColor)
    .style('stroke', colors.ballStroke);

  circle
    .transition()
    .duration(shownDuration)
    .ease(d3.easeLinear)
    .attrTween('cx', () => (t) => {
      const globalProgress = t * arcFraction;
      const cx = startX + (endX - startX) * globalProgress;
      return String(cx * scale);
    })
    .attrTween('cy', () => (t) => {
      const globalProgress = t * arcFraction;
      const cy = startY + (endY - startY) * globalProgress;
      return String(cy * scale);
    })
    .attrTween('r', () => (t) => {
      const globalProgress = t * arcFraction;
      // Sine curve peaks at global progress 0.5 on the original full arc
      return String(
        ball.radius + Math.sin(Math.PI * globalProgress) * arcHeight,
      );
    })
    .on('end', () => circle.remove()); // vanish on landing

  return circle;
}
