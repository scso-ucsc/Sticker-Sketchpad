import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

type ActionMode = "DRAWING" | "STICKER";
let currentMode: ActionMode = "DRAWING";

//Step 5: Display Commands
interface Displayable {
  display(context: CanvasRenderingContext2D): void;
}

function createDrawing(points: Point[], lineThickness: number): Displayable {
  return {
    display(context: CanvasRenderingContext2D): void {
      if (points.length < 2) {
        return;
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

//Step 7: Tool Preview
interface ToolPreview extends Displayable {
  updatePosition(xPosition: number, yPosition: number): void;
}

function createToolPreview(thickness: number) {
  let mousePosition: { xPosition: number; yPosition: number } | null = null;
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
      canvasContext.fillStyle = "rgba(150, 150, 150, 0.5)";
      canvasContext.fill();
      canvasContext.strokeStyle = "black";
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

//Step 8: Multiple Stickers
interface StickerPlacer extends Displayable {
  updatePosition(xPosition: number, yPosition: number): void;
  addSticker(): void;
}

//Step 3: Display list and observer
interface Point {
  xPosition: number;
  yPosition: number;
}

//Step 1: Initial non-interactive UI layout
function createTitle(titleName: string) {
  const appTitle = document.createElement("h1"); //Creating title element
  appTitle.textContent = titleName;
  app.appendChild(appTitle);
}

function createCanvasAndButton(inputWidth: number, inputHeight: number) {
  //Step 6: Multiple Markers
  const thickLineButton = createButton("THICK", "thick");
  const thickButtonElement = document.getElementById(
    "thick"
  ) as HTMLButtonElement;
  thickLineButton.addEventListener("click", () => {
    currentThickness = 5;
    toolPreview = createToolPreview(5);
    thickButtonElement.disabled = true;
    thinButtonElement.disabled = false;
    currentMode = "DRAWING";
  });

  const thinLineButton = createButton("thin", "thin");
  const thinButtonElement = document.getElementById(
    "thin"
  ) as HTMLButtonElement;
  thinLineButton.addEventListener("click", () => {
    currentThickness = 1;
    toolPreview = createToolPreview(1);
    thickButtonElement.disabled = false;
    thinButtonElement.disabled = true;
    currentMode = "DRAWING";
  });

  thickButtonElement.disabled = false;
  thinButtonElement.disabled = true;

  createStickerButton("😀", "smilingSticker");
  createStickerButton("🌈", "rainbowSticker");
  createStickerButton("⭐", "starSticker");

  const canvas = document.createElement("canvas");
  canvas.id = "canvasMain"; //Adding ID so that style.css can access it
  canvas.width = inputWidth;
  canvas.height = inputHeight;
  canvas.style.cursor = "none";
  app.appendChild(canvas);

  const canvasContext = canvas.getContext("2d"); //2D Context is what is used to perform actual drawing operations
  if (canvasContext === null) {
    return;
  }

  //Step 2: Simple Marker Drawing
  let userIsDrawing: boolean = false;
  const displayList: Displayable[] = []; //Array of all drawn Drawings
  const redoStack: Displayable[] = [];
  let currentPoints: Point[] = [];
  let currentThickness = 1; //Initial Line Thickness
  let toolPreview: (ToolPreview | StickerPlacer) | null = createToolPreview(1);

  canvas.addEventListener("mousedown", (event) => {
    if (currentMode === "DRAWING") {
      userIsDrawing = true;
      currentPoints = [{ xPosition: event.offsetX, yPosition: event.offsetY }]; //Starting a new Drawing and adding it to currentPoints list
      const drawing = createDrawing(currentPoints, currentThickness); //Creating a Displayable object
      displayList.push(drawing);
    } else if (toolPreview && `addSticker` in toolPreview) {
      (toolPreview as StickerPlacer).addSticker();
      toolPreview = createToolPreview(currentThickness);
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (toolPreview) {
      toolPreview.updatePosition(event.offsetX, event.offsetY);
    }
    if (userIsDrawing === false) {
      dispatchDrawingChangedEventForPreviewTool(canvasContext);
    } else {
      const newPoint: Point = {
        xPosition: event.offsetX,
        yPosition: event.offsetY,
      };
      currentPoints.push(newPoint); //Adding new points to currentDrawing being drawn
      dispatchDrawingChangedEvent(); //Call event to have it be drawn
    }
  });

  canvas.addEventListener("mouseup", dispatchDrawing);
  canvas.addEventListener("mouseout", dispatchDrawing);

  function dispatchDrawing() {
    if (userIsDrawing === true) {
      redoStack.length = 0; //Clear redo upon new drawing being made
      userIsDrawing = false;
      currentPoints = []; //Reseting currentPoints variable for new points
      if (toolPreview) {
        toolPreview.updatePosition(-1000, -1000);
      }
      dispatchDrawingChangedEvent();
    }
  }

  function dispatchDrawingChangedEventForPreviewTool(
    context: CanvasRenderingContext2D
  ): void {
    context.clearRect(0, 0, canvas.width, canvas.height);
    displayList.forEach((drawing) => drawing.display(context));
    if (toolPreview && `display` in toolPreview) {
      toolPreview.display(context);
    }
  }

  function dispatchDrawingChangedEvent(): void {
    if (canvasContext) {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height); //Clears the entire canvas
      displayList.forEach((drawing) => drawing.display(canvasContext));
    }
  }

  function placeSticker(sticker: string, xPosition: number, yPosition: number) {
    let placementPosition: { xPosition: number; yPosition: number } = {
      xPosition,
      yPosition,
    };
    return {
      display(context: CanvasRenderingContext2D): void {
        context.font = "24px serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "black";
        context.fillText(
          sticker,
          placementPosition.xPosition,
          placementPosition.yPosition
        );
        context.fillStyle = "white";
      },
      updatePosition(xPosition: number, yPosition: number): void {
        placementPosition = { xPosition, yPosition };
      },
      addSticker(): void {
        displayList.push(this);
        if (canvasContext != null) {
          currentMode = "DRAWING";
          toolPreview = createToolPreview(currentThickness);
          dispatchDrawingChangedEventForPreviewTool(canvasContext);
        }
      },
    };
  }

  function createStickerButton(sticker: string, id: string) {
    const newStickerButton = document.createElement("button");
    newStickerButton.textContent = sticker;
    newStickerButton.id = id;
    app.appendChild(newStickerButton);

    newStickerButton.addEventListener("click", () => {
      currentMode = "STICKER";
      toolPreview = placeSticker(sticker, -1000, -1000);
      document.dispatchEvent(new CustomEvent("tool-moved"));
    });

    return newStickerButton;
  }

  //Step 4: Undo and Redo Buttons
  function undoDrawing() {
    if (displayList.length > 0) {
      const lastDrawing = displayList.pop();
      if (lastDrawing != null) {
        redoStack.push(lastDrawing);
      }
      dispatchDrawingChangedEvent();
    }
  }

  function redoDrawing() {
    if (redoStack.length > 0) {
      const nextDrawing = redoStack.pop();
      if (nextDrawing != null) {
        displayList.push(nextDrawing);
      }
      dispatchDrawingChangedEvent();
    }
  }

  const clearButton = createButton("clear", "clear");
  clearButton.addEventListener("click", () => {
    displayList.length = 0;
    redoStack.length = 0;
    dispatchDrawingChangedEvent();
  });

  const undoButton = createButton("undo", "undo");
  undoButton.addEventListener("click", undoDrawing);
  const redoButton = createButton("redo", "redo");
  redoButton.addEventListener("click", redoDrawing);
}

function createButton(text: string, idName: string) {
  const newButton = document.createElement("button");
  newButton.textContent = text;
  newButton.id = idName;
  app.appendChild(newButton);
  return newButton;
}

document.addEventListener("tool-moved", (event) => {
  const customEvent = event as CustomEvent<{
    xPosition: number;
    yPosition: number;
  }>;
  console.log(
    `${customEvent.detail.xPosition}, ${customEvent.detail.yPosition}`
  );
});

createTitle("MY STICKER SKETCHPAD");
createCanvasAndButton(256, 256); //Creating a 256 x 256 canvas
