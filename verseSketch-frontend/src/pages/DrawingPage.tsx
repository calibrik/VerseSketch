import { FC, useEffect, useState } from "react";
import { Canvas } from "../components/Canvas";
import { Col, ColorPicker, Divider, Row, Slider } from "antd";
import { StepCounter } from "../components/StepCounter";
import { AggregationColor } from "antd/es/color-picker/color";
import { DisabledColorPicker } from "../components/DisabledColorPicker";
import { getWidthLevel, WindowLevel } from "../misc/MiscFunctions";
import { BrushIcon, BucketIcon, EraserIcon, EyedropperIcon } from "../components/Icons";
import { SubmitButton } from "../components/buttons/SubmitButton";

interface IDrawingPageProps {};

export const DrawingPage: FC<IDrawingPageProps> = (_) => {
    const [color, setColor] = useState("#000000");
    const [widthLevel,setWidthLevel] = useState<WindowLevel>(WindowLevel.XS);
    const [brushSize, setBrushSize] = useState(3);
    
    function onResize() {
        setWidthLevel(getWidthLevel());
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
            <StepCounter/>
            <div className="container-mid">
                <div style={{marginTop:"2vh"}} className="lyrics-container">
                    <h1 className="lyrics-2line">Ridin' in my GNX with Anita Baker in the tape deck, it's gon' be a sweet love</h1>
                    <h1 className="lyrics-2line">Fuck apologies, I wanna see y'all geeked up</h1>
                </div>
                <Row gutter={[20,10]} style={{width:"100%",marginTop:"2vh"}}>
                    <Col xs={24} md={20} xxl={22}>
                        <Canvas color={color}/>
                    </Col>
                    <Col xs={24} md={4} xxl={2}>
                        <div className={widthLevel<=WindowLevel.SM?"palette-mobile":"palette"}>
                            <Divider type={widthLevel<=WindowLevel.SM?"vertical":"horizontal"} className="palette-divider">Color</Divider>
                            <div className="palette-current">
                                <ColorPicker className="current-color" value={color} onChangeComplete={(value: AggregationColor)=>setColor(value.toCssString())} trigger="hover" disabledAlpha />
                            </div>
                            <Divider type={widthLevel<=WindowLevel.SM?"vertical":"horizontal"} className="palette-divider">Recently used</Divider>
                            <div className="palette-recent">
                                <Row gutter={[10,10]}>
                                    <Col xs={4} md={8}>
                                        <DisabledColorPicker color="#ffffff" onClick={() => setColor("#ffffff")}/>
                                    </Col>
                                    <Col xs={4} md={8}>
                                        <DisabledColorPicker color="#7C000B" onClick={() => setColor("#7C000B")}/>
                                    </Col>
                                    <Col xs={4} md={8}>
                                        <DisabledColorPicker color="#6C0001" onClick={() => setColor("#6C0001")}/>
                                    </Col>
                                    <Col xs={4} md={8}>
                                        <DisabledColorPicker color="#7C000C" onClick={() => setColor("#7C000C")}/>
                                    </Col>
                                    <Col xs={4} md={8}>
                                        <DisabledColorPicker color="#7C000D" onClick={() => setColor("#7C000D")}/>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </Col>
                </Row>
                <div className="canvas-settings" style={widthLevel<=WindowLevel.SM?{marginTop:"1vh"}:{marginTop:"3vh"}}>
                    <div className="canvas-brush-size">
                        <label className="input-field-label" style={{whiteSpace: "nowrap"}}>Brush size</label>
                        <Slider className="brush-slider" value={brushSize} onChange={(value)=>setBrushSize(value)} max={5} min={1} style={{flex: 1}} />
                    </div>
                    <div className="canvas-tools">
                        <BrushIcon/>
                        <EraserIcon/>
                        <BucketIcon/>
                        <EyedropperIcon/>
                    </div>
                    {widthLevel>WindowLevel.SM?
                    <div style={{display:"flex",justifyContent:"end",width:"100%",position:"absolute",right:26,zIndex:1}}>
                        <SubmitButton/>
                    </div>
                    :""}
                </div>
                {widthLevel<=WindowLevel.SM?
                <div style={{display:"flex",justifyContent:"end",width:"100%",marginTop:"2vh"}}>
                    <SubmitButton/>
                </div>
                :""}
            </div>
        </>
    );
}
