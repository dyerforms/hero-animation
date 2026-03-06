// Grid Fill Study — Neon Grammar (looping)
// Auto-regenerates continuously. Click to pause/resume. G to toggle grid. S to save.

let regions   = [];
let showGrid  = true;
let t         = 0;
let paused    = false;



// ── layout state ──
let colWidths        = [];
let rowHeights       = [];
let layoutCycleCount = 0;
let layoutChangeEvery;

let img;

const ANIM_DURATION = 110;
const REST_FRAMES   = 40;
const MAX_DELAY     = 0.5;

let restCounter = 0;
let resting     = false;

let color1 = "#ed1c24";
let color2 = "#ef23aa";
let color3 = "#0200E9";
let color4 = "#F6F3EB";
let color5 = "#0C0B14";

let COLS, ROWS;

const CANVAS_W = 900;
const CANVAS_H = 700;

const EMPTY   = 0;
const SOLID   = 1;
const H_LINES = 2;
const V_LINES = 3;

const MARGIN        = 0;
const LINE_SPACINGS = [5, 10];
const WEIGHTS       = [28, 12, 30, 30];

const COL_SIZE_OPTIONS = [5, 10, 25, 50, 75, 100, 150, 180];
const ROW_SIZE_OPTIONS = [7, 14, 35, 50, 70, 100, 140, 175];



function easeInOut(v) {
  return v < 0.5 ? 2 * v * v : -1 + (4 - 2 * v) * v;
}

function weightedRandom(weights) {
  let total = weights.reduce((a, b) => a + b, 0);
  let r = random(total);
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r < sum) return i;
  }
  return weights.length - 1;
}

function weightedSpan(max) {
  if (max === 1) return 1;
  let weights = [];
  for (let i = 1; i <= max; i++) weights.push(pow(0.45, i - 1));
  let total = weights.reduce((a, b) => a + b, 0);
  let r = random(total);
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r < sum) return i + 1;
  }
  return max;
}

function colX(ci) {
  let x = 0;
  for (let i = 0; i < ci; i++) x += colWidths[i];
  return x;
}

function rowY(ri) {
  let y = 0;
  for (let i = 0; i < ri; i++) y += rowHeights[i];
  return y;
}

function generateLayout() {
  colWidths  = [];
  rowHeights = [];

  let totalW = 0;
  while (totalW < width) {
    let w = random(COL_SIZE_OPTIONS);
    if (totalW + w > width) w = width - totalW;  // ← was CANVAS_W
    colWidths.push(w);
    totalW += w;
  }

  let totalH = 0;
  while (totalH < height) {
    let h = random(ROW_SIZE_OPTIONS);
    if (totalH + h > height) h = height - totalH;  // ← was CANVAS_H
    rowHeights.push(h);
    totalH += h;
  }
  COLS = colWidths.length;
  ROWS = rowHeights.length;
}

function generateRegions() {
  layoutCycleCount++;
  if (layoutCycleCount >= layoutChangeEvery) {
    generateLayout();
    layoutCycleCount = 0;
    layoutChangeEvery = floor(random(2, 4));
  }

  regions = [];
  let myColors = [color1, color4];

  let claimed = [];
  for (let ri = 0; ri < ROWS; ri++) {
    claimed[ri] = [];
    for (let ci = 0; ci < COLS; ci++) claimed[ri][ci] = false;
  }

  for (let ri = 0; ri < ROWS; ri++) {
    for (let ci = 0; ci < COLS; ci++) {
      if (claimed[ri][ci]) continue;

      let maxCols = 0;
      while (ci + maxCols < COLS && !claimed[ri][ci + maxCols]) maxCols++;

      let maxRows = 0;
      outer: while (ri + maxRows < ROWS) {
        for (let dc = 0; dc < maxCols; dc++) {
          if (claimed[ri + maxRows][ci + dc]) break outer;
        }
        maxRows++;
      }

      //let spanC    = weightedSpan(maxCols);
      //let spanR    = weightedSpan(maxRows);
      let spanC = 1;
let spanR = 1;
      let type     = weightedRandom(WEIGHTS);
      let spacing  = random(LINE_SPACINGS);
      let weight   = random([0.75, 1, 1.5, 2, 3]);
      let regColor = random(myColors);
      let fromEdge = random() < 0.5 ? 'start' : 'end';

      let posNorm = (ri / ROWS * 0.6) + (ci / COLS * 0.4);
      let delay   = constrain(posNorm * MAX_DELAY + random(-0.05, 0.05), 0, MAX_DELAY);

      regions.push({
        gridCol: ci, gridRow: ri, spanC, spanR,
        type, spacing, weight, regColor, fromEdge, delay
      });

      for (let dr = 0; dr < spanR; dr++)
        for (let dc = 0; dc < spanC; dc++)
          claimed[ri + dr][ci + dc] = true;
    }
  }
}

