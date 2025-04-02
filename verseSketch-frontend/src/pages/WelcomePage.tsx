import { FC, useEffect } from "react";
import { Col, Row } from "antd";
import { PageTitle } from "../components/PageTitle";
import { CreateRoomNavigateButton } from "../components/CreateRoomNavigateButton";
import { JoinRoomNavigateButton } from "../components/JoinRoomNavigateButton";

interface IWelcomePageProps {};

export const WelcomePage: FC<IWelcomePageProps> = () => {
    useEffect(()=>{
        document.title="VerseSketch"
    },[]);

    return (
        <div className="container-small">
            <PageTitle style={{marginTop:250}}>Welcome to the VerseSketch!</PageTitle>
            <Row style={{marginTop:87}} gutter={46}>
                <Col span={12}>
                    <JoinRoomNavigateButton/>
                </Col>
                <Col span={12}>
                    <CreateRoomNavigateButton/>
                </Col>
            </Row>
        </div>
    );
}
