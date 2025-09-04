import { FC, useEffect } from "react";
import { Col, Row } from "antd";
import { PageTitle } from "../components/PageTitle";
import { CreateRoomNavigateButton } from "../components/buttons/CreateRoomNavigateButton";
import { JoinRoomNavigateButton } from "../components/buttons/JoinRoomNavigateButton";

interface IWelcomePageProps { };

export const WelcomePage: FC<IWelcomePageProps> = () => {

    useEffect(() => {
        document.title = "VerseSketch"
    }, []);

    return (
        <>
            <div style={{ marginTop: "20vh" }} className="container-small">
                <PageTitle style={{ width: "80%" }}>Welcome to the VerseSketch!</PageTitle>
                <Row style={{ marginTop: "6vh" }} gutter={{ xs: 8, sm: 16, md: 24, lg: 46 }}>
                    <Col span={12}>
                        <JoinRoomNavigateButton />
                    </Col>
                    <Col span={12}>
                        <CreateRoomNavigateButton />
                    </Col>
                </Row>
            </div>
            <div style={{margin:"auto 0 10vh 0",width:"100%",display:"flex",justifyContent:"flex-end"}}>
                <label style={{marginRight:"10vh"}} className="small-remark">v1.1.2</label>
            </div>
        </>
    );
}
