import { clone, mergeDeepRight, reduce } from 'ramda';
import { useDark } from '@vueuse/core';
import { sameDate } from '@/utils/date';
import type { CropTerm, LocationResource, LogResource, OperationTerm } from '@/data/resources';

type CanvasContext = CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;

interface Coordinates { x: number, y: number }
interface BoxCoordinates { origin: Coordinates, terminus: Coordinates }
interface BoxSize { width: number, height: number }
type BoxProperties = BoxCoordinates & BoxSize;

interface MarkerStyles {
  shadowColor: string,
  shadowBlur: number,
  shadowOffsetY: number,
  shadowOffsetX: number,
}

interface GridStyles {
  fill: string,
  stroke: string,
  lineWidth: number,
}
interface GridProperties extends BoxProperties, GridStyles {
  columns: number,
  rows: number,
  unit: number,
  markers: MarkerStyles,
}

interface AxisProperties<V> extends BoxProperties {
  values: V[],
  color: string,
  fontFamily: string,
}
interface BoardAxes<XData, YData> {
  x: AxisProperties<XData>,
  y: AxisProperties<YData>,
}
interface HighlightProperties {
  column: BoxCoordinates,
  row: BoxCoordinates,
  fill: string,
}
interface BoardProperties {
  width: number,
  height: number,
  axes: BoardAxes<Date, LocationResource>,
  grid: GridProperties,
  highlight: HighlightProperties,
  index: { x: number, y: number },
  style: {
    fill: string,
    stroke: string,
  },
}
interface AxisValues<XData, YData> {
  x: XData[],
  y: YData[],
}
interface GridOptions {
  unit?: number,
  yAxisWidth?: number,
  xAxisHeight?: number,
  lineWidth?: number,
  fill?: string,
  stroke?: string,
}
interface FontOptions {
  color?: string,
  fontFamily?: string,
}
interface LabelOptions {
  yAxisWidth?: number,
  xAxisHeight?: number,
  font?: FontOptions,
}
interface StyleOptions {
  fill?: string,
  stroke?: string,
  isDark?: boolean,
  grid?: GridOptions,
  highlight?: {
    column: number,
    row: number,
    fill?: string,
  },
  axes?: LabelOptions,
  markers?: {
    shadowColor?: string,
    shadowBlur?: number,
    shadowOffsetY?: number,
    shadowOffsetX?: number,
  },
}

interface StyleProperties {
  fill: string,
  stroke: string,
  isDark: boolean,
  font: {
    color: string,
    fontFamily: string,
  }
  grid: {
    unit: number,
    yAxisWidth: number,
    xAxisHeight: number,
    lineWidth: number,
    fill: string,
    stroke: string,
  },
  highlight: {
    column: number,
    row: number,
    fill: string,
  },
  axes: {
    yAxisWidth: number,
    xAxisHeight: number,
  },
  markers: MarkerStyles,
}

// Based on the length of one of the canvas axes, the margins along that axis,
// and an array of elements to display, this function returns a truncated
// shallow copy of the elements that will fit within the canvas along that axis.
function fitToGrid<T>(
  axisLength: number,
  offset: number,
  elements: T[],
  unit: number,
  index?: number,
): T[] {
  const gridLength = axisLength - offset;
  const gridElements = Math.floor(gridLength / unit);
  let startIndex = typeof index === 'number' ? Math.max(index, 0) : 0;
  let stopIndex = startIndex + gridElements;
  if (stopIndex >= elements.length) {
    startIndex = Math.max(elements.length - gridElements, 0);
    stopIndex = elements.length;
  }
  const truncatedElements = elements.slice(startIndex, stopIndex);
  return truncatedElements;
}

function lightDark<L, D>(light: L, dark: D): L|D {
  const isDark = useDark();
  return isDark ? dark : light;
}

