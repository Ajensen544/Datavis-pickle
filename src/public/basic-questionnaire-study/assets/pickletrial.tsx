import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { StimulusParams } from '../../../store/types';
import { useNextStep } from '../../../store/hooks/useNextStep';
import { useStoreSelector } from '../../../store/store';
import { useCurrentIdentifier } from '../../../routes/utils';
// Import trial engine and config helpers
import { createTrialEngine } from './trial';
import { defaultConfig, derivePixels } from './config';
import { drawCourt } from './court';

interface TrialInput {
  start: [number, number];
  end: [number, number];
  speed?: number;
  height?: number;
  percentageOfArc?: number;
  ballColor?: string;
  courtColor?: string;
  shotType?: string;
  participantId?: string;
  demographics?: string;
  identifier?: string;
}

interface TrialResult {
  participantId: string;
  trialId: string;
  shotType: string;
  demographics: string;
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

interface TrialParameters {
  taskid?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  speed?: number;
  height?: number;
  percentageOfArc?: number;
  ballColor?: string;
  courtColor?: string;
  shotType?: string;
}

// Accepts parameters for a single trial, or an array of trials
function PickleTrial({
  parameters,
  setAnswer,
}: StimulusParams<TrialParameters>) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [trialComplete, setTrialComplete] = useState(false);
  const config = defaultConfig;
  const taskid = parameters.taskid ?? 'pickleballAnswer';
  const { goToNextStep } = useNextStep();
  const participantId = useStoreSelector((state) => state.participantId);
  const identifier = useCurrentIdentifier();
  const participantAnswers = useStoreSelector((state) => state.answers);

  const demographics = Object.entries(participantAnswers)
    .filter(([key]) => key.startsWith('demographics_') || key.startsWith('introduction_'))
    .flatMap(([, val]) => Object.values(val.answer))
    .join(' | ');

  const mapDisplayToEngineCoords = (x: number, y: number): [number, number] => {
    const mappedX = y;
    const mappedY = config.courtHeightFt - x;
    return [mappedX, mappedY];
  };

  // Compose trials array from parameters or propTrials
  const inputTrials: TrialInput[] = [
    {
      start: [parameters.startX ?? 2, parameters.startY ?? 2],
      end: [parameters.endX ?? 10, parameters.endY ?? 20],
      speed: parameters.speed,
      height: parameters.height,
      percentageOfArc: parameters.percentageOfArc,
      ballColor: parameters.ballColor,
      courtColor: parameters.courtColor,
      shotType: parameters.shotType,
      participantId,
      demographics,
      identifier,
    },
  ];

  const trials = inputTrials.map((trial) => ({
    ...trial,
    start: mapDisplayToEngineCoords(trial.start[0], trial.start[1]),
    end: mapDisplayToEngineCoords(trial.end[0], trial.end[1]),
  }));

  useEffect(() => {
    if (!svgRef.current) return;
    setAnswer({
      status: false,
      answers: {
        [taskid]: '',
      },
    });
    // Clear SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    // Set up SVG size
    const { courtW, courtH } = derivePixels(config);
    svg
      .attr('width', courtH + config.margin.left + config.margin.right)
      .attr('height', courtW + config.margin.top + config.margin.bottom);
    // Draw court, rotated 90 degrees (clockwise)
    // To rotate around (0,0), then translate into view
    const g = svg
      .append('g')
      .attr('transform', `translate(${config.margin.left + courtH},${config.margin.top}) rotate(90)`) as unknown as d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
    drawCourt(g, config);

    // Start trial engine
    createTrialEngine(g, config, trials, (res: TrialResult[]) => {
      setResults(res);
      setTrialComplete(true);
      const lastResult = res[res.length - 1];
      if (!lastResult) {
        setAnswer({
          status: false,
          answers: {
            [taskid]: '',
          },
        });
        return;
      }

      setAnswer({
        status: true,
        answers: {
          [taskid]: JSON.stringify(lastResult),
        },
      });
    });
    // eslint-disable-next-line
  }, [JSON.stringify(parameters), setAnswer, taskid]);

  useEffect(() => {
    if (trialComplete) {
      const timer = setTimeout(() => {
        goToNextStep();
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [trialComplete, goToNextStep]);

  // results stored in results

  return (
    <div>
      <h2>Pickleball Trial</h2>
      <svg ref={svgRef} style={{ border: '1px solid #ccc', background: '#FFF' }} />
      {trialComplete && (
        <div style={{ marginTop: 16 }}>
          <b>Results:</b>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default PickleTrial;
