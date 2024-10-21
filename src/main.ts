import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

type ActionMode = "DRAWING" | "STICKER";
let currentMode: ActionMode = "DRAWING";
let currentThickness = 1;

//Interface Definitions
interface Displayable {
  display(context: CanvasRenderingContext2D): void;
}

interface ToolPreview extends Displayable {
  updatePosition(xPosition: number, yPosition: number): void;
}

interface StickerPlacer extends Displayable {
  updatePosition(xPosition: number, yPosition: number): void;
  addSticker(): void;
}

interface Point {
  xPosition: number;
  yPosition: number;
}

let toolPreview: (ToolPreview | StickerPlacer) | null =
  createToolPreview(currentThickness);
const stickers = ["😀", "🌈", "⭐"];

function createTitle(titleName: string) {
  const appTitle = document.createElement("h1"); //Creating title element
  appTitle.textContent = titleName;
  app.appendChild(appTitle);
}

function createButton(text: string, idName: string, onClick: () => void) {
  const newButton = document.createElement("button");
  newButton.textContent = text;
  newButton.id = idName;
  newButton.addEventListener("click", onClick);
  app.appendChild(newButton);
  return newButton;
}

function createStickerButton(
  sticker: string,
  displayList: Displayable[],
  context: CanvasRenderingContext2D
) {
  createButton(sticker, "", () => {
    currentMode = "STICKER";
    const rotation: number = getRandomRotationValue();
    toolPreview = createStickerPreview(rotation);
    const stickerPlacer = placeSticker(
      sticker,
      -1000,
      -1000,
      rotation,
      displayList,
      context
    );
    toolPreview = stickerPlacer;
    dispatchToolMovedEvent(-1000, -1000);
  });
}

function placeSticker(
  sticker: string,
  xPosition: number,
  yPosition: number,
  rotation: number,
  displayList: Displayable[],
  context: CanvasRenderingContext2D
): StickerPlacer {
  let placementPosition: { xPosition: number; yPosition: number } = {
    xPosition,
    yPosition,
  };
  return {
    display(context: CanvasRenderingContext2D): void {
      context.save();
      context.translate(
        placementPosition.xPosition,
        placementPosition.yPosition
      );
      context.rotate(rotation);
      context.font = "24px serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "black";
      context.fillText(sticker, 0, 0);
      context.restore();
    },
    updatePosition(xPosition: number, yPosition: number): void {
      placementPosition = { xPosition, yPosition };
    },
    addSticker(): void {
      displayList.push(this);
      dispatchDrawingChangedEvent(context, displayList);
      resetToolPreview();
    },
  };
}

function createStickerPreview(rotation: number): ToolPreview {
  let mousePosition: Point | null = null;
  return {
    display(context: CanvasRenderingContext2D): void {
      if (mousePosition === null) {
        return;
      }
      context.save();
      context.translate(mousePosition.xPosition, mousePosition.yPosition);
      context.rotate(rotation);
      context.strokeStyle = "black";
      context.strokeRect(-12, -12, 24, 24);
      context.restore();
    },
    updatePosition(xPosition: number, yPosition: number): void {
      mousePosition = { xPosition, yPosition };
      dispatchToolMovedEvent(xPosition, yPosition);
    },
  };
}

function getRandomRotationValue(): number {
  return Math.random() * Math.PI * 2;
}

function resetToolPreview() {
  currentMode = "DRAWING";
  toolPreview = createToolPreview(currentThickness);
}

function setupStickers(
  displayList: Displayable[],
  context: CanvasRenderingContext2D
) {
  createButton("Add Custom Sticker", "addCustomSticker", () => {
    const newSticker = prompt("Enter custom sticker: ", "");
    if (newSticker != null) {
      stickers.push(newSticker);
      createStickerButton(newSticker, displayList, context);
    }
  });
  stickers.forEach((sticker) =>
    createStickerButton(sticker, displayList, context)
  );
}

