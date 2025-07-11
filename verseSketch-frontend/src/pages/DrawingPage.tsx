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
import useEyeDropper from "use-eye-dropper";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";

interface IDrawingPageProps { };

export const DrawingPage: FC<IDrawingPageProps> = (_) => {
    const [color, setColor] = useState<string>("#000000");
    const [tool, setTool] = useState<string>("pen");
    const [widthLevel, setWidthLevel] = useState<WindowLevel>(WindowLevel.XS);
    const [brushSize, setBrushSize] = useState<number>(1);
    const recentColorsModel = useRecentColorsContext();
    const [recentColors, setRecentColors] = useState<string[]>(recentColorsModel.recentColors.current);
    const imageRef = useRef<ILine[]>([]);
    const errorModals=useErrorDisplayContext();
    const bufferColor=useRef<string>(color);
    // Change activeToolButton to an object with tool names as keys and booleans as values
    const [activeToolButton, setActiveToolButton] = useState<{ [key: string]: boolean }>({
        pen: true,
        eraser: false,
        bucket: false,
        eyedropper: false,
    });
    const { open,isSupported } = useEyeDropper()


    async function handleEyedropper() {
        if (!isSupported()){
            errorModals.errorModalClosable.current?.show("Your browser doesn't support eyedroppers.");
            resetTool();
            return;
        }
        let c=await open();
        handleColorChange(c.sRGBHex);
        resetTool();
    }

    function onResize() {
        setWidthLevel(getWidthLevel());
    }

    function handleColorChange(value: string) {
        if (value.trim()===""||value==color)
            return;
        updateRecent(value,color);
        setColor(value)
    }

    function updateRecent(newColor:string,oldColor:string)
    {
        recentColorsModel.popColor(newColor);
        recentColorsModel.pushColor(oldColor);
        setRecentColors([...recentColorsModel.recentColors.current]);
    }

    function resetTool() {
        setActiveToolButton({
            pen: true,
            eraser: false,
            bucket: false,
            eyedropper: false,
        });
        setTool("pen");
    }

    function selectTool(t: string) {
        if (!(t in activeToolButton)||tool===t) {
            return;
        }
        activeToolButton[tool] = false;
        activeToolButton[t] = true;
        console.log(activeToolButton, tool, t)
        setTool(t);
        setActiveToolButton({ ...activeToolButton });
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
            <Timer />
            <StageCounter />
            <PlayerCompleteCounter />
            <div className="container-mid">
                <div style={{ marginTop: "3vh" }} className="lyrics-container">
                    <h1 className="lyrics-2line">Ridin' in my GNX with Anita Baker in the tape deck, it's gon' be a sweet love</h1>
                    <h1 className="lyrics-2line">Fuck apologies, I wanna see y'all geeked up</h1>
                </div>
                <Row gutter={[20, 10]} style={{ width: "100%", marginTop: "3vh" }}>
                    <Col xs={24} md={20} xxl={22}>
                        <Canvas color={color} tool={tool} brushSize={brushSize} lines={imageRef} />
                    </Col>
                    <Col xs={24} md={4} xxl={2}>
                        <div className={widthLevel <= WindowLevel.SM ? "palette-mobile" : "palette"}>
                            {widthLevel <= WindowLevel.SM ? "" : <Divider type={"horizontal"} className="palette-divider">Color</Divider>}
                            <div className="palette-current">
                                <ColorPicker className="current-color" value={color} onChangeComplete={(value)=>{setColor(value.toHexString())}} onOpenChange={(open) => {
                                     if (!open) 
                                        updateRecent(color,bufferColor.current);
                                    else
                                        bufferColor.current=color;
                                     }} trigger="hover" disabledAlpha />
                            </div>
                            <Divider type={widthLevel <= WindowLevel.SM ? "vertical" : "horizontal"} className="palette-divider">Recently used</Divider>
                            <div className="palette-recent">
                                {widthLevel <= WindowLevel.SM ?
                                    <Flex gap={10}>
                                        {recentColors.slice(0, 6).map((c, index) => (
                                            <DisabledColorPicker key={index} color={c} onClick={() => handleColorChange(c)} />
                                        ))}
                                    </Flex>
                                    : <Row style={{ width: "100%" }} gutter={[10, 10]}>
                                        {recentColors.map((c, index) => (
                                            <Col key={index} xs={4} md={8}>
                                                <DisabledColorPicker key={index} color={c} onClick={() => handleColorChange(c)} />
                                            </Col>
                                        ))}
                                    </Row>}
                            </div>
                        </div>
                    </Col>
                </Row>
                <div className="canvas-settings" style={widthLevel <= WindowLevel.SM ? { marginTop: "1vh" } : { marginTop: "3vh" }}>
                    <div className="canvas-brush-size">
                        <label className="brush-size-label">Brush size</label>
                        <Slider className="brush-slider" value={brushSize} onChange={(value) => setBrushSize(value)} max={5} min={1} style={{ flex: 1 }} />
                    </div>
                    <div className="canvas-tools">
                        <ToolButton icon={<BrushIcon />} active={activeToolButton["pen"]} onClick={() => { selectTool("pen") }} />
                        <ToolButton icon={<EraserIcon />} active={activeToolButton["eraser"]} onClick={() => { selectTool("eraser") }} />
                        <ToolButton icon={<BucketIcon />} active={activeToolButton["bucket"]} onClick={() => { selectTool("bucket") }} />
                        <ToolButton icon={<EyedropperIcon />} active={activeToolButton["eyedropper"]} onClick={async () => { 
                            selectTool("eyedropper"); 
                            await handleEyedropper(); 
                        }} />
                    </div>
                    {widthLevel > WindowLevel.SM ?
                        <div style={{ display: "flex", justifyContent: "end", width: "100%", position: "absolute", right: 26, zIndex: 1 }}>
                            <SubmitButton loading={false} isSubmitted={false} />
                        </div>
                        : ""}
                </div>
                {widthLevel <= WindowLevel.SM ?
                    <div style={{ display: "flex", justifyContent: "end", width: "100%", marginTop: "2vh" }}>
                        <SubmitButton loading={false} isSubmitted={false} />
                    </div>
                    : ""}
            </div>
        </>
    );
}
