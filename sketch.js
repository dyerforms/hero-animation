// Grid Fill Study — Neon Grammar (looping)
// Auto-regenerates with crossfade. Click to pause/resume. G to toggle grid. S to save.

// Each "deck" bundles regions with the layout they were built against,
// so outgoing and incoming never share a colWidths/rowHeights array.

let current = { regions: [], colWidths: [], rowHeights: [], COLS: 0, ROWS: 0 };
let next    = { regions: [], colWidths: [], rowHeights: [], COLS: 0, ROWS: 0 };

let tCurr         = 0;
let tNext         = 0;
let transitioning = false;

let showGrid = true;
let paused   = false;

// ── layout cycle ──
let layoutCycleCount  = 0;
let layoutChangeEvery = 1;

// ── timing ──
const ANIM_DURATION = 150;  // frames to animate in (and out)
const REST_FRAMES   = 60;   // frames held at full before crossfade starts
const MAX_DELAY     = 0.5;

let restCounter = 0;
let resting     = false;

// ── palette ──
let color1 = "#ed1c24";
let color2 = "#ef23aa";
let color3 = "#0200E9";
let color4 = "#F6F3EB";
let color5 = "#0C0B14";

// ── cell types ──
const EMPTY   = 0;
const SOLID   = 1;
const H_LINES = 2;
const V_LINES = 3;

const MARGIN        = 0;
const LINE_SPACINGS = [5, 10];
const WEIGHTS       = [10, 25, 30, 35];

const COL_SIZE_OPTIONS = [10, 15, 75, 150, 300, 450];
const ROW_SIZE_OPTIONS = [14, 20, 100, 175, 350];


// ── math helpers ──
function easeInOut(v) {
  return v < 0.5 ? 2 * v * v : -1 + (4 - 2 * v) * v;
}

function easeIn(v) {
  return v * v;
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
  for (let i = 1; i <= max; i++) weights.push(pow(0.65, i - 1));
  let total = weights.reduce((a, b) => a + b, 0);
  let r = random(total);
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (r < sum) return i + 1;
  }
  return max;
}

// position helpers use the deck's own layout arrays
function deckColX(deck, ci) {
  let x = 0;
  for (let i = 0; i < ci; i++) x += deck.colWidths[i];
  return x;
}

function deckRowY(deck, ri) {
  let y = 0;
  for (let i = 0; i < ri; i++) y += deck.rowHeights[i];
  return y;
}


// ── layout + region building ──

function makeLayout() {
  let cw = [], rh = [];

  let totalW = 0;
  while (totalW < width) {
    let w = random(COL_SIZE_OPTIONS);
    if (totalW + w > width) w = width - totalW;
    cw.push(w);
    totalW += w;
  }

  let totalH = 0;
  while (totalH < height) {
    let h = random(ROW_SIZE_OPTIONS);
    if (totalH + h > height) h = height - totalH;
    rh.push(h);
    totalH += h;
  }

  return { colWidths: cw, rowHeights: rh, COLS: cw.length, ROWS: rh.length };
}

// returns a complete self-contained deck: layout + regions
function buildDeck() {
  layoutCycleCount++;
  if (layoutCycleCount >= layoutChangeEvery) {
    layoutCycleCount  = 0;
    layoutChangeEvery = floor(random(1, 3));
  }

  let layout   = makeLayout();
  let cw       = layout.colWidths;
  let rh       = layout.rowHeights;
  let COLS     = layout.COLS;
  let ROWS     = layout.ROWS;
  let myColors = [color1, color4];
  let result   = [];

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

      let spanC    = weightedSpan(maxCols);
      let spanR    = weightedSpan(maxRows);
      let type     = weightedRandom(WEIGHTS);
      let spacing  = random(LINE_SPACINGS);
      let weight   = random([0.75, 1, 1.5, 2, 3]);
      let regColor = random(myColors);
      let fromEdge = random() < 0.5 ? 'start' : 'end';

      let posNorm = (ri / ROWS * 0.6) + (ci / COLS * 0.4);
      let delay   = constrain(posNorm * MAX_DELAY + random(-0.05, 0.05), 0, MAX_DELAY);

      result.push({
        gridCol: ci, gridRow: ri, spanC, spanR,
        type, spacing, weight, regColor, fromEdge, delay
      });

      for (let dr = 0; dr < spanR; dr++)
        for (let dc = 0; dc < spanC; dc++)
          claimed[ri + dr][ci + dc] = true;
    }
  }

	// at the end of buildDeck(), before the return