const colorVars = {
  root: new Map([
    ['--color-background', '#ffffff'],
    ['--color-background-soft', '#f8f8f8'],
    ['--color-background-mute', '#f2f2f2'],
    ['--color-border', 'rgba(60, 60, 60, 0.12)'],
    ['--color-border-hover', 'rgba(60, 60, 60, 0.29)'],
    ['--color-box-shadow-1', '#484848b8'],
    ['--color-box-shadow-2', '#48484878'],
    ['--color-box-shadow-3', '#48484848'],
    ['--color-box-shadow-inverse-1', '#282828d8'],
    ['--color-box-shadow-inverse-2', '#282828a8'],
    ['--color-box-shadow-inverse-3', '#28282858'],
    ['--color-heading', '#2c3e50'],
    ['--color-text', 'rgba(60, 60, 60, 0.66)'],
    ['--section-gap', '160px'],
  ]),
  dark: new Map([
    ['--color-background', '#181818'],
    ['--color-background-soft', '#222222'],
    ['--color-background-mute', '#323232'],
    ['--color-border', 'rgba(84, 84, 84, 0.48)'],
    ['--color-border-hover', 'rgba(84, 84, 84, 0.65)'],
    ['--color-box-shadow-1', '#282828d8'],
    ['--color-box-shadow-2', '#282828a8'],
    ['--color-box-shadow-3', '#28282858'],
    ['--color-box-shadow-inverse-1', '#484848b8'],
    ['--color-box-shadow-inverse-2', '#48484878'],
    ['--color-box-shadow-inverse-3', '#48484848'],
    ['--color-heading', '#ffffff'],
    ['--color-text', 'rgba(235, 235, 235, 0.64)'],
  ]),
};
const getColorVar = (cssVar: string, isDark: boolean|undefined|null|'') =>
  (isDark && colorVars.dark.has(cssVar)
    ? colorVars.dark.get(cssVar)
    : colorVars.root.get(cssVar));

const gridStylesFallback = (style: StyleOptions): GridStyles => ({
  fill: getColorVar('--color-background-soft', style.isDark)
    || lightDark('#f4f4f4', '#222222'),
  stroke: getColorVar('--ff-c-green-transparent-2', style.isDark)
    || 'rgba(0, 189, 126, 0.3)',
  lineWidth: style.grid?.lineWidth || 1.5,
})

