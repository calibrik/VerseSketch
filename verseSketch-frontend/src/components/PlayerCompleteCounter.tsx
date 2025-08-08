import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useSignalRConnectionContext } from "./SignalRProvider";
interface IPlayerCompleteCounterProps {
    style?: React.CSSProperties;
};

export interface IPlayerCompleteCounterHandle {
    reset: () => void;
};

export const PlayerCompleteCounter = forwardRef<IPlayerCompleteCounterHandle, IPlayerCompleteCounterProps>((props, ref) => {

    const signalRModel = useSignalRConnectionContext();
    const [completedPlayers, setCompletedPlayers] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(signalRModel.roomModelRef.current?.playersCount ?? 0);
    const completedPlayersRef = useRef<number>(0);
    const totalPlayersRef = useRef<number>(signalRModel.roomModelRef.current?.playersCount ?? 0);
    const playerMap = useRef<{ [key: string]: boolean }>({});//placeholder

    useImperativeHandle(ref, () => ({
        reset: () => {
            completedPlayersRef.current = 0;
            totalPlayersRef.current = signalRModel.roomModelRef.current?.playersCount ?? 0;
            setCompletedPlayers(0);
            setTotalPlayers(totalPlayersRef.current);
            for (const player of signalRModel.roomModelRef.current?.players ?? []) {
                playerMap.current[player.id] = false;
            }
        }
    }));
    function handlePlayerCompletedTask(playerId: string) {
        if (playerMap.current[playerId]) {
            return;
        }
        playerMap.current[playerId] = true;
        if (completedPlayersRef.current + 1 === totalPlayersRef.current && signalRModel.roomModelRef.current?.isPlayerAdmin) {
            signalRModel.connection.current?.invoke("PlayersDoneWithTask");
            return;
        }
        completedPlayersRef.current++;
        console.log(`Player completed task ${completedPlayersRef.current}/${totalPlayersRef.current}`);
        setCompletedPlayers(completedPlayersRef.current);
    }

    function handlePlayerCanceledTask(playerId: string) {
        if (!playerMap.current[playerId]) {
            return;
        }
        playerMap.current[playerId] = false;
        completedPlayersRef.current--;
        completedPlayersRef.current = Math.max(0, completedPlayersRef.current);
        console.log(`Player canceled task ${completedPlayersRef.current}/${totalPlayersRef.current}`);
        setCompletedPlayers(completedPlayersRef.current);
    }

    function handlePlayerLeft(_: string) {
        if (completedPlayersRef.current === totalPlayersRef.current - 1 && signalRModel.roomModelRef.current?.isPlayerAdmin) {
            signalRModel.connection.current?.invoke("PlayersDoneWithTask");
            return;
        }
        totalPlayersRef.current--;
        totalPlayersRef.current = Math.max(0, totalPlayersRef.current);
        setTotalPlayers(totalPlayersRef.current);
    }
    useEffect(() => {
        for (const player of signalRModel.roomModelRef.current?.players ?? []) {
            playerMap.current[player.id] = false;
        }
        signalRModel.connection.current?.on("PlayerCompletedTask", handlePlayerCompletedTask);
        signalRModel.connection.current?.on("PlayerCanceledTask", handlePlayerCanceledTask);
        signalRModel.connection.current?.on("PlayerLeft", handlePlayerLeft);

        return () => {
            signalRModel.connection.current?.off("PlayerCompletedTask", handlePlayerCompletedTask);
            signalRModel.connection.current?.off("PlayerCanceledTask", handlePlayerCanceledTask);
            signalRModel.connection.current?.off("PlayerLeft", handlePlayerLeft);
        };
    }, []);

    if (completedPlayersRef.current === 0) {
        return null;
    }
    return (
        <div style={props.style} className="player-complete-counter">
            <h1>{completedPlayers}/{totalPlayers}</h1>
            <CheckCircleOutlined className="icon" />
        </div>
    );
});
