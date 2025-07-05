import { FC, useEffect } from "react";
import { useSignalRConnectionContext } from "./SignalRProvider";
import { leave } from "../misc/MiscFunctions";
import { useNavigationType } from "react-router";
interface ILeaveWebsiteHandlerProps {};

export const LeaveWebsiteHandler: FC<ILeaveWebsiteHandlerProps> = (_) => {
    const signalRModel = useSignalRConnectionContext();
    const navigationType = useNavigationType();

    async function onUnload()
    {
        await leave(signalRModel);
    }

    function onPageShow(e:any)
    {
        if (e.persisted) 
        window.location.reload();
    }

    useEffect(()=>{
        window.addEventListener("beforeunload",onUnload)
        window.addEventListener("pageshow",onPageShow);
        console.log(location.pathname);
        return ()=> {
            window.removeEventListener("beforeunload",onUnload);
            window.removeEventListener("pageshow",onPageShow);
        }
    },[])
    useEffect(() => {
      if (navigationType === "POP") {
        onUnload();
      }
    }, [navigationType]);
    return null;
}
