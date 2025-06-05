import { HubConnection } from "@microsoft/signalr";
import { ConnectionConfig } from "./ConnectionConfig";

export async function leave(connection?:React.RefObject<HubConnection | null>)
{
    const token=sessionStorage.getItem("player");
    sessionStorage.removeItem("player");
    if (connection&&connection.current){
        connection.current?.invoke("Leave");
        connection.current=null;
    }
    else if (token!=null){
        fetch(`${ConnectionConfig.Api}/rooms/leave`,{
            method:'DELETE',
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${token}`
            }
        });
    }
}

export enum WindowLevel{
    XS = 0,
    SM = 1,
    MD = 2,
    LG = 3,
    XL = 4
}

export function getWidthLevel():WindowLevel
{
    const width = window.innerWidth;
    if (width < 576) {
        return WindowLevel.XS;
    } else if (width < 768) {
        return WindowLevel.SM;
    } else if (width < 992) {
        return WindowLevel.MD;
    } else if (width < 1200) {
        return WindowLevel.LG;
    } else {
        return WindowLevel.XL;
    }
}

export function getHeightLevel():WindowLevel
{
    const height = window.innerHeight;
    if (height < 700) {
        return WindowLevel.XS;
    } else if (height < 1001) {
        return WindowLevel.SM;
    } else if (height < 1230) {
        return WindowLevel.MD;
    } else {
        return WindowLevel.LG;
    }
}