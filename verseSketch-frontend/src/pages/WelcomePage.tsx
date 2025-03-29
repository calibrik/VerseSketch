import { FC, useEffect } from "react";
import { Col, Row } from "antd";
import { PrimaryButton } from "../components/PrimaryButton";
import { PlaySquareFilled, PlusSquareFilled } from "@ant-design/icons";
import { SecondaryButton } from "../components/SecondaryButton";
import './WelcomePage.css';
import { PageTitle } from "../components/PageTitle";
import { useNavigate } from "react-router";

interface IWelcomePageProps {};

export const WelcomePage: FC<IWelcomePageProps> = () => {
    let navigate=useNavigate()
    useEffect(()=>{
        document.title="VerseSketch"
    },[]);

    return (
        <div className="container-small">
            <PageTitle>Welcome to the VerseSketch!</PageTitle>
            <Row style={{marginTop:87}} gutter={46}>
                <Col span={12}>
                    <PrimaryButton icon={<PlaySquareFilled style={{fontSize:33}}/>}>JOIN ROOM</PrimaryButton>
                </Col>
                <Col span={12}>
                    <SecondaryButton onClick={()=>{navigate('/create-room')}} icon={<PlusSquareFilled style={{fontSize:33}}/>}>CREATE ROOM</SecondaryButton>
                </Col>
            </Row>
        </div>
    );
}
