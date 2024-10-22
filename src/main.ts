import "./style.css";

const APP_NAME = "Painting Canvas";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
// app.innerHTML = APP_NAME;

//Step 1: h1 element, canvas, canvas black border
const heading = document.createElement("h1");
heading.innerHTML = APP_NAME;
app.append(heading);

const canvas = document.createElement("canvas");
canvas.id = "canvas";
let width = canvas.width = 256;
let height = canvas.height = 256;
const ctx = canvas.getContext("2d");
if(ctx != null){
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
}
app.append(canvas);
