import { FC, useEffect } from "react";
import { Col, Row } from "antd";
import { PageTitle } from "../components/PageTitle";
import { CreateRoomNavigateButton } from "../components/buttons/CreateRoomNavigateButton";
import { JoinRoomNavigateButton } from "../components/buttons/JoinRoomNavigateButton";

interface IWelcomePageProps {};

export const WelcomePage: FC<IWelcomePageProps> = () => {
    useEffect(()=>{
        document.title="VerseSketch"
    },[]);

    return (
        <div className="container-small">
            <PageTitle style={{marginTop:250,width:"80%"}}>Welcome to the VerseSketch!</PageTitle>
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
