import { FC } from "react";
import { Layout } from "antd";
import { Content } from "antd/es/layout/layout";
import { Outlet } from "react-router";
import { SignalRProvider } from "./SignalRProvider";
import { Navbar } from "./Navbar";
import { LeaveWebsiteHandler } from "./LeaveWebsiteHandler";
import { ErrorDisplayProvider } from "./ErrorDisplayProvider";
import { RecentColorsProvider } from "./RecentColorsProvider";

interface IMainLayoutProps {};


export const MainLayout: FC<IMainLayoutProps> = () => {
    return (
      <ErrorDisplayProvider>
        <SignalRProvider>
          <RecentColorsProvider>
            <LeaveWebsiteHandler/>
            <Layout>
              <Navbar/>
              <Content className="container-layout">
                  <Outlet/>
              </Content>
            </Layout>
          </RecentColorsProvider>
        </SignalRProvider>
      </ErrorDisplayProvider>
    );
}