function createCanvasAndButtons(inputWidth: number, inputHeight: number) {
  const userIsDrawing: boolean = false;
  const displayList: Displayable[] = []; //Array of all drawn Drawings
  const redoStack: Displayable[] = [];
  const currentPoints: Point[] = [];

  const canvas = document.createElement("canvas");
  canvas.id = "canvasMain"; //Adding ID so that style.css can access it
  canvas.width = inputWidth;
  canvas.height = inputHeight;
  canvas.style.cursor = "none";
  const canvasContext = canvas.getContext("2d"); //2D Context is what is used to perform actual drawing operations
  if (canvasContext === null) {
    return;
  }

  setupClearButton(canvasContext, displayList, redoStack);
  setupUndoAndRedoButtons(canvasContext, displayList, redoStack);
  setupExportButton(displayList);
  setupDrawModeButtons();

  app.appendChild(canvas);

  setupStickers(displayList, canvasContext);
  setupCanvasEventHandlers(
    canvas,
    canvasContext,
    currentPoints,
    displayList,
    redoStack,
    userIsDrawing
  );
}

function setupDrawModeButtons() {
  const markerButton = createButton("Red Marker", "marker", () => {
    currentThickness = 5;
    toolPreview = createToolPreview(5);
    currentMode = "DRAWING";
    markerButton.disabled = true;
    pencilButton.disabled = false;
  });
  const pencilButton = createButton("Pencil", "pencil", () => {
    currentThickness = 1;
    toolPreview = createToolPreview(1);
    currentMode = "DRAWING";
    markerButton.disabled = false;
    pencilButton.disabled = true;
  });

  markerButton.disabled = false;
  pencilButton.disabled = true;
}

function setupClearButton(
  context: CanvasRenderingContext2D,
  displayList: Displayable[],
  redoStack: Displayable[]
) {
  createButton("Clear", "clear", () =>
    clearCanvas(context, displayList, redoStack)
  );
}

function setupUndoAndRedoButtons(
  context: CanvasRenderingContext2D,
  displayList: Displayable[],
  redoStack: Displayable[]
) {
  createButton("Undo", "undo", () =>
    undoDrawing(context, displayList, redoStack)
  );
  createButton("Redo", "redo", () =>
    redoDrawing(context, displayList, redoStack)
  );
}

function setupExportButton(displayList: Displayable[]) {
  createButton("Export", "export", () => exportCanvas(displayList));
}

function exportCanvas(displayList: Displayable[]) {
  const canvasToExport = document.createElement("canvas");
  canvasToExport.width = 1024;
  canvasToExport.height = 1024;
  const exportContext = canvasToExport.getContext("2d");

  if (exportContext === null) {
    return;
  }

  exportContext.scale(4, 4); //Scaling up drawing due to larger canvas size
  displayList.forEach((drawing) => drawing.display(exportContext));

  const dataURL = canvasToExport.toDataURL("image/png");

  const downloadLink = document.createElement("a");
  downloadLink.href = dataURL;
  downloadLink.download = "drawing.png";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function createDrawing(points: Point[], lineThickness: number): Displayable {
  return {
    display(context: CanvasRenderingContext2D): void {
      if (points.length < 2) {
        return;
      }

      if (lineThickness > 1) {
        context.strokeStyle = "red";
      } else {
        context.strokeStyle = "black";
      }

      context.lineWidth = lineThickness;
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.xPosition, point.yPosition);
        } else {
          context.lineTo(point.xPosition, point.yPosition);
        }
      });
      context.stroke();
    },
  };
}

function createToolPreview(thickness: number) {
  let mousePosition: Point | null = null;
  return {
    display(canvasContext: CanvasRenderingContext2D): void {
      if (mousePosition === null) {
        return;
      }
      canvasContext.beginPath();
      canvasContext.arc(
        mousePosition.xPosition,
        mousePosition.yPosition,
        thickness / 2,
        0,
        Math.PI * 2
      );

      if (thickness > 1) {
        canvasContext.strokeStyle = "red";
      } else {
        canvasContext.strokeStyle = "black";
      }

      canvasContext.fillStyle = "rgba(150, 150, 150, 0.5)";
      canvasContext.fill();
      canvasContext.stroke();
    },
    updatePosition(xPosition: number, yPosition: number) {
      mousePosition = { xPosition, yPosition };
      dispatchToolMovedEvent(xPosition, yPosition);
    },
  };
}

