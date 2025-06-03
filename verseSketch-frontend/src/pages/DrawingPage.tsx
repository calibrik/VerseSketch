import { FC, useEffect, useRef } from "react";
import { Canvas } from "../components/Canvas";
import { Col, Row } from "antd";
import { StepCounter } from "../components/StepCounter";
interface IDrawingPageProps {};

export const DrawingPage: FC<IDrawingPageProps> = (_) => {
    const scale=useRef(1);
     function onResize() {
        const width = window.innerWidth-16;
        const height = window.innerHeight;
        scale.current = Math.min(width / 1516, height / 848);
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
                <div style={{marginTop:"3vh"}} className="lyrics-container">
                    <h1 className="lyrics-2line">Ridin' in my GNX with Anita Baker in the tape deck, it's gon' be a sweet love</h1>
                    <h1 className="lyrics-2line">Fuck apologies, I wanna see y'all geeked up</h1>
                </div>
                <Row style={{width:"100%"}}>
                    <Col xs={24} sm={20}>
                        <Canvas style={{marginTop:"5vh"}}/>
                    </Col>
                    <Col>
                        <div></div>
                    </Col>
                </Row>
            </div>
        </>
    );
}
