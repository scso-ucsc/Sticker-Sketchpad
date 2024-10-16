import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

//Step 5: Display Commands
interface Displayable {
  display(context: CanvasRenderingContext2D): void;
}

function createDrawing(points: Point[]): Displayable {
  return {
    display(context: CanvasRenderingContext2D): void {
      if (points.length < 2) {
        return;
      }
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
  const canvas = document.createElement("canvas");
  canvas.id = "canvasMain"; //Adding ID so that style.css can access it
  canvas.width = inputWidth;
  canvas.height = inputHeight;
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

  canvas.addEventListener("mousedown", (event) => {
    userIsDrawing = true;
    currentPoints = [{ xPosition: event.offsetX, yPosition: event.offsetY }]; //Starting a new Drawing and adding it to currentPoints list
    const drawing = createDrawing(currentPoints); //Creating a Displayable object
    displayList.push(drawing);
  });

  canvas.addEventListener("mousemove", (event) => {
    if (userIsDrawing === false) {
      return;
    }
    const newPoint: Point = {
      xPosition: event.offsetX,
      yPosition: event.offsetY,
    };
    currentPoints.push(newPoint); //Adding new points to currentDrawing being drawn
    dispatchDrawingChangedEvent(); //Call event to have it be drawn
  });

  canvas.addEventListener("mouseup", dispatchDrawing);
  canvas.addEventListener("mouseout", dispatchDrawing);

  function dispatchDrawing() {
    if (userIsDrawing === true) {
      redoStack.length = 0; //Clear redo upon new drawing being made
      userIsDrawing = false;
      currentPoints = []; //Reseting currentPoints variable for new points
      dispatchDrawingChangedEvent();
    }
  }

  function dispatchDrawingChangedEvent(): void {
    if (canvasContext) {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height); //Clears the entire canvas
      displayList.forEach((drawing) => drawing.display(canvasContext));
    }
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

  //Creating Buttons
  function createButton(text: string) {
    const newButton = document.createElement("button");
    newButton.textContent = text;
    app.appendChild(newButton);
    return newButton;
  }

  const clearButton = createButton("clear");
  clearButton.addEventListener("click", () => {
    displayList.length = 0;
    redoStack.length = 0;
    dispatchDrawingChangedEvent();
  });

  const undoButton = createButton("undo");
  undoButton.addEventListener("click", undoDrawing);
  const redoButton = createButton("redo");
  redoButton.addEventListener("click", redoDrawing);
}

createTitle("MY STICKER SKETCHPAD");
createCanvasAndButton(256, 256); //Creating a 256 x 256 canvas
