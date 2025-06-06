import { FC, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
interface IShowcaseCanvasProps {
    style?: React.CSSProperties;
};
interface ILine {
    tool: string;
    points: number[];
}

const CANVAS_BASE_WIDTH=800;
const CANVAS_BASE_HEIGHT=600;

export const ShowcaseCanvas: FC<IShowcaseCanvasProps> = (props) => {
    const [lines, setLines] = useState<ILine[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size,setSize]=useState<{width:number,height:number}>({width:0,height:0});
    const [scale,setScale]=useState<{x:number,y:number}>({x:0,y:0});


    function onResize() {
        setSize({
          width: (containerRef.current?.offsetWidth ?? 0),
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
                width={size.width}
                height={size.height}
                scaleX={scale.x}
                scaleY={scale.y}
                className="wrapper">
                <Layer>
                  {lines.map((line, i) => (
                    <Line
                      key={i}
                      points={line.points}
                      stroke={"#000000"}
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
