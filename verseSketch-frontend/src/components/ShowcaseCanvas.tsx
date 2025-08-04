import { FC, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image } from "react-konva";
import { CANVAS_BASE_BRUSH_SIZE, CANVAS_BASE_ERASER_SIZE, CANVAS_BASE_HEIGHT, CANVAS_BASE_WIDTH, CANVAS_BUFFER_LIMIT, ILine, Point } from "./Canvas";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import { delay } from "../misc/MiscFunctions";
import { Spinner } from "./Spinner";

interface IShowcaseCanvasProps {
	style?: React.CSSProperties;
	lines: ILine[];
	loading: boolean;
	onFinishDrawing: RefObject<()=>void>;
	isShowcaseStarted: boolean;
};

export const ShowcaseCanvas: FC<IShowcaseCanvasProps> = (props) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
	const [scale, setScale] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
	const lastPos = useRef<Point>({ x: 0, y: 0 });
	const imageRef = useRef<KonvaImage>(null);
	const timeToDraw = 1500;
	const backBuffer = useRef<ArrayBuffer[]>([]);
	const forwardRef = useRef<ArrayBuffer[]>([]);


	const { canvas, context } = useMemo(() => {
		const canvas = document.createElement('canvas');
		canvas.width = CANVAS_BASE_WIDTH;
		canvas.height = CANVAS_BASE_HEIGHT;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context)
			return { canvas, context };
		context.lineJoin = 'round';
		context.lineCap = 'round'
		context.imageSmoothingEnabled = false;
		return { canvas, context };
	}, []);

	function goBack() {
		if (!context || backBuffer.current.length == 0)
			return;
		let imageData = context.getImageData(0, 0, CANVAS_BASE_WIDTH, CANVAS_BASE_HEIGHT);
		let curr = new Uint8Array(imageData.data).buffer;
		let prev = backBuffer.current.pop();
		if (!prev)
			return;
		let newData = new ImageData(new Uint8ClampedArray(prev), imageData.width, imageData.height);
		context.putImageData(newData, 0, 0);
		imageRef.current?.getLayer()?.batchDraw();
		forwardRef.current.push(curr);
	}
	function goForward() {
		if (!context || forwardRef.current.length == 0)
			return;
		let imageData = context.getImageData(0, 0, CANVAS_BASE_WIDTH, CANVAS_BASE_HEIGHT);
		let curr = new Uint8Array(imageData.data).buffer;
		let forw = forwardRef.current.pop();
		if (!forw)
			return;
		let newData = new ImageData(new Uint8ClampedArray(forw), imageData.width, imageData.height);
		context.putImageData(newData, 0, 0);
		imageRef.current?.getLayer()?.batchDraw();
		backBuffer.current.push(curr);
	}

	function drawTo(point: Point) {
		if (!context) {
			return;
		}
		context.beginPath();
		context.moveTo(lastPos.current.x, lastPos.current.y);
		context.lineTo(point.x, point.y);
		context.closePath();
		context.stroke();
		lastPos.current = point;
	}

	function colorStrToHex(hex: string): number {
		hex = hex.replace(/^#/, '');
		hex += "ff";
		return parseInt(hex, 16);
	}


	function getPixelColor(point: Point, data: DataView): number {
		let index = (Math.floor(point.y) * CANVAS_BASE_WIDTH + Math.floor(point.x)) * 4;
		let res = data.getUint32(index, false);
		return res;
	}

	function setPixelColor(point: Point, color: number, data: DataView) {
		let index = (Math.floor(point.y) * CANVAS_BASE_WIDTH + Math.floor(point.x)) * 4;
		data.setUint32(index, color);
	}

	function checkColors(c: number, target: number, curr: number): boolean {
		return c == curr && c != target;
	}

	function floodFill(point: Point, color: string) {
		if (!context)
			return;
		let imageData: ImageData = context.getImageData(0, 0, CANVAS_BASE_WIDTH, CANVAS_BASE_HEIGHT);
		let targetColor = colorStrToHex(color);
		let data = new DataView(imageData.data.buffer);
		let currColor = getPixelColor(point, data);
		if (currColor === targetColor)
			return;
		let stack: Point[] = [point]
		while (stack.length > 0) {
			let p: Point | undefined = stack.pop();
			if (!p)
				break;
			setPixelColor(p, targetColor, data);
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
		context.putImageData(imageData, 0, 0);
		imageRef.current?.getLayer()?.batchDraw();
	}

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

	async function drawLines() {
		if (!context || !props.isShowcaseStarted || props.lines == null) {
			props.onFinishDrawing.current();
			return;
		}

		let pointsCount = 0;
		for (const line of props.lines)
			pointsCount += line.points.length;
		const batch = Math.ceil((pointsCount * 5) / timeToDraw);

		let start = Date.now();
		for (const line of props.lines) {
			if (line.tool === "forward") {
				goForward();
				await delay(150);
				continue;
			}

			if (line.tool === "back") {
				goBack();
				await delay(150);
				continue;
			}

			if (line.tool === "bucket") {
				floodFill(line.points[0], line.color);
				await delay(150);
				continue;
			}


			forwardRef.current = [];
			backBuffer.current.push(new Uint8Array(context.getImageData(0, 0, CANVAS_BASE_WIDTH, CANVAS_BASE_HEIGHT).data).buffer);
			if (backBuffer.current.length > CANVAS_BUFFER_LIMIT)
				backBuffer.current.shift();
			context.lineWidth = line.tool == "eraser" ? CANVAS_BASE_ERASER_SIZE * line.brushSize : CANVAS_BASE_BRUSH_SIZE * line.brushSize;
			context.globalCompositeOperation = line.tool === 'eraser' ? 'destination-out' : 'source-over';
			context.strokeStyle = line.color;
			lastPos.current = line.points[0];
			let drew = 0;
			for (let i = 0; i < line.points.length; i++) {
				if (i == 0)
					continue;
				drawTo(line.points[i]);
				if (++drew == batch) {
					imageRef.current?.getLayer()?.batchDraw();
					drew = 0;
					await delay(5);
				}
			}
			drawTo(line.points[line.points.length - 1]);
			imageRef.current?.getLayer()?.batchDraw();
		}
		props.onFinishDrawing.current();
		console.log(Date.now() - start);
	}

	useEffect(() => {
		forwardRef.current = [];
		backBuffer.current = [];
		context?.clearRect(0, 0, CANVAS_BASE_WIDTH, CANVAS_BASE_HEIGHT);
		drawLines();
	}, [props.lines])

	useEffect(() => {
		onResize();
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("resize", onResize);
		};
	}
		, []);

	if (props.loading) {
		return (
			<div
				ref={containerRef}
				className="canvas-container disabled"
				style={props.style}>
				<Spinner />
			</div>
		)
	}

	return (
		<div
			ref={containerRef}
			className="canvas-container"
			style={props.style}>
			<Stage
				className="wrapper"
				width={size.width}
				height={size.height}
				scaleX={scale.x}
				scaleY={scale.y}>
				<Layer>
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
};
