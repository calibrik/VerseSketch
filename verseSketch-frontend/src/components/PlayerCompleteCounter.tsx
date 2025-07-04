import { FC, useEffect, useState } from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useSignalRConnectionContext } from "./SignalRProvider";
interface IPlayerCompleteCounterProps {
    style?: React.CSSProperties;
    totalPlayers: number;
    completedPlayers: number;
    isAdmin: boolean;
};

export const PlayerCompleteCounter: FC<IPlayerCompleteCounterProps> = (props) => {

    const connection=useSignalRConnectionContext();
    const [completedPlayers, setCompletedPlayers] = useState(props.completedPlayers);
    const [totalPlayers, setTotalPlayers] = useState(props.totalPlayers);

    useEffect(() => {
        connection.current?.on("PlayerCompletedTask", () => {
            console.log(`Player completed task ${completedPlayers+1}/${totalPlayers}`);
            if (completedPlayers+1==totalPlayers&& props.isAdmin) {
                connection.current?.invoke("PlayersDoneWithTask");
                return;
            }
            setCompletedPlayers(prev => prev + 1);
        });
        connection.current?.on("PlayerCanceledTask", () => {
            console.log(`Player completed task ${completedPlayers-1}/${totalPlayers}`);
            setCompletedPlayers(prev => prev - 1);
        });
        connection.current?.on("PlayerLeft",(_)=>{
            setTotalPlayers(prev => prev - 1);
        })
        return () => {
            connection.current?.off("PlayerCompletedTask");
            connection.current?.off("PlayerCanceledTask");
            connection.current?.off("PlayerLeft");
        }
},[]);

    if (completedPlayers === 0) {
        return null;
    }
    return (
        <div style={props.style} className="player-complete-counter">
            <h1>{completedPlayers}/{totalPlayers}</h1>
            <CheckCircleOutlined className="icon"/>
        </div>
    );
}
