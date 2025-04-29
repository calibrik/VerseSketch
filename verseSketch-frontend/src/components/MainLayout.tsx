import { FC, useEffect } from "react";
import { Layout } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { Typography } from 'antd';
import {Color} from "../misc/colors";
import { Outlet, useNavigationType } from "react-router";
import { leave } from "../misc/MiscFunctions";
import { useSignalRConnectionContext } from "./SignalRProvider";
import { useCookies } from "react-cookie";
import { ErrorDisplayProvider } from "./ErrorDisplayProvider";

const { Title } = Typography;
interface IMainLayoutProps {};


export const MainLayout: FC<IMainLayoutProps> = () => {
    
    const navigationType = useNavigationType();
    const [cookie,,removeCookie]=useCookies(['player']);
    const connection=useSignalRConnectionContext();

    async function onUnload()
    {
        await leave(cookie.player,removeCookie,connection);
    }
    
      useEffect(() => {
        if (navigationType === "POP") {
          onUnload();
        }
      }, [navigationType]);

    return (
        <Layout>
          <ErrorDisplayProvider>
            <Header color="primary" style={{ display: 'flex',justifyContent:"center", background: Color.Primary, alignItems: 'center',height:64}}>
                <Title style={{color:"white",margin:0}} level={2}>VerseSketch</Title>
            </Header>
            <Content className="container-layout">
                <Outlet/>
            </Content>
          </ErrorDisplayProvider>
        </Layout>
    );
}
