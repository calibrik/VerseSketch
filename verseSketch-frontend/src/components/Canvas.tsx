import { Vector2d } from "konva/lib/types";
import { CSSProperties, RefObject, useEffect, useRef } from "react";
import { FC, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
interface ICanvasProps {
  color:string;
  tool:string;
  brushSize:number;
  lines:RefObject<ILine[]>;
  style?:CSSProperties
};
export interface ILine {
    tool: string;
    brushSize:number;
    color:string;
    points: number[];
}

const CANVAS_BASE_WIDTH=800;
const CANVAS_BASE_HEIGHT=600;

export const Canvas: FC<ICanvasProps> = (props) => {
  const [lines, setLines] = useState<ILine[]>([]);
  const isDrawing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size,setSize]=useState<{width:number,height:number}>({width:0,height:0});
  const [scale,setScale]=useState<{x:number,y:number}>({x:0,y:0});


  const handleMouseDown = (e:any) => {
    // e.preventDefault();
    isDrawing.current = true;
    const point = e.target.getStage().getPointerPosition();
    if (point) {
      point.x=point.x/scale.x;
      point.y=point.y/scale.y;
    }
    setLines((prevLines)=>[...prevLines, { tool: props.tool, color:props.color,brushSize:props.brushSize, points: [point.x, point.y] }]);
    props.lines.current = [...lines, { tool: props.tool, color:props.color,brushSize:props.brushSize, points: [point.x, point.y] }];
  };

  const handleMouseMove = (e:any) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point:Vector2d|null = stage.getPointerPosition();
    if (point) {
      point.x=point.x/scale.x;
      point.y=point.y/scale.y;
    }
    let lastLine = lines[lines.length - 1];
    lastLine.points = [...lastLine.points,point?.x??0, point?.y??0];
    lines[lines.length - 1]= lastLine;
    props.lines.current = lines;
    setLines([...lines]);
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) {
      return;
    }
    isDrawing.current = false;
    let lastLine = lines[lines.length - 1];
    if (lastLine.points.length >2) 
      return;

    lastLine.points = [...lastLine.points,lastLine.points[0],lastLine.points[1]];
    lines[lines.length - 1]= lastLine;
    props.lines.current = lines;
    setLines([...lines]);
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
    window.addEventListener("mouseup", (e:any)=>{e.preventDefault(); isDrawing.current = false;});
    window.addEventListener("touchend", (_)=>{isDrawing.current = false;});
    window.addEventListener("mousedown", (e:any)=>e.preventDefault());
    // window.addEventListener("touchstart", (e:any)=>e.preventDefault());
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mouseup", (e:any)=>{e.preventDefault(); isDrawing.current = false;});
      window.removeEventListener("touchend", (_)=>{isDrawing.current = false;});
      window.removeEventListener("mousedown", (e:any)=>e.preventDefault());
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
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.brushSize}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
