import { FC } from "react";
import { Layout } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { Typography } from 'antd';
import {Color} from "../misc/colors";
import { Outlet } from "react-router";

const { Title } = Typography;
interface IMainLayoutProps {};

const containerBig:React.CSSProperties={
    background: Color.Background,
    // justifyContent:"center" 
}

export const MainLayout: FC<IMainLayoutProps> = () => {
    return (
        <Layout>
            <Header color="primary" style={{ display: 'flex',justifyContent:"center", background: Color.Primary, alignItems: 'center',height:64}}>
                <Title style={{color:"white",margin:0}} level={2}>VerseSketch</Title>
            </Header>
            <Content style={containerBig}>
                <Outlet/>
            </Content>
        </Layout>
    );
}
