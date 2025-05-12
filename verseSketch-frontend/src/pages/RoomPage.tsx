import { Card, Col, Divider, Flex, List, Row, Select, Switch } from "antd";
import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { Color } from "../misc/colors";
import { Spinner } from "../components/Spinner";
import { StartGameButton } from "../components/buttons/StartGameButton";
import Title from "antd/es/typography/Title";
import { useNavigate, useParams } from "react-router";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import * as signalR from "@microsoft/signalr";
import { InviteButton } from "../components/buttons/InviteButton";
import { useSignalRConnectionContext } from "../components/SignalRProvider";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";
import '../index.css';
import { LeaveRoomButton } from "../components/buttons/LeaveRoomButton";
import { leave } from "../misc/MiscFunctions";
import { StarFilled } from "@ant-design/icons";
import { KickButton } from "../components/buttons/KickButton";

interface IRoomPageProps {};
interface IPlayerModel{
    nickname:string;
    id:string;
    isAdmin:boolean;
}
interface IRoomModel{
    title:string;
    playersCount:number;
    maxPlayersCount:number;
    players:IPlayerModel[];
    timeToDraw:number;
    isPublic:boolean;
    isPlayerAdmin:boolean;
    playerId:string;
}
interface ISetParamsModel{
    maxPlayersCount?:number;
    timeToDraw?:number;
    isPublic?:boolean;
    roomTitle?:string;
}
export const RoomPage: FC<IRoomPageProps> = () => {
    const [model, setModel] = useState<IRoomModel|null>(null);
    const modelRef=useRef<IRoomModel|null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const switchLabelRef = useRef<HTMLLabelElement | null>(null);
    const {roomTitle} = useParams();
    const connection=useSignalRConnectionContext();
    const errorModals=useErrorDisplayContext();
    const navigate=useNavigate();
    const isRecconecting=useRef<boolean>(false);

    let selectionItems=[];
    for (let i=2;i<=10;i++){
        selectionItems.push({label:`${i} Players`,value:i});
    }

    function onRoomReceive(data:IRoomModel) {
        for (let i=0;i<data.maxPlayersCount-data.playersCount;i++) {
            data.players.push({nickname:"",id:"",isAdmin:false} as IPlayerModel);
        }
        setModel(data);
    }

    function onPlayerJoined(data:IPlayerModel) {
        if (!modelRef.current||modelRef.current.playerId==data.id)
            return;
        let newModel={...modelRef.current};
        let i=0;
        for (;i<newModel?.players.length;i++)
        {
            if (newModel.players[i].id=="")
                break;
        }
        newModel.playersCount++;
        newModel.players[i]=data;
        setModel(newModel);
    }

    function onPlayerKicked(playerId:string) {
        if (!modelRef.current||playerId!=modelRef.current.playerId)
            return;
        leave(connection);
        errorModals.errorModal.current?.show("You have been kicked out of room.");
    }

    function onPlayerLeft(playerId:string){
        if (!modelRef.current)
            return;
        let newModel={...modelRef.current};
        let i=0;
        for (;i<newModel?.players.length;i++)
        {
            if (newModel.players[i].id==playerId)
                break;
        }
        newModel.playersCount--;
        newModel.players.splice(i,1);
        newModel.players.push({nickname:"",id:"",isAdmin:false} as IPlayerModel);
        setModel(newModel);
    }

    async function initLoad()
    {
        let response=null;
        try{
            response=await fetch(`${ConnectionConfig.Api}/rooms/isRoomAccessible?${new URLSearchParams({
                roomTitle: roomTitle??"",
                })}`,{
                method:"GET",
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${sessionStorage.getItem("player")}`
                }
            });
        }
        catch(_:any){
            throw("No connection to the server.")
        }
        if (!response.ok) {
            let data=await response?.json();
            console.log(data.message,response.status);
            throw (data.message);
        }
    }

    function applyParams(data:ISetParamsModel) {
        if (!modelRef.current) return;

        if (data.maxPlayersCount && data.maxPlayersCount!=modelRef.current.maxPlayersCount) {
            if (modelRef.current.playersCount>data.maxPlayersCount) {
                throw ("Cannot set max players count lower than current players count!"); 
            }
            let players=modelRef.current.players;
            while (players.length < data.maxPlayersCount) {
                players.push({nickname:"",id:"",isAdmin:false} as IPlayerModel);
            }
            if (players.length > data.maxPlayersCount) {
                players.splice(data.maxPlayersCount, players.length - data.maxPlayersCount);
            }
        }

        let newModel:IRoomModel={...modelRef.current};
        newModel.maxPlayersCount=data.maxPlayersCount??modelRef.current.maxPlayersCount;
        newModel.isPublic=data.isPublic??modelRef.current.isPublic;
        newModel.timeToDraw=data.timeToDraw??modelRef.current.timeToDraw;
        setModel(newModel);
    }

    function onReceiveParams(data:ISetParamsModel) {
        try{
            applyParams(data);
        }
        catch (e) {
            return;
        }
    }

    function onChangeParams(params:ISetParamsModel) {
        if (!model||!model.isPlayerAdmin) return;

        params.roomTitle=roomTitle;
        let oldModel:IRoomModel=model;
        try{
            applyParams(params);
        }
        catch (e:any) {
            errorModals.errorModalClosable.current?.show(e);
            setModel(oldModel);
            return;
        }
        // if (connection.current?.state!="Connected") return;
        connection.current?.invoke("SendParams", params)
            .catch((_) => {
                errorModals.errorModalClosable.current?.show("An error occurred while trying to proccess request on server.");
                setModel(oldModel);
            });
    }
    async function onInvite()
    {
        if (!model||!model.isPlayerAdmin)
            return;
        let response: Response | null;
        try{
            response=await fetch(`${ConnectionConfig.Api}/rooms/generateJoinToken?${new URLSearchParams({
                roomTitle: roomTitle??"",
            })}`,{
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":`Bearer ${sessionStorage.getItem("player")}`
                },
            });
        }
        catch (error:any)
        {
            errorModals.errorModalClosable.current?.show("No connection to the server.");
            return;
        }
        let data=await response?.json();
        if (!response.ok){
            errorModals.errorModalClosable.current?.show(data.message);
        }
        await navigator.clipboard.writeText(`${window.location.origin}/join-room/by-link/${data.joinToken}`);
    }

    async function onLeave()
    {
        leave(connection);
        navigate("/",{replace:true});
    }
    
    function onTimeToDrawChange(value:number) {
        onChangeParams({timeToDraw:value});
    }
    function onMaxPlayersChange(value:number) {
        onChangeParams({maxPlayersCount:value});
    }
    function onSwitchChange(checked:boolean) {
        onChangeParams({isPublic:checked});
    }
    async function onRoomDeleted()
    {
        leave(connection);
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

    // useEffect(() => {
    //     console.log("rerender",model);
    // });

    useEffect(() => {
        modelRef.current=model;
    }, [model]);


    useEffect(() => {
        document.title = roomTitle ?? "Room";
        console.log("remount")
        setLoading(true);
        initLoad()
            .then(async () => {
                connection.current = new signalR.HubConnectionBuilder()
                    .withUrl(`${ConnectionConfig.Api}/rooms/roomHub?roomTitle=${roomTitle}&access_token=${sessionStorage.getItem("player")}`)
                    // .configureLogging("none")
                    .withAutomaticReconnect([0,5000,10000,10000])
                    .build();
                
                connection.current.keepAliveIntervalInMilliseconds=3000;
                connection.current.serverTimeoutInMilliseconds=5000;

                connection.current.on("ReceiveRoom", onRoomReceive);
                connection.current.on("ReceiveParams", onReceiveParams);
                connection.current.on("PlayerJoined", onPlayerJoined);
                connection.current.on("PlayerLeft", onPlayerLeft);
                connection.current.on("RoomDeleted",onRoomDeleted);
                connection.current.on("PlayerKicked",onPlayerKicked);
                connection.current.onreconnecting(onRecconnect);
                connection.current.onreconnected(onRecconnected);
                connection.current.onclose(onConnectionClose);

                try{
                    await connection.current.start();
                    connection.current.invoke("Join", roomTitle);
                }
                catch(_){
                    await leave(connection);
                    errorModals.errorModal.current?.show("An error occurred while trying to connect to the room.");
                }
                setLoading(false);
            })
            .catch(async (error) => {
                await leave(connection);
                setLoading(false);
                errorModals.errorModal.current?.show(error);
            });
    }, []);

    return (
        <div className="container-mid" style={{height:"100%"}}>
            <div style={{marginTop:"1vh",width:'100%',display:'flex',justifyContent:'right'}}>
                <LeaveRoomButton onClick={onLeave}/>
            </div>
            <Row className="room-table" style={{marginTop:"1vh"}} gutter={[{ xs: 8, sm: 16, md: 24, lg: 50 }, { xs: 8, sm: 16, md: 24, lg: 46 }]}>
                <Col xs={24} md={8}>
                <List
                    className="player-list"
                    header={
                        <div style={{width:"100%",display:"flex",marginBottom:10}}>
                            <div style={{ width: "50%" }}>
                                <span className="room-title">
                                    {roomTitle}
                                </span>
                            </div>

                            <div style={{width:"50%",display:"flex",justifyContent:"flex-end"}}>
                                <span className="placeholder-text">
                                    Players {model?.playersCount ?? 0}/{model?.maxPlayersCount ?? 0}
                                </span>
                            </div>
                        </div>
                    }
                    loadMore={loading ? <Spinner style={{ margin: '15px' }} /> : ""}
                    locale={{ emptyText: <span className="placeholder-text">Loading...</span>}}
                    dataSource={model?.players ?? []}
                    renderItem={(player) => {
                        let suffix:ReactNode|null=null;
                        if (player.isAdmin)
                            suffix=<StarFilled className="button-icon" style={{marginRight:10}}/>;
                        else if (model?.isPlayerAdmin)
                            suffix=<KickButton style={{marginRight:10}} playerId={player.id} roomTitle={roomTitle}/>
                        if (player.id === "")
                            return(
                                <List.Item className="player-field">
                                <span className="player-placeholder-text">
                                    Player slot
                                </span>
                                </List.Item>);
                        return (
                        <List.Item className={model?.playerId==player.id?"player-selected-field":"player-field"}>
                        <span className="player-nickname-text">
                            {player.nickname}
                        </span>
                        {suffix}
                        </List.Item>);
                    }}
                    />
                </Col>
                <Col xs={24} md={16}>
                    <Card className="room-card" title={<Title className="card-title">Rules:</Title>}>
                        <div className="card-content">
                            <p className="card-text">Each player picks a song they love and selects 2 × (n - 1) lines from the lyrics, where n is the number of players. Then, everyone takes turns drawing pictures based on two lines from each other’s songs.</p>
                            <p className="card-text">Once all the drawings are done, the final compilation plays—each song is showcased along with the images created by the group, bringing the lyrics to life!</p>
                        </div>
                        <div className="card-footer">
                            <Divider style={{background:Color.Secondary}}/>
                            <Flex gap={"2vw"} wrap align="center" style={{width:"100%"}}>
                                <div style={{display:"flex",flexDirection:"column"}}>
                                    <label className="input-field-label">Max. Players</label>
                                    <Select
                                        className="input-field"
                                        options={selectionItems}
                                        value={model?.maxPlayersCount ?? 2}
                                        disabled={loading||!model?.isPlayerAdmin}
                                        onChange={onMaxPlayersChange}/>
                                </div>
                                <div style={{display:"flex",flexDirection:"column",alignItems:"center",alignContent:"center"}}>
                                    <label className="input-field-label">Time to draw</label>
                                    <Select
                                        className="input-field"
                                        options={[{label:"10s",value:10},{label:"15s",value:15},{label:"30s",value:30},{label:"1m",value:60}]}
                                        value={model?.timeToDraw ?? 10}
                                        disabled={loading||!model?.isPlayerAdmin}
                                        onChange={onTimeToDrawChange}/>
                                </div>
                                <div style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"center"}}>
                                    <label ref={switchLabelRef} className="input-field-label-bg" style={{marginRight:10}}>Public room</label>
                                    <Switch disabled={loading||!model?.isPlayerAdmin} onChange={onSwitchChange} value={model?.isPublic??true} />
                                </div>
                                <div style={{display:"flex",flexDirection:"row",alignItems:"center",alignContent:"center"}}>
                                    <InviteButton onClick={onInvite} disabled={loading||!model?.isPlayerAdmin}/>
                                </div>
                            </Flex>
                        </div>
                    </Card>
                </Col>
            </Row>
            <StartGameButton style={{marginTop:"3vh"}}/>
        </div>
    );
}
