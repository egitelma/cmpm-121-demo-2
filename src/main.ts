import "./style.css";

//Const/page element creation
const APP_NAME = "Painting Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;
const heading = document.createElement("h1");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const cmd_div = document.createElement("div");
const cmd_heading = document.createElement("h3");
const undo_btn = document.createElement("button");
const redo_btn = document.createElement("button");

const marker_div = document.createElement("div");
const marker_heading = document.createElement("h3");
const thin_btn = document.createElement("button");
const thick_btn = document.createElement("button");

const sticker_div = document.createElement("div");
const sticker_heading = document.createElement("h3");
const stick1_btn = document.createElement("button");
const stick2_btn = document.createElement("button");
const stick3_btn = document.createElement("button");

//Defining properties
document.title = APP_NAME;
heading.innerHTML = APP_NAME;
canvas.id = "canvas";

undo_btn.innerHTML = "undo";
redo_btn.innerHTML = "redo";
cmd_heading.innerHTML = "commands";
cmd_div.id = "btn_div";

thin_btn.innerHTML = "thin";
thin_btn.classList.add("selected");
thick_btn.innerHTML = "thick";
marker_heading.innerHTML = "marker thickness";
marker_div.id = "marker_div";

stick1_btn.innerHTML = "❤";
stick2_btn.innerHTML = "💥";
stick3_btn.innerHTML = "✌";
sticker_heading.innerHTML = "sticker type";
sticker_div.id = "sticker_div";

canvas.style.cursor = "none";

//Adding into the DOM
app.append(heading);
app.append(canvas);
app.append(cmd_div);
app.append(marker_div);
app.append(sticker_div);

cmd_div.append(cmd_heading);
cmd_div.append(undo_btn);
cmd_div.append(redo_btn);

marker_div.append(marker_heading);
marker_div.append(thin_btn);
marker_div.append(thick_btn);

sticker_div.append(sticker_heading);
sticker_div.append(stick1_btn);
sticker_div.append(stick2_btn);
sticker_div.append(stick3_btn);

//Point interface
interface Point {
    x: number,
    y: number,
}

interface Mouse {
    x: number,
    y: number,
    draw(ctx): void;
}

class Sticker {
    type: string;
    location: Point;
    constructor(x : number, y : number, type : string){
        this.location = {x, y};
        this.type = type;
    }
    display(ctx : CanvasRenderingContext2D){
        ctx.fillStyle = "black";
        ctx.font = "48px monospace";
        ctx.fillText(this.type, this.location.x, this.location.y);
    }
    drag(new_x : number, new_y : number){
        this.location = {x: new_x, y: new_y};
    }
}

class Line {
    thickness: number;
    points_arr: Point[];
    constructor(start_x : number, start_y : number, thickness){
        let new_pt : Point = {x: start_x, y: start_y}
        this.points_arr = [];
        this.points_arr.push(new_pt);
        this.thickness = thickness;
    }
    display(ctx : CanvasRenderingContext2D){
        ctx.lineWidth = this.thickness;
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
let x : number = 0;
let y : number = 0;
let activeLine : Line | Sticker;
let lines_arr : (Line | Sticker)[] = [];
let redo_stack : (Line | Sticker)[] = [];
let thick = 5;
let thin = 1;
let stick1 = "❤";
let stick2 = "💥";
let stick3 = "✌";
let marker_size = thin;
let marker = "marker";
let sticker = "sticker";
let sticker_type = stick1;
let mark_style = "marker";
let drawingChanged = new Event("drawing-changed");
let toolMoved = new Event("tool-moved");
let mouse : Mouse = {
    x: 0,
    y: 0,
    draw: function(ctx){
        if(mark_style == marker){
            ctx.beginPath();
            ctx.lineWidth = thin;
            ctx.arc(this.x, this.y, marker_size, 0, Math.PI * 2);
            ctx.stroke();
        }
        else{
            ctx.fillStyle = "black";
            ctx.font = "50px monospace";
            ctx.fillText(sticker_type, this.x, this.y);
        }
    }
}

//Event listeners
canvas.addEventListener("drawing-changed", (e)=>{
    updateDrawing(ctx);
});
canvas.addEventListener("tool-moved", (e) => {
    updateDrawing(ctx);
    mouse.draw(ctx);
})
canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    if(mark_style == marker){
        activeLine = new Line(x, y, marker_size);
    }
    else{
        activeLine = new Sticker(x, y, sticker_type);
    }
    lines_arr.push(activeLine);
    isDrawing = true;
    if(redo_stack.length > 0) redo_stack = [];
});
canvas.addEventListener("mousemove", (e) => {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;
    if (isDrawing) {
        activeLine.drag(x, y);
        canvas.dispatchEvent(drawingChanged);
        x = e.offsetX;
        y = e.offsetY;
    }
    else{
        canvas.dispatchEvent(toolMoved);
    }
});
canvas.addEventListener("mouseup", (e) => {
    if (isDrawing) {
        // activeLine.drag(x, y);
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

thin_btn.addEventListener("click", (e) => {
    thin_btn.classList.add("selected");
    if(marker_size == thick){
        marker_size = thin;
        thick_btn.classList.remove("selected");
    }
    if(mark_style == sticker){
        mark_style = marker;
        stick1_btn.classList.remove("selected");
        stick2_btn.classList.remove("selected");
        stick3_btn.classList.remove("selected");
    }
})
thick_btn.addEventListener("click", (e) => {
    thick_btn.classList.add("selected");
    if(marker_size == thin){
        marker_size = thick;
        thin_btn.classList.remove("selected");
    }
    if(mark_style == sticker){
        mark_style = marker;
        stick1_btn.classList.remove("selected");
        stick2_btn.classList.remove("selected");
        stick3_btn.classList.remove("selected");
    }
})
//i will make this nicer later I JUST NEED TO GET IT DONE. sigh. feels bad man
stick1_btn.addEventListener("click", (e) => {
    stick1_btn.classList.add("selected");
    sticker_type = stick1;
    if(mark_style == marker){
        mark_style = sticker;
        thin_btn.classList.remove("selected");
        thick_btn.classList.remove("selected");
    }
    else{
        stick2_btn.classList.remove("selected");
        stick3_btn.classList.remove("selected");
    }
})
stick2_btn.addEventListener("click", (e) => {
    stick2_btn.classList.add("selected");
    sticker_type = stick2;
    if(mark_style == marker){
        mark_style = sticker;
        thin_btn.classList.remove("selected");
        thick_btn.classList.remove("selected");
    }
    else{
        stick1_btn.classList.remove("selected");
        stick3_btn.classList.remove("selected");
    }
})
stick3_btn.addEventListener("click", (e) => {
    stick3_btn.classList.add("selected");
    sticker_type = stick3;
    if(mark_style == marker){
        mark_style = sticker;
        thin_btn.classList.remove("selected");
        thick_btn.classList.remove("selected");
    }
    else{
        stick1_btn.classList.remove("selected");
        stick3_btn.classList.remove("selected");
    }
})

//Functions
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
