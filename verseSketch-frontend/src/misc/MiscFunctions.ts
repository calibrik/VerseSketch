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