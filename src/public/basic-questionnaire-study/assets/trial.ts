/**
 * trial.js
 * ─────────────────────────────────────────────
 * Trial engine – manages experiment flow, click capture,
 * error calculation, and results collection.
 *
 * Each trial can carry per-trial overrides:
 *   { start, end, speed, height, ballColor, courtColor }
 */

import * as d3 from 'd3';
import { simulateShot } from './ball';
import { setCourtColor } from './court';

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
interface TrialConfig {
    start: [number, number];
    end: [number, number];
    speed?: number;
    height?: number;
    percentageOfArc?: number;
    ballColor?: string;
    courtColor?: string;
}

interface TrialResult {
    trialId: number;
    timestamp: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    speed: number;
    height: number;
    percentageOfArc: number;
    ballColor: string;
    courtColor: string;
    guessX: number;
    guessY: number;
    errorFt: number;
}

interface Point {
    x: number;
    y: number;
}

interface ShotOverrides {
    speed?: number;
    height?: number;
    percentageOfArc?: number;
    ballColor?: string;
}

interface Config {
    scale: number;
    colors: {
        court: string;
        kitchen: string;
        ball: string;
        ballStroke: string;
        guessColor: string;
        feedbackCorrect: string;
    };
    ball: {
        radius: number;
        shotDuration: number;
        dropDuration: number;
        arcHeight: number;
    };
    trialDelay: number;
}

export async function createTrialEngine(
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
  config: Config,
  trials: TrialConfig[],
  onComplete?: (results: TrialResult[]) => void,
): Promise<{ results: TrialResult[] }> {
  const { scale } = config;

  // Fetch starting trial ID from server to ensure unique IDs across sessions
  let startId = 1;
  try {
    const resp = await fetch('/api/next-id');
    const data = await resp.json();
    startId = data.nextId;
  } catch (e) {
    console.warn(`Error: ${e} Could not fetch next ID, starting at 1`);
  }

  let currentTrial = 0;
  let canClick = false;
  let actualLanding: Point = { x: 0, y: 0 };
  const results: TrialResult[] = [];

  const originalCourtColor = config.colors.court;
  const originalKitchenColor = config.colors.kitchen;

  function runTrial(): void {
    if (currentTrial >= trials.length) {
      setCourtColor(svg, originalCourtColor, originalKitchenColor);
      if (onComplete) onComplete(results);
      return;
    }

    const trial = trials[currentTrial];
    actualLanding = { x: trial.end[0], y: trial.end[1] };

    if (trial.courtColor) {
      setCourtColor(svg, trial.courtColor, originalKitchenColor);
    } else {
      setCourtColor(svg, originalCourtColor, originalKitchenColor);
    }

    const shotOverrides: ShotOverrides = {};
    if (trial.speed !== undefined) shotOverrides.speed = trial.speed;
    if (trial.height !== undefined) shotOverrides.height = trial.height;
    if (trial.percentageOfArc !== undefined) shotOverrides.percentageOfArc = trial.percentageOfArc;
    if (trial.ballColor !== undefined) shotOverrides.ballColor = trial.ballColor;

    simulateShot(
      svg,
      config,
      trial.start[0],
      trial.start[1],
      trial.end[0],
      trial.end[1],
      shotOverrides,
    );

    const duration = trial.speed ?? config.ball.shotDuration;
    setTimeout(() => {
      canClick = true;
    }, duration);
  }

  svg.on('click', (event: MouseEvent) => {
    if (!canClick) return;
    canClick = false;

    const [mx, my] = d3.pointer(event);
    const guessX = mx / scale;
    const guessY = my / scale;

    const error = Math.sqrt(
      (guessX - actualLanding.x) ** 2
                + (guessY - actualLanding.y) ** 2,
    );

    const trial = trials[currentTrial];
    const trialResult: TrialResult = {
      trialId: startId + currentTrial,
      timestamp: new Date().toISOString(),
      startX: trial.start[0],
      startY: trial.start[1],
      endX: trial.end[0],
      endY: trial.end[1],
      speed: trial.speed ?? config.ball.shotDuration,
      height: trial.height ?? config.ball.arcHeight,
      percentageOfArc: Math.max(
        0,
        Math.min(100, trial.percentageOfArc ?? 100),
      ),
      ballColor: trial.ballColor ?? config.colors.ball,
      courtColor: trial.courtColor ?? config.colors.court,
      guessX: +guessX.toFixed(2),
      guessY: +guessY.toFixed(2),
      errorFt: +error.toFixed(2),
    };

    results.push(trialResult);
    // console.log(
    //   `Trial ${trialResult.trialId} | `
    //             + `Start: (${trialResult.startX}, ${trialResult.startY}) → `
    //             + `End: (${trialResult.endX}, ${trialResult.endY}) | `
    //             + `Guess: (${trialResult.guessX}, ${trialResult.guessY}) | `
    //             + `Error: ${trialResult.errorFt} ft`,
    // );

    // Save trial result to server
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trialResult),
    }).catch((err) => console.warn('Could not save trial:', err));

    svg
      .append('circle')
      .attr('cx', mx)
      .attr('cy', my)
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', config.colors.guessColor)
      .style('stroke-width', 3)
      .style('opacity', 1)
      .transition()
      .duration(600)
      .attr('r', 20)
      .style('opacity', 0)
      .on('end', function () {
        d3.select(this).remove();
      });

    svg
      .append('circle')
      .classed('guess-marker', true)
      .attr('cx', mx)
      .attr('cy', my)
      .attr('r', 4)
      .style('fill', config.colors.guessColor)
      .style('opacity', 0.7);

    svg
      .append('circle')
      .classed('actual-marker', true)
      .attr('cx', actualLanding.x * scale)
      .attr('cy', actualLanding.y * scale)
      .attr('r', 5)
      .style('fill', config.colors.feedbackCorrect)
      .style('opacity', 0.7);

    currentTrial += 1;
    setTimeout(() => {
      svg.selectAll('circle').remove();
      runTrial();
    }, config.trialDelay);
  });

  runTrial();

  return { results };
}