// Fallbacks for Style Options
const applyStyleFallbacks = (style: StyleOptions): StyleProperties => mergeDeepRight({
  fill: getColorVar('--color-background', style.isDark)
    || lightDark('#fcfcfc', '#181818'),
  stroke: getColorVar('--ff-c-green-transparent-2', style.isDark)
    || 'rgba(0, 189, 126, 0.3)',
  isDark: false,
  font: {
    color: getColorVar('--color-text', style.isDark)
      || lightDark('#rgba(60, 60, 60, 0.66)', 'rgba(235, 235, 235, 0.64)'),
    fontFamily: getColorVar('--ff-font-family', style.isDark)
      || `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, `
      + `Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
  },
  axes: {
    yAxisWidth: 240,
    xAxisHeight: 60,
  },
  grid: {
    unit: 40,
    yAxisWidth: 240,
    xAxisHeight: 60,
    ...gridStylesFallback(style),
  },
  highlight: {
    fill: getColorVar('--color-background-mute', style.isDark)
      || lightDark('#eaeaea','#323232'),
    column: -1,
    row: -1,
  },
  markers: {
    shadowColor: getColorVar('--color-box-shadow-3', style.isDark)
      || lightDark('#48484877', '#28282855'),
    shadowBlur: 3,
    shadowOffsetY: 1.5,
    shadowOffsetX: -3,
  },
}, style);

// Compute the board's dimensions and the range of values that can be displayed.
// Adjust the width and height to fit as many columns and rows as possible
// within the board's bounding box (ie, canvas + margins) w/o partially cutting
// off any columns or rows; the last column/row should be fully displayed.
export function computeBoardProperties(
  canvas: { width: number, height: number },
  values: AxisValues<Date, LocationResource>,
  index: { x: number, y: number },
  style?: StyleOptions,
): BoardProperties {
  const sureStyle = applyStyleFallbacks(style || {});
  const { axes: { yAxisWidth, xAxisHeight }, grid, markers, } = sureStyle;
  const dates = fitToGrid(
    canvas.width,
    yAxisWidth,
    values.x,
    grid.unit,
    index.x,
  );
  const locations = fitToGrid(
    canvas.height,
    xAxisHeight,
    values.y,
    grid.unit,
    index.y,
  );
  const columns = dates.length;
  const rows = locations.length;
  const gridWidth = columns * grid.unit;
  const gridHeight = rows * grid.unit;
  const boardWidth = yAxisWidth + gridWidth;
  const boardHeight = xAxisHeight + gridHeight;
  const { column: hlColIndex, row: hlRowIndex, fill } = sureStyle.highlight;
  const hlColOriginX = yAxisWidth + hlColIndex * grid.unit;
  const hlColTerminusX = hlColOriginX + grid.unit;
  const hlRowOriginY = xAxisHeight + hlRowIndex * grid.unit;
  const hlRowTerminusY = hlRowOriginY + grid.unit;
  const highlight = {
    fill,
    column: {
      origin: {
        x: hlColOriginX,
        y: xAxisHeight,
      },
      terminus: {
        x: hlColTerminusX,
        y: boardHeight,
      },
    },
    row: {
      origin: {
        x: yAxisWidth,
        y: hlRowOriginY,
      },
      terminus: {
        x: boardWidth,
        y: hlRowTerminusY,
      },
    },
  };
  const axes: BoardAxes<Date, LocationResource> = {
    x: {
      origin: { x: yAxisWidth, y: 0 },
      terminus: { x: boardWidth, y: xAxisHeight },
      width: gridWidth,
      height: xAxisHeight,
      values: dates,
      color: sureStyle.font.color,
      fontFamily: sureStyle.font.fontFamily,
    },
    y: {
      origin: { x: 0, y: xAxisHeight },
      terminus: { x: yAxisWidth, y: boardHeight },
      width: yAxisWidth,
      height: gridHeight,
      values: locations,
      color: sureStyle.font.color,
      fontFamily: sureStyle.font.fontFamily,
    },
  }
  return {
    width: boardWidth,
    height: boardHeight,
    grid: {
      width: gridWidth,
      height: gridHeight,
      unit: grid.unit,
      origin: { x: yAxisWidth, y: xAxisHeight },
      terminus: { x: boardWidth, y: boardHeight },
      rows,
      columns,
      lineWidth: grid.lineWidth,
      fill: grid.fill,
      stroke: grid.stroke,
      markers,
    },
    highlight,
    axes,
    index,
    style: {
      fill: sureStyle.fill,
      stroke: sureStyle.stroke,
    },
  };
}

export type OperationsByDate = {
  date: Date,
  operations: OperationTerm[],
  tasks: LogResource[],
};
export type DatesByLocation = {
  id: string,
  name: string,
  crop: CropTerm|null,
  dates: OperationsByDate[]
};
export type TaskMatrix = DatesByLocation[];

// Draw Farm Flow's main board.
export function drawBoard(
  ctx: CanvasContext,
  values: AxisValues<Date, LocationResource>,
  matrix: TaskMatrix,
  index: { x: number, y: number },
  style: StyleOptions,
): BoardProperties {
  const board = computeBoardProperties(ctx.canvas, values, index, style);
  if (ctx.canvas.height - board.height > board.grid.unit) {
    ctx.canvas.height = board.height + .5 * board.grid.unit;
  }
  const { axes, grid } = board;
  // Clear the canvas & apply a fill so previous paints don't show through.
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = board.style.fill;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawGrid(ctx, grid, board.highlight);
  labelAxisX(ctx, grid, axes.x);
  labelAxisY(ctx, grid, axes.y);
  plotTasks(ctx, board, matrix);
  return board;
}

/**
 * easeInOutQuad: Quadratic easing function for both entering and exiting.
 * @param x Absolute progress ratio from 0 (start) to 1 (end). In the case of an
 * animation, x would be the time variable, advancing linearly from the time it
 * begins to when it ends.
 * @returns Eased progress ratio from 0 (start) to 1 (end). In the case of an
 * animation, the return value would be the distance traveled expressed as a
 * fraction of the total distance it will travel.
 * @link https://easings.net/en#easeInOutQuad
 */
function easeInOutQuad(x: number): number {
  const y = x < 0.5
    ? 2 * x * x 
    : 1 - Math.pow(-2 * x + 2, 2) / 2;
  return y;
}

type translationAllCallback = (
  ctx: CanvasContext,
  board: BoardProperties,
  deltas: BoxSize & Coordinates,
) => void;
type translationEachCallback = (
  ctx: CanvasContext,
  board: BoardProperties,
  deltas: BoxSize & Coordinates,
  interval: {
    translateX: number, translateY: number,
    timestamp: DOMHighResTimeStamp,
    progress: number, easing: number,
  },
) => void;
interface TranslationParameters {
  to: { x: number, y: number },
  from: { x: number, y: number },
  duration?: number,
  afterAll?: translationAllCallback,
  afterEach?: translationEachCallback,
  beforeAll?: translationAllCallback,
  beforeEach?: translationEachCallback,
}

export function translateBoard(
  ctx: CanvasContext,
  values: AxisValues<Date, LocationResource>,
  matrix: TaskMatrix,
  translation: TranslationParameters,
  style: StyleOptions,
) {
  // The board properties for the translation's starting and ending points.
  const fromBoard = computeBoardProperties(ctx.canvas, values, translation.from, style);

  // Compute the offscreen canvas's board dimensions, which will be larger than
  // the main canvas b/c it must include all gridpoints from the translation's
  // starting to its ending position. The deltas of the x and y coordinates of
  // the index will indicate the direction and magnitude of that change...
  const dX = translation.to.x - translation.from.x;
  const dY = translation.to.y - translation.from.y;
  // ...meanwhilethe width and height deltas will indicate, in absolute terms,
  // just how much larger the offscreen canvas is compared to the main canvas.
  const deltas = {
    x: dX, y: dY,
    width: dX * fromBoard.grid.unit,
    height: dY * fromBoard.grid.unit,
  };
  const canvasDeltas = {
    width: ctx.canvas.width + Math.abs(deltas.width),
    height: ctx.canvas.height + Math.abs(deltas.height),
  };
  // Positive (+1), if dX or dY is positive. Negatative (-1) if it's negative.
  const signOfDx = dX !== 0 ? dX / Math.abs(dX) : 1;
  const signOfDy = dY !== 0 ? dY / Math.abs(dY) : 1;
  // The index will always be the lowest x and y values displayed, whether the
  // translation is going from highest to lowest, or vice versa. 
  const index = {
    x: Math.min(translation.to.x, translation.from.x),
    y: Math.min(translation.to.y, translation.from.y),
  };
  // The properties of the board rendered while animating the translation.
  const transBoard = computeBoardProperties(canvasDeltas, values, index, style);

  // Invoke the beforeAll() callback now that the deltas and board dimensions
  // have been calculated, but before the animation starts.
  if (typeof translation.beforeAll === 'function') {
    translation.beforeAll(ctx, transBoard, deltas);
  }

  let frame = 0;
  let starttime: DOMHighResTimeStamp = 0;
  const durationTotal = translation.duration || 512;
  function animate(timestamp: DOMHighResTimeStamp) {
    // Set the starttime if needed and calculate how much time has passed.
    if (starttime === 0) starttime = timestamp;
    const durationCurrent = timestamp - starttime;
    // Calculate the absolute progress ratio and the easing progress ratio.
    const progress = durationCurrent / durationTotal;
    const easing = easeInOutQuad(progress);
    // Easing for the x + y axes' translation origins specifically, the
    // translateX & translateY respectively, will differ whether the dX or dY
    // is positive or negative. If dY or dY is POSITIVE, it will represent the
    // progress so far, or in other words, the SUM of 0 + easing; if NEGATIVE,
    // it will represent the portion of the translation delta that yet remains,
    // that is, the DIFFERENCE of 1 - easing.
    const easingX = ((signOfDx - 1) / 2 + easing);
    const easingY = ((signOfDy - 1) / 2 + easing);

    // Mutable variable for determining the translation & clipping coordinates.
    let translateX = 0;
    let translateY = 0;
    let { width: clipW, height: clipH } = fromBoard.grid;
    const {
      origin: clipOrigin, terminus: clipTerminus,
    } = clone(fromBoard.grid);

    // If the board is translating along the X-AXIS, adjust the x-coordinate
    // passed to ctx.translate(x, y) and expand the coordinates of the clipping
    // box to include the X-AXIS labels, so they will be translated too.
    if (dX !== 0) {
      translateX = translateX - easingX * deltas.width;
      clipH = fromBoard.height;
      clipOrigin.y = 0;
    }

    // If the board is translating along the Y-AXIS, adjust the y-coordinate
    // passed to ctx.translate(x, y) and expand the coordinates of the clipping
    // box to include the Y-AXIS labels, so they will be translated too.
    if (dY !== 0) {
      translateY = translateY - easingY * deltas.height;
      clipW = fromBoard.width;
      clipOrigin.x = 0;
    }

  // Invoke the beforeEach() callback now that the translation coordinates and
  // easing have been calculated, but before clipping, translating, and drawing.
  if (typeof translation.beforeEach === 'function') {
      const cycle = { translateX, translateY, timestamp, progress, easing };
      translation.beforeEach(ctx, transBoard, deltas, cycle);
    }

    // Apply a background fill, b/c most of each fill is transparent and so
    // the gridlines and text will get smeared out otherwise.
    ctx.fillStyle = fromBoard.style.fill;
    ctx.fillRect(clipOrigin.x, clipOrigin.y, clipW, clipH);
    // Then save the context prior to clipping and translating.
    ctx.save();

    // Apply a clipping mask to the grid plus whichever label(s) may have moved.
    ctx.beginPath();
    ctx.moveTo(clipOrigin.x, clipOrigin.y);
    ctx.lineTo(clipTerminus.x, clipOrigin.y);
    ctx.lineTo(clipTerminus.x, clipTerminus.y);
    ctx.lineTo(clipOrigin.x, clipTerminus.y);
    ctx.clip();

    // Translate the board context accounting for the amount the grid has moved
    // along the x and/or y axes, as well as eased progress of the animation,
    // which has already been factored into the translation coordinates.
    ctx.translate(translateX, translateY);
    if (dX !== 0) labelAxisX(ctx, transBoard.grid, transBoard.axes.x);
    if (dY !== 0) labelAxisY(ctx, transBoard.grid, transBoard.axes.y);
    drawGrid(ctx, transBoard.grid);
    plotTasks(ctx, transBoard, matrix);

    // Restore the context to its prior state prior before the clipping and
    // translating operations, then just to be safe, transform the context back
    // to identity matrix while we're at it too.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();

    if (progress < 1) {
    // If the animation hasn't finished, call afterEach() and resume the loop.
      if (typeof translation.afterEach === 'function') {
        const cycle = { translateX, translateY, timestamp, progress, easing };
        translation.afterEach(ctx, transBoard, deltas, cycle);
      }
      frame = window.requestAnimationFrame(animate);
    } else {
    // Otherwise run the necessary cleanup, render the board at its final
    // coordinates, and invoke the afterAll() translation callback.
      window.cancelAnimationFrame(frame);
      ctx.restore();
      drawBoard(ctx, values, matrix, translation.to, style);
      if (typeof translation.afterAll === 'function') {
        translation.afterAll(ctx, transBoard, deltas);
      }
    }
  }

  // Initialize the animation loop.
  frame = window.requestAnimationFrame(animate);
}

function drawGrid(
  ctx: CanvasContext,
  grid: GridProperties,
  highlight?: HighlightProperties,
) {
  // The x + y coordinates where each line will start (origin) & end (terminus).
  const {
    origin: { x: originX, y: originY },
    terminus: { x: terminusX, y: terminusY },
  } = grid;
  // Before drawing, always save the context's state.
  ctx.save();

  // Draw the grid's background & exterior gridlines.
  ctx.fillStyle = grid.fill;
  ctx.fillRect(originX, originY, grid.width, grid.height);
  ctx.strokeStyle = grid.stroke;
  const outlineWidth = grid.lineWidth / 2;
  ctx.lineWidth = outlineWidth;
  ctx.strokeRect(
    originX - outlineWidth / 2,
    originY - outlineWidth / 2,
    grid.width + outlineWidth,
    grid.height + outlineWidth,
  );
  ctx.lineWidth = grid.lineWidth;

  // Draw the horizontal highlight if the cursor is within the canvas and falls
  // between the top and bottom edge of the grid area.
  const highlightRow = highlight
    && highlight.row.origin.y >= originY
    && highlight.row.terminus.y <= terminusY;
  if (highlightRow) {
    const { fill, row: { origin: { x, y } } } = highlight;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, grid.width, grid.unit);
  }

  // Draw the vertical highlight if the cursor is within the canvas and falls
  // between the left and right side of the grid area.
  const highlightColumn = highlight
    && highlight.column.origin.x >= originX
    && highlight.column.terminus.x <= terminusX;
  if (highlightColumn) {
    const { fill, column: { origin: { x, y } } } = highlight;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, grid.unit, grid.height);
  }

  // Finally, draw the gridlines:
  // First by looping through the horizontal gridlines...
  for (
    // ...starting from the top...
    let y = originY + grid.unit;
    // ...ending at the bottom...
    y < terminusY;
    // ...iterating through each line, spaced accordingly by grid units.
    y += grid.unit
  ) {
    ctx.beginPath();
    // Horizontal gridlines will have endpoints on the x-origin & x-terminus.
    ctx.moveTo(originX, y);
    ctx.lineTo(terminusX, y);
    ctx.stroke();
  }

  // Then the vertical gridlines...
  for (
    // ...starting from the left...
    let x = originX + grid.unit;
    // ...ending at the right...
    x < terminusX;
    // ...iterating through by grid units.
    x += grid.unit
  ) {
    ctx.beginPath();
    // Vertical gridlines will have endpoints on the y-origin & y-terminus.
    ctx.moveTo(x, originY);
    ctx.lineTo(x, terminusY);
    ctx.stroke();
  }
  // After all drawing operations complete, restore the context's original state.
  ctx.restore();
}

// Month format for the x-axis labels.
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long' });
// Reducer function derives the x-axis grid coordinates covered by each month.
const reduceDatesToMonths = reduce((
  months: Array<{ name: string, startCol: number, endCol: number }>,
  d: Date,
) => {
  const name = monthFmt.format(d);
  const prev = months[months.length - 1];
  if (!prev || prev.name !== name) {
    const startCol = prev?.endCol || 0;
    return [...months, { name, startCol, endCol: startCol + 1 }];
  }
  const endCol = prev.endCol + 1;
  return [
    ...months.slice(0, months.length - 1),
    { ...prev, endCol }
  ];
}, []);

function labelAxisX(
  ctx: CanvasContext,
  grid: GridProperties,
  axis: AxisProperties<Date>,
) {
  // Label the x-axis with the date numeral directly above each column.
  const dateLineheight = Math.floor(axis.height * (5 / 9));
  const dateFontSize = Math.floor(dateLineheight * (5 / 9));
  const dateBaseline = axis.height - Math.floor(dateLineheight * (1 / 3));
  const dateTextMarginLeft = grid.unit * .5;
  const { origin, values: dates } = axis;
  // Before drawing, always save the context's state.
  ctx.save();
  dates.forEach((d, i) => {
    const text = d.getDate().toString();
    const x = origin.x + i * grid.unit + dateTextMarginLeft;
    ctx.fillStyle = axis.color;
    ctx.font = `${dateFontSize}px ${axis.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, dateBaseline);
  });
  // Draw a bounding box around both month and date labels.
  ctx.strokeStyle = grid.stroke;
  ctx.strokeRect(origin.x, 0, dates.length * grid.unit, axis.height);

  // Add the months across the top, spread out over the date numerals.
  const months = reduceDatesToMonths(dates);
  const monthLineheight = Math.floor(axis.height * (3 / 9));
  const monthFontSize = Math.floor(monthLineheight * (2 / 3));
  const monthBaseline = monthLineheight - Math.floor(monthLineheight * (1 / 5));
  // Draw a horizontal rule between months and dates.
  ctx.beginPath();
  ctx.moveTo(origin.x, monthLineheight);
  ctx.lineTo(origin.x + dates.length * grid.unit, monthLineheight);
  ctx.stroke();
  months.forEach((month, i) => {
    const width = (month.endCol - month.startCol) * grid.unit;
    const bgX = origin.x + month.startCol * grid.unit;
    // Unless it's the first month, draw a vertical line as its left border to
    // separate it from the previous month, stopping at the top of the grid.
    if (i !== 0) {
      ctx.beginPath();
      ctx.moveTo(bgX, 0);
      ctx.lineTo(bgX, axis.height);
      ctx.stroke();
    }
    const textX = bgX + .5 * width;
    ctx.fillStyle = axis.color;
    ctx.font = `${monthFontSize}px ${axis.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(month.name, textX, monthBaseline);
  });
  // After all drawing operations complete, restore the context's original state.
  ctx.restore();
}

function labelAxisY(
  ctx: CanvasContext,
  grid: GridProperties,
  axis: AxisProperties<LocationResource>,
) {
  // Before drawing, always save the context's state.
  ctx.save();
  const { origin, values: locations } = axis;
  ctx.fillStyle = axis.color;
  ctx.font = `${grid.unit * .65}px ${axis.fontFamily}`;
  ctx.textAlign = 'end';
  const x = axis.width - 6;
  locations.forEach((loc, i) => {
    const y = origin.y + (i + 1) * grid.unit - grid.unit * .25;
    ctx.fillText(loc.name, x, y);
  });
  // After all drawing operations complete, restore the context's original state.
  ctx.restore();
}

function plotTasks (
  ctx: CanvasContext,
  board: BoardProperties,
  matrix: TaskMatrix,
) {
  const { grid, axes: { x, y } } = board;
  y.values.forEach((location, indexY) => {
    plotTasksByLocation(ctx, grid, x.values, matrix, location, indexY);
  });
}

function plotTasksByLocation(
  ctx: CanvasContext,
  grid: GridProperties,
  dateSeq: Date[],
  matrix: TaskMatrix,
  location: LocationResource,
  indexY: number,
) {
  const records = matrix.find((loc: DatesByLocation) => loc.id === location.id)?.dates || [];
  dateSeq.forEach((date, indexX) => {
    const rec = records.find((ops: OperationsByDate) => sameDate(ops.date, date));
    if (rec) plotTasksByDate(ctx, grid, rec.operations, indexX, indexY);
  });
}

function plotTasksByDate(
  ctx: CanvasContext,
  grid: GridProperties,
  operations: OperationTerm[],
  indexX: number,
  indexY: number,
) {
  ctx.save(); // Before drawing, always save the context state.

  // Derive the coordinates & dimensions for the circular marker.
  const centerX = grid.origin.x + (indexX + .5) * grid.unit;
  const centerY = grid.origin.y + (indexY + .5) * grid.unit;
  const radius = grid.unit * (11 / 30);
  const startAngle = 0;
  const endAngle = 2 * Math.PI;

  // Multiple operations on the same date must be staggered horizontally, so use
  // two tenths of the grid unit as the gap between each marker. Then calculate
  // the length from the left edge of the leftmost marker to the right edge of
  // the rightmost marker. It should be the diameter of just one marker, plus
  // the combined lenth of all gaps, w/ one less gap than there are markers.
  const gapCount = operations.length - 1;
  const gapSize = grid.unit * .2;
  const totalLength = 2 * radius + gapCount * gapSize;

  operations.forEach((a, i) => {
    // If the marker's index, i, is less than half the number of total operations,
    // it will be offset by a negative distance from center of the grid, if more
    // than half of operations.length it will be a positive value, and if exactly
    // half it will be zero.
    const offsetX = radius + i * gapSize - totalLength / 2;

    // Now draw the circle for the marker.
    ctx.fillStyle = a.color || 'tomato';
    ctx.beginPath();
    ctx.arc(centerX + offsetX, centerY, radius, startAngle, endAngle);

    // Apply a shadow to every marker.
    ctx.shadowColor = grid.markers.shadowColor;
    ctx.shadowBlur = grid.markers.shadowBlur;
    ctx.shadowOffsetX = grid.markers.shadowOffsetX;
    ctx.shadowOffsetY = grid.markers.shadowOffsetY;
    ctx.fill();

    // Reset shadow to default values.
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  });

  ctx.restore(); // Now that drawing has finished, restore the context state.
}
