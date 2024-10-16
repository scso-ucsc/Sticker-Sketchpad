import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

//Step 1: Initial non-interactive UI layout
function createTitle(titleName: string) {
  const appTitle = document.createElement("h1"); //Creating title element
  appTitle.textContent = titleName;
  app.appendChild(appTitle);
}

function createCanvas(inputWidth: number, inputHeight: number) {
  const canvas = document.createElement("canvas");
  canvas.id = "canvasMain"; //Adding ID so that style.css can access it
  canvas.width = inputWidth;
  canvas.height = inputHeight;
  app.appendChild(canvas);
}

createTitle("MY STICKER SKETCHPAD");
createCanvas(256, 256); //Creating a 256 x 256 canvas
