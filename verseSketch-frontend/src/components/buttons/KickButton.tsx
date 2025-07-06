import { CSSProperties, FC } from "react";
import { useSignalRConnectionContext } from "../SignalRProvider";
import { useErrorDisplayContext } from "../ErrorDisplayProvider";
interface IKickButtonProps {
    style?:CSSProperties;
    playerId:string;
    roomTitle:string|undefined;
};

export const KickButton: FC<IKickButtonProps> = (props) => {
    const signalRModel=useSignalRConnectionContext();
    const errorModals=useErrorDisplayContext();

    function onClick(){
        signalRModel.connection.current?.invoke("KickPlayer",props.playerId,props.roomTitle)
            .catch((_)=>{
                errorModals.errorModalClosable.current?.show("An error occurred while trying to proccess request on server.");
            });
    }

    return (
        <span className="kick-button" style={props.style} onClick={onClick}>KICK</span>
    );
}


