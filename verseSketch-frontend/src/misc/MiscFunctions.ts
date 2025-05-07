import { HubConnection } from "@microsoft/signalr";
import { ConnectionConfig } from "./ConnectionConfig";

export async function leave(connection?:React.RefObject<HubConnection | null>)
{
    const token=sessionStorage.getItem("player");
    sessionStorage.removeItem("player");
    console.log("Leaving",token,connection?.current);
    if (connection&&connection.current){
        await connection.current?.invoke("Leave");
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