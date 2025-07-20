import { Image as KonvaImage } from "konva/lib/shapes/Image";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { CSSProperties, forwardRef, RefObject, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useState } from "react";
import { Stage, Layer, Image } from "react-konva";
interface ICanvasProps {
	color: string;
	tool: string;
	brushSize: number;
	lines: RefObject<ILine[]>;
	disabled:boolean;
	style?: CSSProperties
};
type Point = {
	x: number;
	y: number
}

export type CanvasHandle = {
	goBack:()=>void;
	goForward:()=>void;
}

export type ILine = {
	tool: string;
	brushSize: number;
	color: string;
	points: Point[];
}

const CANVAS_BASE_WIDTH = 1600;
const CANVAS_BASE_HEIGHT = 800;

export const Canvas = forwardRef<CanvasHandle,ICanvasProps>((props,ref) => {
	const isDrawing = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
	const [scale, setScale] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
	const lastPos = useRef<Point>({ x: 0, y: 0 });
	const baseBrushSize = 2.5;
	const baseEraserSize = 10;
	const imageRef = useRef<KonvaImage>(null);
	const drawingRef=useRef<number>(0);
	const backBuffer=useRef<ArrayBuffer[]>([]);
	const forwardRef=useRef<ArrayBuffer[]>([]);
	const bufferLimit=15;
	

	const { canvas, context } = useMemo(() => {
		const canvas = document.createElement('canvas');
		canvas.width = CANVAS_BASE_WIDTH;
		canvas.height = CANVAS_BASE_HEIGHT;
		const context = canvas.getContext('2d',{willReadFrequently:true});
		if (!context)
			return { canvas, context };
		context.lineJoin = 'round';
		context.lineCap = 'round'
		context.imageSmoothingEnabled=false;
		return { canvas, context };
	}, []);

	useImperativeHandle(ref,()=>({
		goBack:()=>{
			if (!context||backBuffer.current.length==0)
				return;
			let imageData=context.getImageData(0,0,CANVAS_BASE_WIDTH,CANVAS_BASE_HEIGHT);
			let curr=new Uint8Array(imageData.data).buffer;
			let prev=backBuffer.current.pop();
			if (!prev)
				return;
			let newData = new ImageData(new Uint8ClampedArray(prev), imageData.width, imageData.height);
			context.putImageData(newData,0,0);
			imageRef.current?.getLayer()?.batchDraw();
			props.lines.current.push({
				tool: "back",
				brushSize: 0,
				color: "",
				points: []
			});
			forwardRef.current.push(curr);
		},
		goForward:()=>{
			if (!context||forwardRef.current.length==0)
				return;
			let imageData=context.getImageData(0,0,CANVAS_BASE_WIDTH,CANVAS_BASE_HEIGHT);
			let curr=new Uint8Array(imageData.data).buffer;
			let forw=forwardRef.current.pop();
			if (!forw)
				return;
			let newData = new ImageData(new Uint8ClampedArray(forw), imageData.width, imageData.height);
			context.putImageData(newData,0,0);
			imageRef.current?.getLayer()?.batchDraw();
			props.lines.current.push({
				tool: "forward",
				brushSize: 0,
				color: "",
				points: []
			})
			backBuffer.current.push(curr);
		}
	}))

	function drawTo(point: Point) {
		if (!isDrawing.current || !context) {
			return;
		}
		const image = imageRef.current;
		context.beginPath();
		context.moveTo(lastPos.current.x, lastPos.current.y);
		context.lineTo(point.x, point.y);
		context.closePath();
		context.stroke();
		lastPos.current = point;
		image?.getLayer()?.batchDraw();
		props.lines.current[props.lines.current.length - 1].points.push(point);
	}

	function colorStrToHex(hex:string):number {
		hex = hex.replace(/^#/, '');
		hex+="ff";
		return parseInt(hex,16);
	}


	function getPixelColor(point:Point,data:DataView):number {
		let index=(Math.floor(point.y)*CANVAS_BASE_WIDTH+Math.floor(point.x))*4;
		let res=data.getUint32(index,false);
		return res;
	}

	function setPixelColor(point:Point,color:number,data:DataView) {
		let index=(Math.floor(point.y)*CANVAS_BASE_WIDTH+Math.floor(point.x))*4;
		data.setUint32(index,color);
	}

	function checkColors(c:number,target:number,curr:number):boolean {
		return c==curr&&c!=target;
	}

	function floodFill(point: Point) {
		if (!context||!isDrawing.current)
			return;
		let imageData:ImageData=context.getImageData(0,0,CANVAS_BASE_WIDTH,CANVAS_BASE_HEIGHT);
		let targetColor=colorStrToHex(props.color);
		let data=new DataView(imageData.data.buffer);
		let currColor=getPixelColor(point,data);
		if (currColor===targetColor)
			return;
		let stack:Point[]=[point]
		while (stack.length>0)
		{
			let p:Point|undefined=stack.pop();
			if (!p)
				break;
			setPixelColor(p,targetColor,data);
			const neighbors = [
				{ x: p.x + 1, y: p.y },
				{ x: p.x - 1, y: p.y },
				{ x: p.x, y: p.y + 1 },
				{ x: p.x, y: p.y - 1 }
			];
			for (const n of neighbors) {
				if (n.x < 0 || n.x >= CANVAS_BASE_WIDTH || n.y < 0 || n.y >= CANVAS_BASE_HEIGHT) 
					continue;
				const neighborColor = getPixelColor(n, data);
				if (checkColors(neighborColor, targetColor, currColor)) {
					stack.push(n);
				}
			}
		}
		context.putImageData(imageData,0,0);
		imageRef.current?.getLayer()?.batchDraw();
		isDrawing.current=false;
	}

	const handleMouseDown = (e: any) => {
		if (props.disabled||props.tool === "eyedropper" || !context)
			return;
		isDrawing.current = true;
		forwardRef.current=[];
		backBuffer.current.push(new Uint8Array(context.getImageData(0,0,CANVAS_BASE_WIDTH,CANVAS_BASE_HEIGHT).data).buffer);
		if (backBuffer.current.length>bufferLimit)
			backBuffer.current.shift();
		context.lineWidth = props.tool == "eraser" ? baseEraserSize * props.brushSize : baseBrushSize * props.brushSize;
		context.globalCompositeOperation = props.tool === 'eraser' ? 'destination-out' : 'source-over';
		context.strokeStyle = props.color;
		const point = e.target.getStage().getPointerPosition();
		if (point) {
			point.x /= scale.x;
			point.y /= scale.y;
		}
		lastPos.current = point;
		props.lines.current = [...props.lines.current, {
			tool: props.tool,
			brushSize: props.brushSize,
			color: props.color,
			points: [point]
		}]
		if (props.tool=="bucket")
			floodFill(point);
		else{
			drawTo(point);
		}
	};

	const handleMouseUp = () => {
		isDrawing.current = false;
		clearTimeout(drawingRef.current);
	};

	const handleMouseMove = async (e: any) => {
		if (!isDrawing.current || !context) {
			return;
		}
		const stage: KonvaStage = e.target.getStage();
		const pos = stage.getPointerPosition() as Point;
		pos.x /= scale.x;
		pos.y /= scale.y;
		drawTo(pos);
	};

	function onResize() {
		setSize({
			width: containerRef.current?.offsetWidth ?? 0,
			height: containerRef.current?.offsetHeight ?? 0
		});
		setScale({
			x: containerRef.current?.offsetWidth ? containerRef.current.offsetWidth / CANVAS_BASE_WIDTH : 1,
			y: containerRef.current?.offsetHeight ? containerRef.current.offsetHeight / CANVAS_BASE_HEIGHT : 1
		});
	}

	useEffect(() => {
		onResize();
		window.addEventListener("resize", onResize);
		window.addEventListener("mouseup", (e: any) => { e.preventDefault(); isDrawing.current = false; });
		window.addEventListener("touchend", (_) => { isDrawing.current = false; });
		window.addEventListener("mousedown", (e: any) => e.preventDefault());
		// window.addEventListener("touchstart", (e:any)=>e.preventDefault());
		return () => {
			window.removeEventListener("resize", onResize);
			window.removeEventListener("mouseup", (e: any) => { e.preventDefault(); isDrawing.current = false; });
			window.removeEventListener("touchend", (_) => { isDrawing.current = false; });
			window.removeEventListener("mousedown", (e: any) => e.preventDefault());
			// window.removeEventListener("touchstart", (e:any)=>e.preventDefault());
		};
	}
		, []);

	let className=props.disabled? "wrapper disabled":"wrapper";
	return (
		<div
			ref={containerRef}
			className="canvas-container"
			style={props.style}
		>
			<Stage
				className={className}
				width={size.width}
				height={size.height}
				scaleX={scale.x}
				scaleY={scale.y}
				onMouseDown={handleMouseDown}
				onMousemove={handleMouseMove}
				onMouseup={handleMouseUp}
				onTouchStart={handleMouseDown}
				onTouchMove={handleMouseMove}
				onTouchEnd={handleMouseUp}
			>
				<Layer>
					{/* {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.tool=="pen"?line.brushSize*baseBrushSize:line.brushSize*baseEraserSize}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))} */}
					<Image
						ref={imageRef}
						image={canvas}
						x={0}
						y={0}
					/>
				</Layer>
			</Stage>
		</div>
	);
});
