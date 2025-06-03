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

export function getWidthLevel():"xs" | "sm" | "md" | "lg" | "xl"
{
    const width = window.innerWidth;
    if (width < 576) {
        return "xs";
    } else if (width < 768) {
        return "sm";
    } else if (width < 992) {
        return "md";
    } else if (width < 1200) {
        return "lg";
    } else {
        return "xl";
    }
}

export function getHeightLevel():"xs" | "sm" | "md" | "lg"
{
    const height = window.innerHeight;
    if (height < 700) {
        return "xs";
    } else if (height < 1001) {
        return "sm";
    } else if (height < 1230) {
        return "md";
    } else {
        return "lg";
    }
}