return { 
  regions: result, colWidths: cw, rowHeights: rh, COLS, ROWS,
  gridColor: random([color4])  // picked once, stable
};

  return { regions: result, colWidths: cw, rowHeights: rh, COLS, ROWS };
}


// ── drawing ──

function localProgress(globalT, delay) {
  if (globalT <= delay) return 0;
  return constrain((globalT - delay) / (1.0 - delay), 0, 1);
}

function drawDeck(deck, globalT, isOutgoing){
  for (let reg of deck.regions) {
    let x = deckColX(deck, reg.gridCol);
    let y = deckRowY(deck, reg.gridRow);




    let w = 0;
    for (let dc = 0; dc < reg.spanC; dc++) w += deck.colWidths[reg.gridCol + dc];
    let h = 0;
    for (let dr = 0; dr < reg.spanR; dr++) h += deck.rowHeights[reg.gridRow + dr];

    let progress = localProgress(globalT, reg.delay);
	 let et = isOutgoing ? easeIn(progress) : easeInOut(progress);
    let ix = x + MARGIN;
    let iy = y + MARGIN;
    let iw = w - MARGIN * 2;
    let ih = h - MARGIN * 2;

    noStroke();

    if (reg.type === SOLID) {
      fill(reg.regColor);
      if (reg.fromEdge === 'start') {
        rect(ix, iy, iw, ih * et);
      } else {
        rect(ix, iy + ih * (1 - et), iw, ih * et);
      }

    } else if (reg.type === H_LINES) {
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
}

function drawGrid(deck) {
    if (!showGrid) return;
  push();
  stroke(deck.gridColor);  // stable per deck
  strokeWeight(1.5);
  let x = 0;
  for (let c = 0; c <= deck.COLS; c++) {
    line(x, 0, x, height);
    if (c < deck.COLS) x += deck.colWidths[c];
  }
  let y = 0;
  for (let r = 0; r <= deck.ROWS; r++) {
    line(0, y, width, y);
    if (r < deck.ROWS) y += deck.rowHeights[r];
  }
pop();
}



// ── p5 lifecycle ──

function setup() {
  //createCanvas(windowWidth, windowHeight);
    createCanvas(720, 540);
  
  let canvas = document.querySelector('canvas');
 // canvas.style.width = '720px';
  //canvas.style.height = '540px';
  
  frameRate(60);
  current       = buildDeck();
  tCurr         = 0;
  transitioning = false;
  resting       = false;
  restCounter   = 0;
}

function draw() {


  if (!paused) {
    if (transitioning) {
      tCurr -= 1.5 / ANIM_DURATION;  // outgoing retracts
      tNext += 1 / ANIM_DURATION;  // incoming grows
      if (tCurr <= 0) {
        // swap — incoming becomes current
        current       = next;
        next          = {};
        tCurr         = tNext;
        transitioning = false;
        resting       = false;
        restCounter   = 0;
      }
    } else if (resting) {
      restCounter++;
      if (restCounter >= REST_FRAMES) {
        next          = buildDeck();
        tNext         = 0;
        transitioning = true;
      }
    } else {
      tCurr += 1 / ANIM_DURATION;
      if (tCurr >= 1) {
        tCurr       = 1;
        resting     = true;
        restCounter = 0;
      }
    }
  }

background(color5);

if (transitioning) drawingContext.globalAlpha = tCurr; // fade as it retracts
drawDeck(current, tCurr, transitioning);
drawingContext.globalAlpha = 1.0; // always reset before drawing incoming

drawGrid(transitioning ? next : current);
if (transitioning) drawDeck(next, tNext, false);
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  current       = buildDeck();
  tCurr         = 0;
  transitioning = false;
  resting       = false;
  restCounter   = 0;
}

//function mousePressed() {
 // paused = !paused;
//}

function keyPressed() {
  if (key === 'g' || key === 'G') showGrid = !showGrid;
  if (key === 'r' || key === 'R') saveGif('moving-grid', 4);
  if (key === 's' || key === 'S')  {
    showGrid = !showGrid;
  }
  if ((key === 's' || key === 'S')) {
    let gridWasOn = showGrid;
    showGrid = false;
    redraw();
    saveCanvas('moving-grid', 'png');
    showGrid = gridWasOn;
  }
}