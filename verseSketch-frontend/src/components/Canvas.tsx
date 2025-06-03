import { Vector2d } from "konva/lib/types";
import { CSSProperties, useEffect, useRef } from "react";
import { FC, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
interface ICanvasProps {
  style:CSSProperties
};
interface ILine {
    tool: string;
    points: number[];
}

const CANVAS_BASE_WIDTH=800;
const CANVAS_BASE_HEIGHT=600;

export const Canvas: FC<ICanvasProps> = (props) => {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState<ILine[]>([]);
  const isDrawing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size,setSize]=useState<{width:number,height:number}>({width:0,height:0});
  const [scale,setScale]=useState<{x:number,y:number}>({x:0,y:0});


  const handleMouseDown = (e:any) => {
    isDrawing.current = true;
    const point = e.target.getStage().getPointerPosition();
    if (point) {
      point.x=point.x/scale.x;
      point.y=point.y/scale.y;
    }
    setLines([...lines, { tool, points: [point.x, point.y] }]);
  };

  const handleMouseMove = (e:any) => {
    // no drawing - skipping
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
    // add point
    lastLine.points = [...lastLine.points,point?.x??0, point?.y??0];

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
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
    return () => {
      window.removeEventListener("resize", onResize);
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
        <Layer >
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#df4b26"
              strokeWidth={5}
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
