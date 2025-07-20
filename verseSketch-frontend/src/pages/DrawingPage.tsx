import { FC, useEffect, useRef, useState } from "react";
import { Canvas, CanvasHandle, ILine } from "../components/Canvas";
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
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useSignalRConnectionContext } from "../components/SignalRProvider";
import { useNavigate } from "react-router";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { Spinner } from "../components/Spinner";

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
    const canvasRef=useRef<CanvasHandle|null>(null)
    const signalRModel=useSignalRConnectionContext();
    const fromPlayerId=useRef<string>("");
    const [lines,setLines]=useState<string[]>([]);
    const navigate=useNavigate();
    // Change activeToolButton to an object with tool names as keys and booleans as values
    const [activeToolButton, setActiveToolButton] = useState<{ [key: string]: boolean }>({
        pen: true,
        eraser: false,
        bucket: false,
        eyedropper: false,
    });
    const { open,isSupported } = useEyeDropper()
    const [submitLoading,setSubmitLoading]=useState<boolean>(false);
    const [isSubmitted,setIsSubmitted]=useState<boolean>(false);
    const [isTimeUp,setIsTimeUp]=useState<boolean>(false);


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
        if (newColor===oldColor)
            return;
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

    async function onSubmit() {
        if (!signalRModel.roomModelRef.current||!signalRModel.connection.current)
            return;

        setSubmitLoading(true);
        if (isSubmitted){
            try {
                await signalRModel.connection.current.invoke("PlayerCanceledTask",signalRModel.roomModelRef.current.title);
                setIsSubmitted(false);
            }
            catch (e:any) {
                errorModals.errorModalClosable.current?.show("An error occured while trying to edit drawing.")
            }
        }
        else {
            try {
                await signalRModel.connection.current.invoke("SendImage",{image:imageRef.current,playerId:signalRModel.roomModelRef.current.playerId,lyrics:lines},fromPlayerId.current);
                setIsSubmitted(true);
            }
            catch (e:any) {
                errorModals.errorModalClosable.current?.show("An error occured while trying to submit drawing.")
            }
        }
        setSubmitLoading(false);

    }

    async function getLines()
    {
        let response=null;
        try{
            response=await fetch(`${ConnectionConfig.Api}/game/getCurrentLyricsToDraw`,{
                method:"GET",
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${sessionStorage.getItem("player")}`
                }
            });
        }
        catch(_:any){
            errorModals.errorModal.current?.show("No connection to the server.");
            return;
        }
        let data=await response?.json();
        if (!response.ok) {
            errorModals.errorModal.current?.show(data.message);
        }
        console.log("Data received",data);
        fromPlayerId.current=data.lyrics.fromPlayerId;
        setLines(data.lyrics.lines);
    }

    async function forceSubmit()
    {
        if (!signalRModel.roomModelRef.current||!signalRModel.connection.current)
            return;
        setIsTimeUp(true);
        await signalRModel.connection.current.invoke("SendImage",{image:imageRef.current,playerId:signalRModel.roomModelRef.current.playerId,lyrics:lines},fromPlayerId.current);
        setIsSubmitted(true);
    }

    useEffect(() => {
            if (!signalRModel.roomModelRef.current||signalRModel.roomModelRef.current.stage<1||!signalRModel.connection.current) {
                navigate("/",{replace:true});
                return;
            }
            getLines();
            onResize();
            signalRModel.connection.current.on("TimeIsUp",forceSubmit);
            window.addEventListener("resize", onResize);
            return () => {
                window.removeEventListener("resize", onResize);
                signalRModel.connection.current?.off("TimeIsUp",forceSubmit);
            }
        }
        , []);

    if (lines.length==0)
        return (<Spinner style={{marginTop:"3vh"}}/>);

    return (
        <>
            <Timer />
            <StageCounter />
            <PlayerCompleteCounter />
            <div className="container-mid">
                <div style={{ marginTop: "3vh" }} className="lyrics-container">
                    <h1 className="lyrics-2line">{lines[0]}</h1>
                    <h1 className="lyrics-2line">{lines[1]}</h1>
                </div>
                <Row gutter={[20, 10]} style={{ width: "100%", marginTop: "3vh" }}>
                    <Col xs={24} md={20} xxl={22}>
                        <Canvas disabled={isSubmitted||isTimeUp} ref={canvasRef} color={color} tool={tool} brushSize={brushSize} lines={imageRef} />
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
                                            <DisabledColorPicker key={index} color={c} onClick={() =>handleColorChange(c)} />
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
                        <ToolButton icon={<ArrowLeftOutlined className="button-icon-lg"/>} active={false} onClick={()=>{if (!isSubmitted) canvasRef.current?.goBack();}}/>
                        <ToolButton icon={<ArrowRightOutlined className="button-icon-lg"/>} active={false} onClick={()=>{if (!isSubmitted) canvasRef.current?.goForward();}}/>
                    </div>
                    {widthLevel > WindowLevel.SM ?
                        <div style={{ display: "flex", justifyContent: "end", width: "100%", position: "absolute", right: 26, zIndex: 1 }}>
                            <SubmitButton disabled={isTimeUp} onClick={onSubmit} loading={submitLoading} isSubmitted={isSubmitted} />
                        </div>
                        : ""}
                </div>
                {widthLevel <= WindowLevel.SM ?
                    <div style={{ display: "flex", justifyContent: "end", width: "100%", marginTop: "2vh" }}>
                        <SubmitButton disabled={isTimeUp} onClick={onSubmit} loading={submitLoading} isSubmitted={isSubmitted} />
                    </div>
                    : ""}
            </div>
        </>
    );
}
