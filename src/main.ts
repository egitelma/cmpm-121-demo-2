import "./style.css";

//Const/page element creation
const APP_NAME = "Painting Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;
const heading = document.createElement("h1");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const export_btn = document.createElement("button");

const cmd_div = document.createElement("div");
const cmd_heading = document.createElement("h3");
const undo_btn = document.createElement("button");
const redo_btn = document.createElement("button");

const marker_div = document.createElement("div");
const marker_heading = document.createElement("h3");
const thin_btn = document.createElement("button");
const thick_btn = document.createElement("button");

interface StickerButton{
    div_container: HTMLDivElement,
    button_element: HTMLButtonElement,
    content: string,
    index: number
}
let stickers : string[] = ["❤", "💥", "✌"];
let sticker_btns : StickerButton[] = [];

const sticker_div = document.createElement("div");
const sticker_heading = document.createElement("h3");
sticker_div.append(sticker_heading);
for(let i=0; i<stickers.length; i++){
    addNewSticker(i);
}
const custom_sticker = document.createElement("button");

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

sticker_heading.innerHTML = "sticker type";
custom_sticker.innerHTML = "custom";
sticker_div.id = "sticker_div";
custom_sticker.id = "custom";

export_btn.id = "export";
export_btn.innerHTML = "export";

canvas.style.cursor = "none";

//Adding into the DOM
app.append(heading);
app.append(export_btn);
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

sticker_div.append(document.createElement("br"));
app.append(custom_sticker);

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
let marker_size = thin;
let marker = "marker";
let sticker = "sticker";
let sticker_type = stickers[0];
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
canvas.addEventListener("mouseup", () => {
    if (isDrawing) {
        canvas.dispatchEvent(drawingChanged);
        isDrawing = false;
    }
});

undo_btn.addEventListener("click", () => {
    undo();
})
redo_btn.addEventListener("click", () => {
    redo();
})

thin_btn.addEventListener("click", () => {
    thin_btn.classList.add("selected");
    if(marker_size == thick){
        marker_size = thin;
        thick_btn.classList.remove("selected");
    }
    if(mark_style == sticker){
        mark_style = marker;
        for(let stick_btn of sticker_btns){
            stick_btn.button_element.classList.remove("selected");
        }
    }
})
thick_btn.addEventListener("click", () => {
    thick_btn.classList.add("selected");
    if(marker_size == thin){
        marker_size = thick;
        thin_btn.classList.remove("selected");
    }
    if(mark_style == sticker){
        mark_style = marker;
        for(let stick_btn of sticker_btns){
            stick_btn.button_element.classList.remove("selected");
        }
    }
})

custom_sticker.addEventListener("click", () => {
    addCustomSticker();
});

export_btn.addEventListener("click", () => {
    let multiplier = 4;
    let new_canvas = document.createElement("canvas");
    new_canvas.width = width * multiplier;
    new_canvas.height = height * multiplier;
    let new_ctx = new_canvas.getContext("2d");
    new_ctx?.scale(multiplier, multiplier);
    updateDrawing(new_ctx);
    const anchor = document.createElement("a");
    anchor.href = new_canvas.toDataURL("image/png");
    anchor.download = "sketchpad_copy.png";
    anchor.click();
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

function addNewSticker(index : number){
    let new_sticker = addStickerInterface(index);
    addStickerEvent(new_sticker);
}

function addStickerInterface(index : number){
    let new_btn : StickerButton = {
        div_container: sticker_div,
        button_element: document.createElement("button"),
        content: stickers[index],
        index: index
    }
    new_btn.button_element.innerHTML = new_btn.content;
    sticker_btns.push(new_btn);
    sticker_div.append(new_btn.button_element);
    return new_btn;
}

function addStickerEvent(stick_btn : StickerButton){
    stick_btn.button_element.addEventListener("click", (e) => {
        stick_btn.button_element.classList.add("selected");
        sticker_type = stick_btn.content;
        if(mark_style == marker){
            mark_style = sticker;
            thin_btn.classList.remove("selected");
            thick_btn.classList.remove("selected");
        }
        else{
            for(let i=0; i<sticker_btns.length; i++){ //Jesus H. Christ.
                if(i != stick_btn.index){
                    sticker_btns[i].button_element.classList.remove("selected"); //ohhh yeah baby that's a chain if i've ever seen one
                }
            }
        }
    })
}

function addCustomSticker(){
    let emoji = prompt("Enter an emoji to use as a sticker");
    if(emoji != null && !stickers.includes(emoji)){
        stickers.push(emoji);
        addNewSticker(stickers.length-1);
    }
}
