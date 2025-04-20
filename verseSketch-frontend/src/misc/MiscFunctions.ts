import { HubConnection } from "@microsoft/signalr";
import { ConnectionConfig } from "./ConnectionConfig";

export async function leave(cookie:string|undefined,removeCookie:(name:"player",options?:any)=>void,connection:React.RefObject<HubConnection | null>)
{
    if (cookie==undefined)
        return;
    if (connection.current?.state==="Connected"){
        connection.current?.stop();
        connection.current=null;
    }
    else{
        fetch(`${ConnectionConfig.Api}/rooms/leave`,{
            method:'DELETE',
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${cookie}`
            }
        });
    }
    removeCookie('player',{path:"/non-existent-cookie-path"});
}