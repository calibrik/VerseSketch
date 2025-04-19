import { ConnectionConfig } from "./ConnectionConfig";

export async function leave(cookie:any,removeCookie:(name:"player",options?:any)=>void)
{
    await fetch(`${ConnectionConfig.Api}/rooms/leave`,{
        method:'DELETE',
        headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer ${cookie.player}`
        }
    });
    removeCookie('player',{path:"/non-existent-cookie-path"});
}