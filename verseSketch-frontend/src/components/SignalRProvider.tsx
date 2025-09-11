import { createContext, FC, ReactNode, useContext, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { leave } from "../misc/MiscFunctions";
import { useErrorDisplayContext } from "./ErrorDisplayProvider";
import { Event } from "../misc/Event";
import { useNavigate } from "react-router";
interface ISignalRProviderProps {
    children: ReactNode
};
enum LeaveReasons{
    Disconnected,
    Kicked
}
export type RoomModel = {
    title: string;
    playingPlayersCount: number;
    actualPlayersCount: number;
    maxPlayersCount: number;
    players: PlayerModel[];
    timeToDraw: number;
    isPublic: boolean;
    isPlayerAdmin: boolean;
    playerId: string;
    stage: number;
    currDone:number
}
export type PlayerModel = {
    nickname: string;
    id: string;
    isAdmin: boolean;
}

export interface ISignalRProviderModel {
    connection: React.RefObject<signalR.HubConnection | null>;
    createConnection: (accessToken: string, roomTitle: string) => void;
    stopConnection: () => void;
    updateTrigger: React.RefObject<Event>;
    roomModelRef: React.RefObject<RoomModel | null>;
}

const SignalRContext = createContext<ISignalRProviderModel | null>(null);

export const SignalRProvider: FC<ISignalRProviderProps> = (props) => {

    const connection = useRef<signalR.HubConnection | null>(null);
    const errorModals = useErrorDisplayContext();
    const updateTrigger = useRef<Event>(new Event());
    const isRecconecting = useRef<boolean>(false);
    const roomModelRef = useRef<RoomModel | null>(null);
    const navigate = useNavigate();

    function createConnection(accessToken: string, roomTitle: string) {
        if (connection.current) {
            stopConnection();
        }
        connection.current = new signalR.HubConnectionBuilder()
            .withUrl(`${ConnectionConfig.Api}/rooms/roomHub?roomTitle=${roomTitle}&access_token=${accessToken}`)
            .configureLogging("none")
            .withAutomaticReconnect([0, 3000, 3000, 3000, 3000])
            .build();
        connection.current.on("PlayerJoined", onPlayerJoined);
        connection.current.on("PlayerLeft", onPlayerLeft);
        connection.current.on("RoomDeleted", onRoomDeleted);
        connection.current.on("ReceiveRoom", onRoomReceive);
        connection.current.on("StageSet", onStageSet);
        connection.current.on("ReceivePlayerList", onReceivePlayerList);
        connection.current.on("ReceiveErrorMessage", onReceiveErrorMessage);
        connection.current.onreconnecting(onRecconnect);
        connection.current.onreconnected(onRecconnected);
        connection.current.onclose(onConnectionClose);
    }

    function onReceiveErrorMessage(msg: string,isTerminal:boolean) {
        if (isTerminal)
            errorModals.errorModal.current?.show(msg);
        else
            errorModals.errorModalClosable.current?.show(msg);
    }
    function onReceivePlayerList(players: PlayerModel[]) {
        if (!roomModelRef.current)
            return;
        roomModelRef.current.players = players
        roomModelRef.current.playingPlayersCount=roomModelRef.current.actualPlayersCount=players.length;
        updateTrigger.current.invoke();
    }
    function stopConnection() {
        if (connection.current) {
            connection.current?.invoke("Leave");
            connection.current = null;
            roomModelRef.current = null;
        }
    }
    function onRoomDeleted(reason: string) {
        leave({ connection: connection, roomModelRef: roomModelRef, createConnection: createConnection, stopConnection: stopConnection, updateTrigger: updateTrigger });
        errorModals.errorModal.current?.show(reason);
    }

    function onPlayerJoined(data: PlayerModel) {
        if (!roomModelRef.current)
            return;
        roomModelRef.current.players.push(data);
        roomModelRef.current.playingPlayersCount++;
        roomModelRef.current.actualPlayersCount++;
        updateTrigger.current.invoke(roomModelRef.current);
    }

    async function onRoomReceive(data: RoomModel) {
        if (roomModelRef.current && data.stage != roomModelRef.current.stage)
            onStageSet(data.stage);
        roomModelRef.current = data;
        updateTrigger.current.invoke();
    }

    function onPlayerLeft(playerId: string, isInGame: boolean,reason:LeaveReasons) {
        if (!roomModelRef.current)
            return;
        if (playerId==roomModelRef.current.playerId) {
            leave({ connection: connection, roomModelRef: roomModelRef, createConnection: createConnection, stopConnection: stopConnection, updateTrigger: updateTrigger });
            if (reason==LeaveReasons.Disconnected)
                errorModals.errorModal.current?.show("Lost connection to server.");
            if (reason==LeaveReasons.Kicked)
                errorModals.errorModal.current?.show("You have been kicked.");
        }
        if (isInGame) {
            roomModelRef.current.playingPlayersCount--;
            updateTrigger.current.invoke();
            return;
        }
        let i = roomModelRef.current.players.findIndex(p => p.id === playerId);
        roomModelRef.current.playingPlayersCount--;
        roomModelRef.current.actualPlayersCount--;
        roomModelRef.current.players.splice(i, 1);
        updateTrigger.current.invoke();
    }

    function onConnectionClose(error?: any) {
        connection.current = null;
        roomModelRef.current = null;
        errorModals.statusModal.current?.close();
        if (error || isRecconecting.current) {
            errorModals.errorModal.current?.show("Lost connection to the server.");
        }
        updateTrigger.current.invoke();
        leave({ connection: connection, roomModelRef: roomModelRef, createConnection: createConnection, stopConnection: stopConnection, updateTrigger: updateTrigger });
    }
    function onRecconnect() {
        isRecconecting.current = true;
        errorModals.statusModal.current?.show("Reconnecting to the server...");
    }
    function onRecconnected() {
        isRecconecting.current = false;
        errorModals.statusModal.current?.close();
    }
    function onStageSet(stage: number) {
        if (!roomModelRef.current)
            return;
        roomModelRef.current.stage = stage;
        if (stage == -1) {
            navigate(`/room/${roomModelRef.current?.title}`, { replace: true });
            return;
        }
        if (stage == 0) {
            navigate("/insert-lyrics", { replace: true });
            return;
        }
        if (stage == roomModelRef.current.actualPlayersCount) {
            navigate("/showcase", { replace: true });
            return;
        }
        if (stage == 1) {
            navigate(`/draw`, { replace: true });
            return;
        }
    }

    return (
        <SignalRContext.Provider value={{
            connection: connection,
            createConnection: createConnection,
            stopConnection: stopConnection,
            roomModelRef: roomModelRef,
            updateTrigger: updateTrigger,
        }}>
            {props.children}
        </SignalRContext.Provider>
    );
}

export const useSignalRConnectionContext = () => {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error('useSignalRConnection must be used within a SignalRProvider');
    }
    return context;
};
