import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

//Step 3: Display list and observer
interface Point {
  xPosition: number;
  yPosition: number;
}

interface Line {
  points: Point[];
}

//Step 1: Initial non-interactive UI layout
function createTitle(titleName: string) {
  const appTitle = document.createElement("h1"); //Creating title element
  appTitle.textContent = titleName;
  app.appendChild(appTitle);
}

function createCanvasAndButton(inputWidth: number, inputHeight: number) {
  const canvas = document.createElement("canvas");
  canvas.id = "canvasMain"; //Adding ID so that style.css can access it
  canvas.width = inputWidth;
  canvas.height = inputHeight;
  app.appendChild(canvas);

  const canvasContext = canvas.getContext("2d"); //2D Context is what is used to perform actual drawing operations
  if (canvasContext === null) {
    return;
  }

  //Step 2: Simple Market Drawing
  let userIsDrawing: boolean = false;
  const linesList: Line[] = []; //Array of all drawn lines
  const redoStack: Line[] = [];
  let currentLine: Line = { points: [] };

  canvas.addEventListener("mousedown", (event) => {
    userIsDrawing = true;
    currentLine = {
      points: [{ xPosition: event.offsetX, yPosition: event.offsetY }],
    }; //Starting a new line
    linesList.push(currentLine); //Adding current line to linesList
  });

  canvas.addEventListener("mousemove", (event) => {
    if (userIsDrawing === false) {
      return;
    }
    const newPoint: Point = {
      xPosition: event.offsetX,
      yPosition: event.offsetY,
    };
    currentLine.points.push(newPoint); //Adding new points to currentLine being drawn
    dispatchDrawingChangedEvent(); //Call event to have it be drawn
  });

  canvas.addEventListener("mouseup", dispatchLine);
  canvas.addEventListener("mouseout", dispatchLine);

  function dispatchLine() {
    if (userIsDrawing === true) {
      redoStack.length = 0; //Clear redo upon new line being made
      userIsDrawing = false;
      currentLine = { points: [] }; //Reseting currentLine variable for new lines
      dispatchDrawingChangedEvent();
    }
  }

  function dispatchDrawingChangedEvent(): void {
    const event = new CustomEvent("drawing-changed", {
      detail: linesList,
    });
    canvas.dispatchEvent(event);
  }

  canvas.addEventListener("drawing-changed", (event) => {
    const customEvent = event as CustomEvent<Line[]>;
    canvasContext.clearRect(0, 0, canvas.width, canvas.height); //Clears the entire canvas
    customEvent.detail.forEach((line: Line) => {
      canvasContext.beginPath();
      line.points.forEach((point, index) => {
        if (index === 0) {
          canvasContext.moveTo(point.xPosition, point.yPosition);
        } else {
          canvasContext.lineTo(point.xPosition, point.yPosition);
        }
      });
      canvasContext.stroke();
    });
  });

  //Step 4: Undo and Redo Buttons
  function undoLine() {
    if (linesList.length > 0) {
      const lastLine = linesList.pop();
      if (lastLine != null) {
        redoStack.push(lastLine);
      }
      dispatchDrawingChangedEvent();
    }
  }

  function redoLine() {
    if (redoStack.length > 0) {
      const redoLine = redoStack.pop();
      if (redoLine != null) {
        linesList.push(redoLine);
      }
      dispatchDrawingChangedEvent();
    }
  }

  //Creating Buttons
  function createButton(text: string) {
    const newButton = document.createElement("button");
    newButton.textContent = text;
    app.appendChild(newButton);
    return newButton;
  }

  const clearButton = createButton("clear");
  clearButton.addEventListener("click", () => {
    linesList.length = 0;
    dispatchDrawingChangedEvent();
  });

  const undoButton = createButton("undo");
  undoButton.addEventListener("click", undoLine);
  const redoButton = createButton("redo");
  redoButton.addEventListener("click", redoLine);
}

createTitle("MY STICKER SKETCHPAD");
createCanvasAndButton(256, 256); //Creating a 256 x 256 canvas
