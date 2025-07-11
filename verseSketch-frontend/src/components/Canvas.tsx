import { Image as KonvaImage } from "konva/lib/shapes/Image";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { CSSProperties, RefObject, useEffect, useMemo, useRef } from "react";
import { FC, useState } from "react";
import { Stage, Layer, Image } from "react-konva";
interface ICanvasProps {
	color: string;
	tool: string;
	brushSize: number;
	lines: RefObject<ILine[]>;
	style?: CSSProperties
};
interface Point {
	x: number;
	y: number
}

export interface ILine {
	tool: string;
	brushSize: number;
	color: string;
	points: Point[];
}

const CANVAS_BASE_WIDTH = 1200;
const CANVAS_BASE_HEIGHT = 800;

export const Canvas: FC<ICanvasProps> = (props) => {
	const isDrawing = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
	const [scale, setScale] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
	const lastPos = useRef<Point>({ x: 0, y: 0 });
	const baseBrushSize = 2.5;
	const baseEraserSize = 10;
	const imageRef = useRef<KonvaImage>(null);
	const drawingRef=useRef<number>(0);
	

	const { canvas, context } = useMemo(() => {
		const canvas = document.createElement('canvas');
		canvas.width = CANVAS_BASE_WIDTH;
		canvas.height = CANVAS_BASE_HEIGHT;
		const context = canvas.getContext('2d');
		if (!context)
			return { canvas, context };
		context.lineJoin = 'round';
		context.lineCap = 'round'
		context.imageSmoothingEnabled=false;
		return { canvas, context };
	}, []);

	function drawTo(point: Point) {
		if (!isDrawing.current || !context) {
			return;
		}
		const image = imageRef.current;
		context.globalCompositeOperation = props.tool === 'eraser' ? 'destination-out' : 'source-over';
		context.beginPath();
		context.moveTo(lastPos.current.x, lastPos.current.y);
		context.lineTo(point.x, point.y);
		context.closePath();
		context.stroke();
		lastPos.current = point;
		image?.getLayer()?.batchDraw();
		props.lines.current[props.lines.current.length - 1].points.push(point);
	}

	function colorStrToHex(hex:string):string {
		hex = hex.replace(/^#/, '');
		hex+="ff";
		return hex;
	}


	function getPixelColor(point:Point,data:Uint32Array):string {
		let index=Math.floor(point.y)*CANVAS_BASE_WIDTH+Math.floor(point.x);
		return data[index].toString(16);
	}

	function setPixelColor(point:Point,color:number,imageData:ImageData) {
		let index=(Math.floor(point.y)*CANVAS_BASE_WIDTH+Math.floor(point.x))*4;
		imageData.data[index]=(color>>24);
		imageData.data[index+1]=((color>>16)%0xFF00);
		imageData.data[index+2]=((color>>8)%0xFFFF00);
		imageData.data[index+3]=(color%0xFFFFFF00);
	}

	function checkColors(c:string,target:string,curr:string):boolean {
		return c==curr&&c!=target;
	}

	function floodFill(point: Point) {
		if (!context||!isDrawing.current)
			return;
		let imageData:ImageData=context.getImageData(0,0,CANVAS_BASE_WIDTH,CANVAS_BASE_HEIGHT);
		let targetColor=colorStrToHex(props.color);
		let data=new Uint32Array(imageData.data.buffer);
		let currColor=getPixelColor(point,data);
		console.log(props.color,currColor,targetColor);
		if (currColor===targetColor)
			return;
		let stack:Point[]=[point]
		while (stack.length>0)
		{
			let p:Point|undefined=stack.pop();
			if (!p)
				break;
			setPixelColor(p,parseInt(targetColor,16),imageData);
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
		if (props.tool === "eyedropper" || !context)
			return;
		isDrawing.current = true;
		context.lineWidth = props.tool == "eraser" ? baseEraserSize * props.brushSize : baseBrushSize * props.brushSize;
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
			drawTo({ x: point.x + 0.01, y: point.y });
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

	return (
		<div
			ref={containerRef}
			className="canvas-container"
			style={props.style}
		>
			<Stage
				className="wrapper"
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
}
