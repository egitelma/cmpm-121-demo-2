import "./style.css";

//Const/page element creation
const APP_NAME = "Painting Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;
const heading = document.createElement("h1");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

//Defining properties
document.title = APP_NAME;
heading.innerHTML = APP_NAME;
canvas.id = "canvas";

//Point interface
interface Point {
    x: number,
    y: number
}

//Establishing some canvas variables
let width = canvas.width = 256;
let height = canvas.height = 256;
if(ctx != null){
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
}
let isDrawing = false;
let activeLine : Point[] = [];
let x : number, y : number = 0;
let points_arr : Point[][] = [];

//Adding into the DOM
app.append(heading);
app.append(canvas);

//Functions - I snagged these off the mousemove documentation: https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    activeLine = [];
    points_arr.push(activeLine);
    isDrawing = true;
});
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    addNewPt(x, y);
    x = e.offsetX;
    y = e.offsetY;
  }
});
canvas.addEventListener("mouseup", (e) => { //interestingly, in the example, this one uses window instead of canvas. Canvas works just fine though.
  if (isDrawing) {
    activeLine.push({x, y});
    drawingChanged(ctx);
    isDrawing = false;
  }
});

function drawLine(context, x1, y1, x2, y2) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.closePath();
}

function drawingChanged(context){
    clearCanvas(context);
    context.strokeStyle = "black";
    context.lineWidth = 1;
    redrawPts(context);
}

function clearCanvas(context){
    context.clearRect(0, 0, width, height);
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
}

function redrawPts(context){
    for(let activeLn of points_arr){
        let lastX = activeLn[0].x;
        let lastY = activeLn[0].y; //I know there's a better way to write these two lines but ARGH I can't remember what it was from lecture.
        for(let {x, y} of activeLn){ //Redraw all points
            drawLine(context, lastX, lastY, x, y);
            lastX = x;
            lastY = y;
        }
    }
}

function addNewPt(new_x : number, new_y : number){
    activeLine.push({x: new_x, y: new_y});
    drawingChanged(ctx);
}
