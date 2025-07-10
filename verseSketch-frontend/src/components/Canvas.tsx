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

const CANVAS_BASE_WIDTH = 400;
const CANVAS_BASE_HEIGHT = 300;

export const Canvas: FC<ICanvasProps> = (props) => {
	const isDrawing = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
	const [scale, setScale] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
	const lastPos = useRef<Point>({ x: 0, y: 0 });
	const baseBrushSize = 3;
	const baseEraserSize = 10;
	const imageRef = useRef<KonvaImage>(null);

	const { canvas, context } = useMemo(() => {
		const canvas = document.createElement('canvas');
		canvas.width = CANVAS_BASE_WIDTH;
		canvas.height = CANVAS_BASE_HEIGHT;
		const context = canvas.getContext('2d');
		if (!context)
			return { canvas, context };
		context.lineJoin = 'round';
		context.lineCap = 'round'
		return { canvas, context };
	}, []);

	function drawTo(point: Point) {
		if (!isDrawing.current || !context) {
			return;
		}

		const image = imageRef.current;

		context.globalCompositeOperation = props.tool === 'eraser' ? 'destination-out' : 'source-over';
		context.beginPath();
		context.getImageData
		context.moveTo(lastPos.current.x, lastPos.current.y);
		context.lineTo(point.x, point.y);
		context.closePath();
		context.stroke();

		lastPos.current = point;
		image?.getLayer()?.batchDraw();
		props.lines.current[props.lines.current.length - 1].points.push(point);
	}

	function hexToRGB(hex:string):number[] {
		hex = hex.replace(/^#/, '');
		if (hex.length === 3) {
			hex = hex.split('').map((char: string) => char + char).join('');
		}
		const bigint = parseInt(hex, 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;

		return [r,g,b,255];
	}


	function getPixelColor(point:Point,imageData:ImageData):number[] {
		let index=(Math.floor(point.y)*CANVAS_BASE_WIDTH+Math.floor(point.x))*4;
		// console.log(imageData.data[index+3]);
		return [imageData.data[index],imageData.data[index+1],imageData.data[index+2],imageData.data[index+3]];
	}

	function setPixelColor(point:Point,color:number[],imageData:ImageData) {
		let index=(Math.floor(point.y)*CANVAS_BASE_WIDTH+Math.floor(point.x))*4;
		imageData.data[index]=color[0];
		imageData.data[index+1]=color[1];
		imageData.data[index+2]=color[2];
		imageData.data[index+3]=color[3];
	}

	function floodFill(point: Point) {
		if (!context||!isDrawing.current)
			return;
		let imageData:ImageData=context.getImageData(0,0,CANVAS_BASE_WIDTH,CANVAS_BASE_HEIGHT);
		let targetColor=hexToRGB(props.color);
		let currColor=getPixelColor(point,imageData);
		console.log(props.color);
		console.log(currColor,targetColor);
		if (currColor.toString()===targetColor.toString())
			return;
		let queue:Point[]=[point];
		while (queue.length!=0)
		{
			if (queue.length>1000)
			{
				console.log("gg");
			}
			console.log(queue.length);
			let p:Point|undefined=queue.shift();
			if (!p)
				break;

			console.log((Math.floor(p.y)*CANVAS_BASE_WIDTH+Math.floor(p.x))*4);
			console.log(getPixelColor(p,imageData));
			setPixelColor(p,targetColor,imageData);
			console.log(getPixelColor(p,imageData));
			if (
				p.x + 1 < CANVAS_BASE_WIDTH &&
				getPixelColor({ x: p.x + 1, y: p.y }, imageData).toString() !== targetColor.toString() &&
				getPixelColor({ x: p.x + 1, y: p.y }, imageData).toString() === currColor.toString()
			)
				queue.push({ x: p.x + 1, y: p.y });
			if (
				p.x - 1 >= 0 &&
				getPixelColor({ x: p.x - 1, y: p.y }, imageData).toString() !== targetColor.toString() &&
				getPixelColor({ x: p.x - 1, y: p.y }, imageData).toString() === currColor.toString()
			)
				queue.push({ x: p.x - 1, y: p.y });
			if (
				p.y + 1 < CANVAS_BASE_HEIGHT &&
				getPixelColor({ x: p.x, y: p.y + 1 }, imageData).toString() !== targetColor.toString() &&
				getPixelColor({ x: p.x, y: p.y + 1 }, imageData).toString() === currColor.toString()
			)
				queue.push({ x: p.x, y: p.y + 1 });
			if (
				p.y - 1 >= 0 &&
				getPixelColor({ x: p.x, y: p.y - 1 }, imageData).toString() !== targetColor.toString() &&
				getPixelColor({ x: p.x, y: p.y - 1 }, imageData).toString() === currColor.toString()
			)
				queue.push({ x: p.x, y: p.y - 1 });
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
		else
			drawTo({ x: point.x + 0.01, y: point.y });
	};

	const handleMouseUp = () => {
		isDrawing.current = false;
	};

	const handleMouseMove = (e: any) => {
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
