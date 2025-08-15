import { FC, useEffect, useRef, useState } from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useSignalRConnectionContext } from "./SignalRProvider";
interface IPlayerCompleteCounterProps {
    style?: React.CSSProperties;
};

export const PlayerCompleteCounter: FC<IPlayerCompleteCounterProps> = (props) => {
    const signalRModel = useSignalRConnectionContext();
    const [completedPlayers, setCompletedPlayers] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(signalRModel.roomModelRef.current?.playingPlayersCount ?? 0);
    const totalPlayersRef = useRef<number>(totalPlayers);

    function handlePlayerCompletedTask(completed:number) {
        setCompletedPlayers(completed);
    }

    function handlePlayerLeft(_: string, __: boolean) {
        totalPlayersRef.current--;
        setTotalPlayers(totalPlayersRef.current);
    }

    function onStageSet(_:number) {
        setCompletedPlayers(0);
    }
    useEffect(() => {
        signalRModel.connection.current?.on("PlayerCompletedTask", handlePlayerCompletedTask);
        signalRModel.connection.current?.on("PlayerLeft", handlePlayerLeft);
        signalRModel.connection.current?.on("StageSet", onStageSet);
        return () => {
            signalRModel.connection.current?.off("PlayerCompletedTask", handlePlayerCompletedTask);
            signalRModel.connection.current?.off("PlayerLeft", handlePlayerLeft);
            signalRModel.connection.current?.off("StageSet", onStageSet);
        };
    }, []);

    if (completedPlayers === 0) {
        return null;
    }
    return (
        <div style={props.style} className="player-complete-counter">
            <h1>{completedPlayers}/{totalPlayers}</h1>
            <CheckCircleOutlined className="icon" />
        </div>
    );
}
