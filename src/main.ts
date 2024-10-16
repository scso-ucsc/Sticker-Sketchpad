import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

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

  canvas.addEventListener("mousedown", (event) => {
    userIsDrawing = true;
    canvasContext.beginPath(); //Starts drawing
    canvasContext.moveTo(event.offsetX, event.offsetY);
  });

  canvas.addEventListener("mousemove", (event) => {
    if (userIsDrawing === false) {
      return;
    }
    canvasContext.lineTo(event.offsetX, event.offsetY); //Draws lines by connecting previous mouse position to the current one, lineTo() specifies where it ends
    canvasContext.stroke(); //Rendering lines onto the canvas
  });

  const stopDrawing = () => {
    userIsDrawing = false;
    canvasContext.closePath(); //Ends current drawing session
  };
  canvas.addEventListener("mouseout", stopDrawing);
  canvas.addEventListener("mouseup", stopDrawing);

  const clearButton = document.createElement("button"); //Creating Clear Button
  clearButton.textContent = "clear";
  app.appendChild(clearButton);

  clearButton.addEventListener("click", () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height); //Clears the entire canvas when clicked
  });
}

createTitle("MY STICKER SKETCHPAD");
createCanvasAndButton(256, 256); //Creating a 256 x 256 canvas
