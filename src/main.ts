import "./style.css";

//Const/page element creation
const APP_NAME = "Painting Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;
const heading = document.createElement("h1");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const btn_div = document.createElement("div");
const undo_btn = document.createElement("button");
const redo_btn = document.createElement("button"); //Getting a bit of a smell from this... Fowler says three strikes, though!

//Defining properties
document.title = APP_NAME;
heading.innerHTML = APP_NAME;
canvas.id = "canvas";
undo_btn.innerHTML = "undo";
redo_btn.innerHTML = "redo";
btn_div.id = "btn_div";

//Adding into the DOM
app.append(heading);
app.append(canvas);
app.append(btn_div);
btn_div.append(undo_btn);
btn_div.append(redo_btn);

//Point interface
interface Point {
    x: number,
    y: number,
}

//Thought we're not meant to have classes in this, I guess we're ditching that here? (For step 5, which explicitly asks for a class)
class Line {
    initial_x : number;
    initial_y : number;
    end_x : number;
    end_y : number;
    points_arr: Point[];
    constructor(start_x : number, start_y : number){
        let new_pt : Point = {x: start_x, y: start_y}
        this.points_arr = [];
        this.points_arr.push(new_pt);
    }
    display(ctx : CanvasRenderingContext2D){
        let last_pt : Point = this.points_arr[0];
        for(let current_pt of this.points_arr){
            this.drawLine(ctx, last_pt, current_pt); //wow that's WAY cleaner.
            last_pt = current_pt;
        }
    }
    drawLine(ctx: CanvasRenderingContext2D, point1: Point, point2: Point){
        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.stroke();
        ctx.closePath();
    }
    drag(new_x : number, new_y : number){
        let new_pt : Point = {x: new_x, y: new_y};
        this.points_arr.push(new_pt);
    }
}

//Establishing some canvas variables
let width = canvas.width = 256;
let height = canvas.height = 256;
if(ctx != null){
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
}
let isDrawing = false;
let x : number, y : number = 0;
let activeLine : Line;
let lines_arr : Line[] = [];
let redo_stack : Line[] = [];
let drawingChanged = new Event("drawingChanged");

//Functions - I snagged these off the mousemove documentation: https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event
canvas.addEventListener("drawingChanged", (e)=>{
    updateDrawing(ctx)
});
canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    activeLine = new Line(x, y);
    lines_arr.push(activeLine);
    isDrawing = true;
    if(redo_stack.length > 0) redo_stack = [];
});
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    activeLine.drag(x, y);
    canvas.dispatchEvent(drawingChanged);
    x = e.offsetX;
    y = e.offsetY;
  }
});
canvas.addEventListener("mouseup", (e) => { //interestingly, in the example, this one uses window instead of canvas. Canvas works just fine though.
  if (isDrawing) {
    activeLine.drag(x, y);
    canvas.dispatchEvent(drawingChanged);
    isDrawing = false;
  }
});

undo_btn.addEventListener("click", (e) => {
    undo();
})
redo_btn.addEventListener("click", (e) => {
    redo();
})

function updateDrawing(context){
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
    for(let line of lines_arr){
        line.display(context);
    }
}

function undo(){
    let last_line = lines_arr.pop();
    if(last_line != undefined){
        redo_stack.push(last_line);
        updateDrawing(ctx);
    }
}

function redo(){
    let last_line = redo_stack.pop();
    if(last_line != undefined){
        lines_arr.push(last_line);
        updateDrawing(ctx);
    }
}