function dispatchToolMovedEvent(xPosition: number, yPosition: number): void {
  const event = new CustomEvent("tool-moved", {
    detail: { xPosition, yPosition },
  });
  document.dispatchEvent(event);
}

function setupCanvasEventHandlers(
  canvas: HTMLCanvasElement,
  canvasContext: CanvasRenderingContext2D,
  currentPoints: Point[],
  displayList: Displayable[],
  redoStack: Displayable[],
  userIsDrawing: boolean
) {
  canvas.addEventListener("mousedown", (event) => {
    if (
      currentMode === "STICKER" &&
      toolPreview &&
      `addSticker` in toolPreview
    ) {
      toolPreview.addSticker();
    } else if (currentMode === "DRAWING") {
      userIsDrawing = true;
      currentPoints = [{ xPosition: event.offsetX, yPosition: event.offsetY }];
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (toolPreview) {
      toolPreview.updatePosition(event.offsetX, event.offsetY);
      if (currentMode === "DRAWING" && userIsDrawing) {
        const newPoint: Point = {
          xPosition: event.offsetX,
          yPosition: event.offsetY,
        };
        currentPoints.push(newPoint);
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        displayList.forEach((drawing) => drawing.display(canvasContext));
        const currentDrawing = createDrawing(currentPoints, currentThickness);
        currentDrawing.display(canvasContext);
      } else {
        dispatchDrawingChangedEventForPreviewTool(canvasContext, displayList);
      }
    }
  });

  canvas.addEventListener("mouseup", () => stopDrawing());
  canvas.addEventListener("mouseout", () => stopDrawing());

  function stopDrawing() {
    if (userIsDrawing === true) {
      redoStack.length = 0;
      userIsDrawing = false;
      const drawLine = createDrawing([...currentPoints], currentThickness);
      displayList.push(drawLine);
      currentPoints.length = 0;
    }
    dispatchDrawingChangedEvent(canvasContext, displayList);
  }
}

function dispatchDrawingChangedEventForPreviewTool(
  context: CanvasRenderingContext2D,
  displayList: Displayable[]
): void {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  displayList.forEach((drawing) => drawing.display(context));
  if (toolPreview && `display` in toolPreview) {
    toolPreview.display(context);
  }
}

function dispatchDrawingChangedEvent(
  context: CanvasRenderingContext2D,
  displayList: Displayable[]
): void {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height); //Clears the entire canvas
  displayList.forEach((drawing) => drawing.display(context));
}

function clearCanvas(
  context: CanvasRenderingContext2D,
  displayList: Displayable[],
  redoStack: Displayable[]
) {
  displayList.length = 0;
  redoStack.length = 0;
  dispatchDrawingChangedEvent(context, displayList);
}

function undoDrawing(
  context: CanvasRenderingContext2D,
  displayList: Displayable[],
  redoStack: Displayable[]
) {
  if (displayList.length > 0) {
    const lastDrawing = displayList.pop();
    if (lastDrawing != null) {
      redoStack.push(lastDrawing);
    }
    dispatchDrawingChangedEvent(context, displayList);
  }
}

function redoDrawing(
  context: CanvasRenderingContext2D,
  displayList: Displayable[],
  redoStack: Displayable[]
) {
  if (redoStack.length > 0) {
    const nextDrawing = redoStack.pop();
    if (nextDrawing != null) {
      displayList.push(nextDrawing);
    }
    dispatchDrawingChangedEvent(context, displayList);
  }
}

createTitle("MY STICKER SKETCHPAD");
createCanvasAndButtons(256, 256); //Creating a 256 x 256 canvas
