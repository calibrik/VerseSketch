import { FC, useEffect, useState } from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useSignalRConnectionContext } from "./SignalRProvider";
interface IPlayerCompleteCounterProps {
    style?: React.CSSProperties;
    totalPlayers: number;
    completedPlayers: number;
};

export const PlayerCompleteCounter: FC<IPlayerCompleteCounterProps> = (props) => {

    const connection=useSignalRConnectionContext();
    const [completedPlayers, setCompletedPlayers] = useState(props.completedPlayers);

    useEffect(() => {
        connection.current?.on("PlayerCompletedTask", () => {
            setCompletedPlayers(prev => prev + 1);
        });
},[]);

    if (completedPlayers === 0) {
        return null;
    }
    return (
        <div style={props.style} className="player-complete-counter">
            <h1>{completedPlayers}/{props.totalPlayers}</h1>
            <CheckCircleOutlined className="icon"/>
        </div>
    );
}
