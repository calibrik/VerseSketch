import { createContext, FC, ReactNode, useContext, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { leave } from "../misc/MiscFunctions";
import { useErrorDisplayContext } from "./ErrorDisplayProvider";
import { Event } from "../misc/Event";
import { useNavigate } from "react-router";
interface ISignalRProviderProps {
    children:ReactNode
};
export interface IRoomModel{
    title:string;
    playersCount:number;
    maxPlayersCount:number;
    players:IPlayerModel[];
    timeToDraw:number;
    isPublic:boolean;
    isPlayerAdmin:boolean;
    playerId:string;
    stage:number;
}
export interface IPlayerModel{
    nickname:string;
    id:string;
    isAdmin:boolean;
}

export interface ISignalRProviderModel {
    connection:React.RefObject<signalR.HubConnection | null>;
    createConnection: (accessToken: string, roomTitle: string) => void;
    stopConnection: () => void;
    updateTrigger: React.RefObject<Event<[IRoomModel]>>;
    roomModelRef: React.RefObject<IRoomModel | null>;
}

const SignalRContext=createContext<ISignalRProviderModel | null>(null);

export const SignalRProvider: FC<ISignalRProviderProps> = (props) => {

    const connection = useRef<signalR.HubConnection | null>(null);
    const errorModals=useErrorDisplayContext();
    const updateTrigger = useRef<Event<[IRoomModel]>>(new Event<[IRoomModel]>());
    const isRecconecting=useRef<boolean>(false);
    const roomModelRef = useRef<IRoomModel | null>(null);
    const navigate=useNavigate();

    function createConnection(accessToken: string, roomTitle: string) {
        if (connection.current) { 
            stopConnection();
        }
        connection.current = new signalR.HubConnectionBuilder()
            .withUrl(`${ConnectionConfig.Api}/rooms/roomHub?roomTitle=${roomTitle}&access_token=${accessToken}`)
            // .configureLogging("none")
            .withAutomaticReconnect([0,5000,10000,10000])
            .build();
        connection.current.on("PlayerJoined", onPlayerJoined);
        connection.current.on("PlayerLeft", onPlayerLeft);
        connection.current.on("RoomDeleted",onRoomDeleted);
        connection.current.on("PlayerKicked",onPlayerKicked);
        connection.current.on("ReceiveRoom", onRoomReceive);
        connection.current.on("StageSet", onStageSet);
        connection.current.onreconnecting(onRecconnect);
        connection.current.onreconnected(onRecconnected);
        connection.current.onclose(onConnectionClose);
    }
    function stopConnection(){
        if (connection.current) {
            connection.current?.invoke("Leave");
            connection.current=null;
        }
    }
    function onPlayerJoined(data:IPlayerModel) {
        if (!roomModelRef.current||roomModelRef.current.playerId==data.id)
            return;
        roomModelRef.current.players.push(data);
        roomModelRef.current.playersCount++;
        updateTrigger.current.invoke(roomModelRef.current);
    }

    async function onRoomReceive(data:IRoomModel) {
        console.log("Room received",data);
        if (roomModelRef.current && data.stage!=roomModelRef.current.stage)
            onStageSet(data.stage);
        roomModelRef.current = data;
        updateTrigger.current.invoke(roomModelRef.current);
    }

    function onPlayerKicked(playerId:string) {
        if (!roomModelRef.current||playerId!=roomModelRef.current.playerId)
            return;
        leave({connection:connection,roomModelRef:roomModelRef,createConnection:createConnection,stopConnection:stopConnection, updateTrigger:updateTrigger});
        errorModals.errorModal.current?.show("You have been kicked out of room.");
    }

    function onPlayerLeft(playerId:string){
        if (!roomModelRef.current)
            return;
        let i=0;
        for (;i<roomModelRef.current.players.length;i++)
        {
            if (roomModelRef.current.players[i].id==playerId)
                break;
        }
        roomModelRef.current.playersCount--;
        roomModelRef.current.players.splice(i,1);
        updateTrigger.current.invoke(roomModelRef.current);
    }
    function onRoomDeleted()
    {
        leave({connection:connection,roomModelRef:roomModelRef,createConnection:createConnection,stopConnection:stopConnection,updateTrigger:updateTrigger});
        errorModals.errorModal.current?.show("Admin has left the room.");
    }
    function onConnectionClose(error?:any)
    {
        console.log("Connection closed",error);
        errorModals.statusModal.current?.close();
        if (error||isRecconecting.current)
            errorModals.errorModal.current?.show("Lost connection to the server.");
        sessionStorage.removeItem("player")
    }
    function onRecconnect(){
        console.log("Reconnecting to the server...");
        isRecconecting.current=true;
        errorModals.statusModal.current?.show("Reconnecting to the server...");
    }
    function onRecconnected(){
        console.log("Reconnected to the server.");
        isRecconecting.current=false;
        errorModals.statusModal.current?.close();
    }
    function onStageSet(stage:number){
      console.log("Stage set to", stage);
      if (stage==-1) {
          navigate(`/room/${roomModelRef.current?.title}`,{replace:true});
          return;
      }
      if (stage==0){
          navigate("/insert-lyrics",{replace:true});
          return;
      }
      navigate("/draw",{replace:true});
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