function localProgress(globalT, delay) {
  if (globalT <= delay) return 0;
  return constrain((globalT - delay) / (1.0 - delay), 0, 1);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  layoutChangeEvery = floor(random(4, 7));
  generateLayout();
  layoutCycleCount = 0;
  generateRegions();
  t = 0;
  resting = false;
  restCounter = 0;
}

function draw() {
  if (!paused) {
    if (resting) {
      restCounter++;
      if (restCounter >= REST_FRAMES) {
        generateRegions();
        t = 0;
        resting = false;
        restCounter = 0;
      }
    } else {
      t += 1 / ANIM_DURATION;
      if (t >= 1) {
        t = 1;
        resting = true;
        restCounter = 0;
      }
    }
  }

  background(color5);

  for (let reg of regions) {
    let x = colX(reg.gridCol);
    let y = rowY(reg.gridRow);
    let w = 0;
    for (let dc = 0; dc < reg.spanC; dc++) w += colWidths[reg.gridCol + dc];
    let h = 0;
    for (let dr = 0; dr < reg.spanR; dr++) h += rowHeights[reg.gridRow + dr];

    let et = easeInOut(localProgress(t, reg.delay));
    let ix = x + MARGIN;
    let iy = y + MARGIN;
    let iw = w - MARGIN * 2;
    let ih = h - MARGIN * 2;

    noStroke();

    if (reg.type === SOLID) {
      //blendMode(EXCLUSION);
      fill(reg.regColor);
      if (reg.fromEdge === 'start') {
        rect(ix, iy, iw, ih * et);
      } else {
        rect(ix, iy + ih * (1 - et), iw, ih * et);
      }

    } else if (reg.type === H_LINES) {
      //blendMode(EXCLUSION);
      stroke(reg.regColor);
      strokeWeight(reg.weight);
      let originY   = reg.fromEdge === 'start' ? iy : iy + ih;
      let sp        = reg.spacing;
      let lineCount = floor(ih / sp) - 1;
      for (let i = 1; i <= lineCount; i++) {
        let finalY   = iy + sp * i;
        let currentY = lerp(originY, finalY, et);
        line(ix, currentY, ix + iw, currentY);
      }

    } else if (reg.type === V_LINES) {
     //blendMode(EXCLUSION);
      stroke(reg.regColor);
      strokeWeight(reg.weight);
      let originX   = reg.fromEdge === 'start' ? ix : ix + iw;
      let sp        = reg.spacing;
      let lineCount = floor(iw / sp) - 1;
      for (let i = 1; i <= lineCount; i++) {
        let finalX   = ix + sp * i;
        let currentX = lerp(originX, finalX, et);
        line(currentX, iy, currentX, iy + ih);
      }
    }
  }
  //blendMode(BLEND);

  if (showGrid) {
    //blendMode(EXCLUSION);
    stroke(color4);
    strokeWeight(0.5);
    let x = 0;
    for (let c = 0; c <= COLS; c++) {
      line(x, 0, x, height);
      if (c < COLS) x += colWidths[c];
    }
    let y = 0;
    for (let r = 0; r <= ROWS; r++) {
      line(0, y, width, y);
      if (r < ROWS) y += rowHeights[r];
    }
  }
  //blendMode(BLEND);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateLayout();
  generateRegions();
}

function mousePressed() {
  paused = !paused;
}

function keyPressed() {
  if (key === 'g' || key === 'G') {
    showGrid = !showGrid;
  }
  if ((key === 's' || key === 'S') && paused) {
    let gridWasOn = showGrid;
    showGrid = false;
    redraw();
    saveCanvas('neon-grammar-grid', 'png');
    showGrid = gridWasOn;
  }
}