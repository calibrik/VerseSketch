import { FC, useEffect, useRef, useState } from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useSignalRConnectionContext } from "./SignalRProvider";
interface IPlayerCompleteCounterProps {
    style?: React.CSSProperties;
};

export const PlayerCompleteCounter: FC<IPlayerCompleteCounterProps> = (props) => {

    const signalRModel=useSignalRConnectionContext();
    const [completedPlayers, setCompletedPlayers] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(signalRModel.roomModelRef.current?.playersCount ?? 0);
    const completedPlayersRef=useRef<number>(0);
    const totalPlayersRef=useRef<number>(signalRModel.roomModelRef.current?.playersCount ?? 0);

    useEffect(() => {
        signalRModel.connection.current?.on("PlayerCompletedTask", () => {
            if (completedPlayersRef.current+1==totalPlayersRef.current&& signalRModel.roomModelRef.current?.isPlayerAdmin) {
                signalRModel.connection.current?.invoke("PlayersDoneWithTask");
                return;
            }
            completedPlayersRef.current++;
            console.log(`Player completed task ${completedPlayersRef.current}/${totalPlayersRef.current}`);
            setCompletedPlayers(completedPlayersRef.current);
        });
        signalRModel.connection.current?.on("PlayerCanceledTask", () => {
            completedPlayersRef.current--;
            setCompletedPlayers(completedPlayersRef.current);
        });
        signalRModel.connection.current?.on("PlayerLeft",(_)=>{
            totalPlayersRef.current--;
            setTotalPlayers(totalPlayersRef.current);
        })
        return () => {
            signalRModel.connection.current?.off("PlayerCompletedTask");
            signalRModel.connection.current?.off("PlayerCanceledTask");
            signalRModel.connection.current?.off("PlayerLeft");
        }
},[]);

    if (completedPlayersRef.current === 0) {
        return null;
    }
    return (
        <div style={props.style} className="player-complete-counter">
            <h1>{completedPlayers}/{totalPlayers}</h1>
            <CheckCircleOutlined className="icon"/>
        </div>
    );
}
