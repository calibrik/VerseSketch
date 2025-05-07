import { FC, useEffect } from "react";
import { Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import { Outlet, useNavigationType } from "react-router";
import { leave } from "../misc/MiscFunctions";
import { useSignalRConnectionContext } from "./SignalRProvider";
import { ErrorDisplayProvider } from "./ErrorDisplayProvider";
import { Navbar } from "./Navbar";

interface IMainLayoutProps {};


export const MainLayout: FC<IMainLayoutProps> = () => {
    
    const navigationType = useNavigationType();
    const connection=useSignalRConnectionContext();

    async function onUnload()
    {
        await leave(connection);
    }
    
      useEffect(() => {
        if (navigationType === "POP") {
          onUnload();
        }
      }, [navigationType]);

    return (
        <Layout>
          <ErrorDisplayProvider>
            <Navbar/>
            {/* <Header color="primary" style={{ display: 'flex',justifyContent:"center", background: Color.Primary, alignItems: 'center',height:64}}>
                <Title style={{color:"white",margin:0}} level={2}>VerseSketch</Title>
            </Header> */}
            <Content className="container-layout">
                <Outlet/>
            </Content>
          </ErrorDisplayProvider>
        </Layout>
    );
}
