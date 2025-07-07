import { FC, useEffect, useRef, useState } from "react";
import { Canvas, ILine } from "../components/Canvas";
import { Col, ColorPicker, Divider, Flex, Row, Slider } from "antd";
import { StageCounter } from "../components/StageCounter";
import { DisabledColorPicker } from "../components/DisabledColorPicker";
import { getWidthLevel, WindowLevel } from "../misc/MiscFunctions";
import { BrushIcon, BucketIcon, EraserIcon, EyedropperIcon } from "../components/Icons";
import { SubmitButton } from "../components/buttons/SubmitButton";
import { PlayerCompleteCounter } from "../components/PlayerCompleteCounter";
import { Timer } from "../components/Timer";
import { useRecentColorsContext } from "../components/RecentColorsProvider";
import { ToolButton } from "../components/buttons/ToolButton";

interface IDrawingPageProps {};

export const DrawingPage: FC<IDrawingPageProps> = (_) => {
    const [color, setColor] = useState<string>("#000000");
    const [tool, setTool] = useState<string>("pen");
    const [widthLevel,setWidthLevel] = useState<WindowLevel>(WindowLevel.XS);
    const [brushSize, setBrushSize] = useState<number>(3);
    const recentColorsModel=useRecentColorsContext();
    const [recentColors, setRecentColors] = useState<string[]>(recentColorsModel.recentColors.current);
    const imageRef=useRef<ILine[]>([]);
    const availableTools = ["pen", "eraser", "bucket", "eyedropper"];
    const [activeToolButton, setActiveToolButton] = useState<boolean[]>([true, false, false, false]);
    
    function onResize() {
        setWidthLevel(getWidthLevel());
    }

    function handleColorChange(value: string) {
        recentColorsModel.popColor(value);
        recentColorsModel.pushColor(color);
        setRecentColors([...recentColorsModel.recentColors.current]);
        setColor(value)
    }

    function selectTool(index: number) {
        if (index < 0 || index >= availableTools.length) {
            return;
        }
        setTool(availableTools[index]);
        const newActiveToolButton = activeToolButton.map((_, i) => i === index);
        setActiveToolButton(newActiveToolButton);
    }

    useEffect(() => {
        onResize();
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
        }
    }
    , []);

    return (
        <>
            <Timer/>
            <StageCounter/>
            <PlayerCompleteCounter/>
            <div className="container-mid">
                <div style={{marginTop:"3vh"}} className="lyrics-container">
                    <h1 className="lyrics-2line">Ridin' in my GNX with Anita Baker in the tape deck, it's gon' be a sweet love</h1>
                    <h1 className="lyrics-2line">Fuck apologies, I wanna see y'all geeked up</h1>
                </div>
                <Row gutter={[20,10]} style={{width:"100%",marginTop:"3vh"}}>
                    <Col xs={24} md={20} xxl={22}>
                        <Canvas color={color} tool={tool} brushSize={brushSize} lines={imageRef}/>
                    </Col>
                    <Col xs={24} md={4} xxl={2}>
                        <div className={widthLevel<=WindowLevel.SM?"palette-mobile":"palette"}>
                            {widthLevel<=WindowLevel.SM?"":<Divider type={"horizontal"} className="palette-divider">Color</Divider>}
                            <div className="palette-current">
                                <ColorPicker className="current-color" value={color} onChangeComplete={(value)=>{handleColorChange(value.toHexString())}} trigger="hover" disabledAlpha />
                            </div>
                            <Divider type={widthLevel<=WindowLevel.SM?"vertical":"horizontal"} className="palette-divider">Recently used</Divider>
                            <div className="palette-recent">
                                {widthLevel<=WindowLevel.SM?
                                <Flex gap={10}>
                                    {recentColors.slice(0, 6).map((c, index) => (
                                        <DisabledColorPicker key={index} color={c} onClick={() => handleColorChange(c)}/>
                                    ))}
                                </Flex>
                                :<Row style={{width:"100%"}} gutter={[10,10]}>
                                    {recentColors.map((c, index) => (
                                        <Col key={index}  xs={4} md={8}>
                                            <DisabledColorPicker key={index} color={c} onClick={() => handleColorChange(c)}/>
                                        </Col>
                                    ))}
                                </Row>}
                            </div>
                        </div>
                    </Col>
                </Row>
                <div className="canvas-settings" style={widthLevel<=WindowLevel.SM?{marginTop:"1vh"}:{marginTop:"3vh"}}>
                    <div className="canvas-brush-size">
                        <label className="brush-size-label">Brush size</label>
                        <Slider className="brush-slider" value={brushSize} onChange={(value)=>setBrushSize(value)} max={5} min={1} style={{flex: 1}} />
                    </div>
                    <div className="canvas-tools">
                        <ToolButton icon={<BrushIcon/>} active={activeToolButton[0]} onClick={()=>{selectTool(0)}}/>
                        <ToolButton icon={<EraserIcon/>} active={activeToolButton[1]} onClick={()=>{selectTool(1)}}/>
                        <ToolButton icon={<BucketIcon/>} active={activeToolButton[2]} onClick={()=>{selectTool(2)}}/>
                        <ToolButton icon={<EyedropperIcon/>} active={activeToolButton[3]} onClick={()=>{selectTool(3)}}/>                        
                    </div>
                    {widthLevel>WindowLevel.SM?
                    <div style={{display:"flex",justifyContent:"end",width:"100%",position:"absolute",right:26,zIndex:1}}>
                        <SubmitButton loading={false} isSubmitted={false}/>
                    </div>
                    :""}
                </div>
                {widthLevel<=WindowLevel.SM?
                <div style={{display:"flex",justifyContent:"end",width:"100%",marginTop:"2vh"}}>
                    <SubmitButton loading={false} isSubmitted={false}/>
                </div>
                :""}
            </div>
        </>
    );
}
