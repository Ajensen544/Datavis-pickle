/* eslint-disable no-console */
import fs from 'fs';

// ── HSV to Hex helper ────────────────────────────────────────
function hsv(h, s, v) {
  const sat = s / 100;
  const val = v / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  let r;
  let g;
  let b;
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

// ── Color palettes (defined in HSV) ──────────────────────────
const BALL_COLORS = {
  neonYellow: hsv(62, 100, 94),
  orange: hsv(27, 100, 99),
  pink: hsv(325, 80, 95),
  neonGreen: hsv(76, 69, 98),
};
const COURT_COLORS = {
  default: hsv(198, 71, 56),
  gray: hsv(200, 37, 35),
  red: hsv(351, 86, 89),
};

const _KITCHEN_COLOR = hsv(103, 31, 63);

// ─────────────────────────────────────────────────────────────
// Court geometry in React (pickletrial.tsx):
//   X is the LENGTH of the court: 0 - 44 ft  (Net is at X = 22)
//   Y is the WIDTH of the court:  0 - 20 ft
//   We start the ball on the right side (X: 22-44) and hit to left side (X: 0-22).
// ─────────────────────────────────────────────────────────────

// ── Shared shot-type ranges ────────────────────────────
const DRIVE = {
  shotType: 'drive',
  startX: [41.8, 44],
  startY: [1, 19],
  endX: [0, 5.5],
  endY: [1, 19],
  percentage: [25, 40],
  speed: [800, 1100],
  height: [5, 8],
};
const DROP = {
  shotType: 'drop',
  startX: [37.4, 44],
  startY: [1, 19],
  endX: [18.7, 20.9],
  endY: [1, 19],
  percentage: [30, 45],
  speed: [1200, 1600],
  height: [8, 12],
};
const LOB = {
  shotType: 'lob',
  startX: [39.6, 44],
  startY: [1, 19],
  endX: [0, 3.3],
  endY: [1, 19],
  percentage: [80, 95],
  speed: [2100, 2600],
  height: [16, 22],
};

function randomBetween(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(1);
}

function generateTrials(prefix, count, ranges, extras) {
  const generated = {};
  const ids = [];

  for (let i = 1; i <= count; i += 1) {
    const id = `${prefix}-${i}`;
    ids.push(id);

    const ballColor = Array.isArray(extras.ballColors)
      ? extras.ballColors[Math.floor(Math.random() * extras.ballColors.length)]
      : (extras.ballColor || BALL_COLORS.neonYellow);

    const courtColor = Array.isArray(extras.courtColors)
      ? extras.courtColors[Math.floor(Math.random() * extras.courtColors.length)]
      : (extras.courtColor || COURT_COLORS.default);

    generated[id] = {
      baseComponent: 'pickletrial',
      parameters: {
        taskid: 'pickleballAnswer',
        shotType: ranges.shotType,
        startX: randomBetween(ranges.startX[0], ranges.startX[1]),
        startY: randomBetween(ranges.startY[0], ranges.startY[1]),
        endX: randomBetween(ranges.endX[0], ranges.endX[1]),
        endY: randomBetween(ranges.endY[0], ranges.endY[1]),
        speed: Math.floor(randomBetween(ranges.speed[0], ranges.speed[1])),
        height: randomBetween(ranges.height[0], ranges.height[1]),
        percentageOfArc: 95,
        courtColor,
        ballColor,
      },
    };
  }

  return { components: generated, ids };
}

// Fixed practice trials (Right half to Left half)
const practiceTrials = {
  'pickleball-practice1': {
    baseComponent: 'pickletrial',
    parameters: {
      taskid: 'pickleballAnswer', shotType: 'practice', startX: 40, startY: 2, endX: 10, endY: 18, courtColor: '#29708f', ballColor: '#e8f000', percentageOfArc: 95,
    },
  },
  'pickleball-practice2': {
    baseComponent: 'pickletrial',
    parameters: {
      taskid: 'pickleballAnswer', shotType: 'practice', startX: 38, startY: 10, endX: 18, endY: 5, courtColor: '#1a237e', ballColor: '#ccff00', percentageOfArc: 95,
    },
  },
};
const practiceIds = Object.keys(practiceTrials);

const allComponents = { ...practiceTrials };

// ── Baseline (Default court, Yellow ball) ─────────────────────────
const baselineDrives = generateTrials('baseline-drive', 3, DRIVE, { ballColor: BALL_COLORS.neonYellow, courtColor: COURT_COLORS.default });
const baselineDrops = generateTrials('baseline-drop', 3, DROP, { ballColor: BALL_COLORS.neonYellow, courtColor: COURT_COLORS.default });
const baselineLobs = generateTrials('baseline-lob', 3, LOB, { ballColor: BALL_COLORS.neonYellow, courtColor: COURT_COLORS.default });
Object.assign(allComponents, baselineDrives.components, baselineDrops.components, baselineLobs.components);

const _baselineIds = [...baselineDrives.ids, ...baselineDrops.ids, ...baselineLobs.ids];

// Instead of grouping by baseline/ball/color, group by stroke type!
const driveIds = [...baselineDrives.ids];
const dropIds = [...baselineDrops.ids];
const lobIds = [...baselineLobs.ids];

const ballColors = [BALL_COLORS.orange, BALL_COLORS.pink, BALL_COLORS.neonGreen];
const ballColorBlocks = [];
ballColors.forEach((color) => {
  let name;
  if (color === BALL_COLORS.orange) {
    name = 'orange';
  } else if (color === BALL_COLORS.pink) {
    name = 'pink';
  } else {
    name = 'neongreen';
  }
  const dr = generateTrials(`ball-${name}-drive`, 2, DRIVE, { ballColor: color, courtColor: COURT_COLORS.default });
  const dp = generateTrials(`ball-${name}-drop`, 2, DROP, { ballColor: color, courtColor: COURT_COLORS.default });
  const lb = generateTrials(`ball-${name}-lob`, 2, LOB, { ballColor: color, courtColor: COURT_COLORS.default });
  Object.assign(allComponents, dr.components, dp.components, lb.components);
  ballColorBlocks.push({
    order: 'random',
    components: [...dr.ids, ...dp.ids, ...lb.ids],
  });
});

/*
const courtColors = [COURT_COLORS.gray, COURT_COLORS.red];
const courtColorBlocks = [];
courtColors.forEach((color) => {
 const name = color === COURT_COLORS.gray ? 'gray' : 'red';
 const dr = generateTrials(`court-${name}-drive`, 1, DRIVE, { ballColor: BALL_COLORS.neonYellow, courtColor: color });
 const dp = generateTrials(`court-${name}-drop`, 1, DROP, { ballColor: BALL_COLORS.neonYellow, courtColor: color });
 const lb = generateTrials(`court-${name}-lob`, 1, LOB, { ballColor: BALL_COLORS.neonYellow, courtColor: color });
 Object.assign(allComponents, dr.components, dp.components, lb.components);
 courtColorBlocks.push({
  order: 'random',
  components: [...dr.ids, ...dp.ids, ...lb.ids],
 });
});
*/
const courtColorBlocks = [];

// Load the current config to keep everything else intact
const currentConfig = JSON.parse(fs.readFileSync('public/basic-questionnaire-study/config.json', 'utf8'));

// Delete existing pickleball components (so we don't have lingering junk)
for (const key in currentConfig.components) {
  if (key.includes('pickleball-trial') || key.includes('baseline-') || key.includes('ball-') || key.includes('court-') || key.includes('pickleball-practice')) {
    delete currentConfig.components[key];
  }
}

// Add transition markdown files to the config registry so it knows what to load
allComponents['desc-drives'] = {
  type: 'markdown',
  path: 'basic-questionnaire-study/assets/desc-drives.md',
  response: [],
};
allComponents['desc-drops'] = {
  type: 'markdown',
  path: 'basic-questionnaire-study/assets/desc-drops.md',
  response: [],
};
allComponents['desc-lobs'] = {
  type: 'markdown',
  path: 'basic-questionnaire-study/assets/desc-lobs.md',
  response: [],
};
allComponents['desc-ball-colors'] = {
  type: 'markdown',
  path: 'basic-questionnaire-study/assets/desc-ball.md',
  response: [],
};
allComponents['desc-court-colors'] = {
  type: 'markdown',
  path: 'basic-questionnaire-study/assets/desc-court.md',
  response: [],
};

// Add the freshly generated components
Object.assign(currentConfig.components, allComponents);

// Construct the sequence
currentConfig.sequence = {
  order: 'fixed',
  components: [
    'introduction',
    'demographics',
    'descriptions',
    {
      order: 'random',
      components: practiceIds,
    },
    'desc-drives',
    {
      order: 'random',
      components: driveIds,
    },
    'desc-drops',
    {
      order: 'random',
      components: dropIds,
    },
    'desc-lobs',
    {
      order: 'random',
      components: lobIds,
    },
    'desc-ball-colors',
    {
      order: 'random',
      components: ballColorBlocks,
    },
    'desc-court-colors',
    {
      order: 'random',
      components: courtColorBlocks,
    },
    'postsurvey',
    'conclusion',
  ],
};

// Write the file
fs.writeFileSync('public/basic-questionnaire-study/config.json', JSON.stringify(currentConfig, null, 4));
console.log(`Generated config with ${Object.keys(allComponents).length} total trials!`);
