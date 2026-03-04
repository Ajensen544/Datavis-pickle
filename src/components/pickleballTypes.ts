import type * as d3Type from 'd3';

export interface PickleballConfig {
  courtWidthFt: number;
  courtHeightFt: number;
  kitchenDepthFt: number;
  scale: number;
  margin: { top: number; right: number; bottom: number; left: number };
  colors: {
    court: string;
    kitchen: string;
    lines: string;
    lineWidth: number;
    netWidth: number;
    ball: string;
    ballStroke: string;
    feedbackCorrect: string;
    guessColor: string;
  };
  ball: {
    radius: number;
    shotDuration: number;
    dropDuration: number;
    arcHeight: number;
  };
  trialDelay: number;
}

export interface PickleballTrial {
  start: [number, number];
  end: [number, number];
  speed?: number;
  height?: number;
  ballColor?: string;
  courtColor?: string;
}

export interface PickleballResult extends PickleballTrial {
  trial: number;
  guessX: number;
  guessY: number;
  error: number;
}

export type D3 = typeof d3Type;
