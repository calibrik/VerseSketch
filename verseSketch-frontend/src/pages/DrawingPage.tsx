import { FC, useEffect, useRef, useState } from "react";
import { Canvas, CanvasHandle, ILine } from "../components/Canvas";
import { Col, Divider, Flex, Row, Slider } from "antd";
import { StageCounter } from "../components/StageCounter";
import { DisabledColorPicker } from "../components/DisabledColorPicker";
import { getWidthLevel, leave, WindowLevel } from "../misc/MiscFunctions";
import { BrushIcon, BucketIcon, EraserIcon, EyedropperIcon } from "../components/Icons";
import { SubmitButton } from "../components/buttons/SubmitButton";
import { PlayerCompleteCounter } from "../components/PlayerCompleteCounter";
import { ITimerHandle, Timer } from "../components/Timer";
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
    const pallette:string[]=["#000000", "#FFFFFF", "#D80026", "#008A38", "#0A68FF", "#FFEB00","#964B00","#800000", "#FF00FF", "#FF8800","#5E00A8","#808080","#CC8800", "#C6008D"];
    const imageRef = useRef<ILine[]>([]);
    const errorModals = useErrorDisplayContext();
    const canvasRef = useRef<CanvasHandle | null>(null)
    const signalRModel = useSignalRConnectionContext();
    const forPlayerId = useRef<string>("");
    const [lines, setLines] = useState<string[]>(["penis penis penis","balls balls balls"]);
    const linesRef=useRef<string[]>([]);
    const navigate = useNavigate();
    const [activeToolButton, setActiveToolButton] = useState<{ [key: string]: boolean }>({
        pen: true,
        eraser: false,
        bucket: false,
        eyedropper: false,
    });
    const { open, isSupported } = useEyeDropper()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
    const isTimeUpRef = useRef<boolean>(false);
    const isSubmittedRef = useRef<boolean>(false);
    const timerRef = useRef<ITimerHandle | null>(null);
    const [stage, setStage] = useState<number>(signalRModel.roomModelRef.current?.stage ?? 0);


    async function handleEyedropper() {
        if (!isSupported()) {
            errorModals.errorModalClosable.current?.show("Your browser doesn't support eyedroppers.");
            resetTool();
            return;
        }
        let c = await open();
        setColor(c.sRGBHex);
        resetTool();
    }

    function onResize() {
        setWidthLevel(getWidthLevel());
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
        if (!(t in activeToolButton) || tool === t) {
            return;
        }
        activeToolButton[tool] = false;
        activeToolButton[t] = true;
        setTool(t);
        setActiveToolButton({ ...activeToolButton });
    }

    async function onSubmit() {
        if (!signalRModel.roomModelRef.current || !signalRModel.connection.current)
            return;

        setSubmitLoading(true);
        if (isSubmittedRef.current) {
            try {
                await signalRModel.connection.current.invoke("PlayerCanceledTask");
                setIsSubmitted(false);
                isSubmittedRef.current = false;
            }
            catch (e: any) {
                errorModals.errorModalClosable.current?.show("An error occured while trying to edit drawing.")
            }
        }
        else {
            try {
                await signalRModel.connection.current.invoke("SendImage", { image: imageRef.current, byPlayerId: signalRModel.roomModelRef.current.playerId, lyrics: linesRef.current }, forPlayerId.current);
                setIsSubmitted(true);
                isSubmittedRef.current = true;
            }
            catch (e: any) {
                errorModals.errorModalClosable.current?.show("An error occured while trying to submit drawing.")
            }
        }
        setSubmitLoading(false);

    }

    async function getLines() {
        let response = null;
        try {
            response = await fetch(`${ConnectionConfig.Api}/game/getCurrentLyricsToDraw`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("player")}`
                }
            });
        }
        catch (_: any) {
            errorModals.errorModal.current?.show("No connection to the server.");
            return;
        }
        let data = await response?.json();
        if (!response.ok) {
            errorModals.errorModal.current?.show(data.message);
        }
        forPlayerId.current = data.fromPlayerId;
        setLines(data.lines);
        linesRef.current=data.lines;
    }

    async function onReconnected() {
        if (isTimeUpRef.current)
            await forceSubmit();
    }

    async function forceSubmit() {
        setIsTimeUp(true);
        isTimeUpRef.current = true;
        if (!signalRModel.roomModelRef.current || !signalRModel.connection.current || isSubmittedRef.current || signalRModel.connection.current.state != "Connected")
            return;
        setSubmitLoading(true);
        try {
            await signalRModel.connection.current.invoke("SendImage", { image: imageRef.current, byPlayerId: signalRModel.roomModelRef.current.playerId, lyrics: linesRef.current }, forPlayerId.current);
            setIsSubmitted(true);
            isSubmittedRef.current = true;
        }
        catch (e: any) {
            errorModals.errorModalClosable.current?.show("An error occured while trying to submit drawing.")
        }
        setSubmitLoading(false);
    }

    async function onStageSet(s: number) {
        if (!signalRModel.roomModelRef.current || !signalRModel.connection.current || s == signalRModel.roomModelRef.current.actualPlayersCount)
            return;
        await getLines();
        setStage(s);
        setIsTimeUp(false);
        isTimeUpRef.current = false;
        setIsSubmitted(false);
        isSubmittedRef.current = false;
        timerRef.current?.reset();
    }

    useEffect(() => {
        document.title = "Draw";
        if (!signalRModel.roomModelRef.current || signalRModel.roomModelRef.current.stage < 1 || !signalRModel.connection.current) {
            leave(signalRModel);
            navigate("/", { replace: true });
            return;
        }
        getLines();
        onResize();
        signalRModel.connection.current.on("StageSet", onStageSet);
        signalRModel.connection.current.onreconnected(onReconnected);
        window.addEventListener("resize", onResize);
        return () => {
            signalRModel.connection.current?.off("StageSet", onStageSet);
            signalRModel.connection.current?.off("onreconnected", onReconnected);
            window.removeEventListener("resize", onResize);
        }
    }
        , []);

    if (lines.length == 0)
        return (<Spinner style={{ marginTop: "3vh" }} />);

    return (
        <>
            <Timer ref={timerRef} onTimeIsUp={forceSubmit} />
            <StageCounter stage={stage} maxStage={signalRModel.roomModelRef.current?.actualPlayersCount ?? 0} />
            <PlayerCompleteCounter />
            <div className="container-mid">
                <div style={{ marginTop: "3vh" }} className="lyrics-container">
                    <h1 className="lyrics-2line">{lines[0]}</h1>
                    <h1 className="lyrics-2line">{lines[1]}</h1>
                </div>
                <Row gutter={[20, 10]} style={{ width: "100%", marginTop: "3vh" }}>
                    <Col xs={24} md={21} xxl={22}>
                        <Canvas disabled={isSubmitted || isTimeUp} ref={canvasRef} color={color} tool={tool} brushSize={brushSize} lines={imageRef} />
                    </Col>
                    <Col xs={24} md={3} xxl={2}>
                        <div className={widthLevel <= WindowLevel.SM ? "palette-mobile" : "palette"}>
                            {widthLevel <= WindowLevel.SM ? "" : <Divider type={"horizontal"} className="palette-divider">Color</Divider>}
                            <div className="palette-current">
                                <DisabledColorPicker color={color} />
                            </div>
                            <Divider type={widthLevel <= WindowLevel.SM ? "vertical" : "horizontal"} className="palette-divider">Palette</Divider>
                            <div className="palette-recent">
                                {widthLevel <= WindowLevel.SM ?
                                    <Flex gap={10}>
                                        {pallette.map((c, index) => (
                                            <DisabledColorPicker key={index} color={c} onClick={() => setColor(c)} />
                                        ))}
                                    </Flex>
                                    : <Row style={{ width: "100%" }} gutter={[1, 10]}>
                                        {pallette.map((c, index) => (
                                            <Col key={index} xs={4} md={12}>
                                                <DisabledColorPicker key={index} color={c} onClick={() => setColor(c)} />
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
                        <ToolButton icon={<ArrowLeftOutlined className="button-icon-lg" />} active={false} onClick={() => { if (!isSubmitted) canvasRef.current?.goBack(); }} />
                        <ToolButton icon={<ArrowRightOutlined className="button-icon-lg" />} active={false} onClick={() => { if (!isSubmitted) canvasRef.current?.goForward(); }} />
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
