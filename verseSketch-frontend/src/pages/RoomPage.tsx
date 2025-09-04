import { Card, Col, Divider, Flex, Row, Select, Switch } from "antd";
import { FC, useEffect, useRef, useState } from "react";
import { Color } from "../misc/colors";
import { StartGameButton } from "../components/buttons/StartGameButton";
import Title from "antd/es/typography/Title";
import { useNavigate, useParams } from "react-router";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { InviteButton } from "../components/buttons/InviteButton";
import { RoomModel, useSignalRConnectionContext } from "../components/SignalRProvider";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";
import '../index.css';
import { LeaveRoomButton } from "../components/buttons/LeaveRoomButton";
import { leave } from "../misc/MiscFunctions";
import { PlayersList } from "../components/PlayersList";

interface IRoomPageProps {};


interface ISetParamsModel{
    maxPlayersCount?:number;
    timeToDraw?:number;
    isPublic?:boolean;
    roomTitle?:string;
}
export const RoomPage: FC<IRoomPageProps> = () => {
    const [model, setModel] = useState<RoomModel | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const switchLabelRef = useRef<HTMLLabelElement | null>(null);
    const {roomTitle} = useParams();
    const signalRModel=useSignalRConnectionContext();
    const errorModals=useErrorDisplayContext();
    const navigate=useNavigate();

    let selectionItems=[];
    for (let i=2;i<=10;i++){
        selectionItems.push({label:`${i} Players`,value:i});
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
            throw (data.message);
        }
    }

    function applyParams(data:ISetParamsModel) {
        if (!signalRModel.roomModelRef.current) return;

        if (data.maxPlayersCount && data.maxPlayersCount!=signalRModel.roomModelRef.current.maxPlayersCount) {
            if (signalRModel.roomModelRef.current.playingPlayersCount>data.maxPlayersCount) {
                throw ("Cannot set max players count lower than current players count!"); 
            }
        }

        if (data.maxPlayersCount!=null)
            signalRModel.roomModelRef.current.maxPlayersCount=data.maxPlayersCount;
        if (data.isPublic!=null)
            signalRModel.roomModelRef.current.isPublic=data.isPublic;
        if (data.timeToDraw!=null)
            signalRModel.roomModelRef.current.timeToDraw=data.timeToDraw;
        setModel({...signalRModel.roomModelRef.current});
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
        if (!signalRModel.roomModelRef.current||!signalRModel.roomModelRef.current.isPlayerAdmin) return;

        params.roomTitle=roomTitle;
        let oldModel:RoomModel=signalRModel.roomModelRef.current;
        try{
            applyParams(params);
        }
        catch (e:any) {
            errorModals.errorModalClosable.current?.show(e);
            setModel(oldModel);
            return;
        }
        // if (connection.current?.state!="Connected") return;
        signalRModel.connection.current?.invoke("SendParams", params)
            .catch((_) => {
                errorModals.errorModalClosable.current?.show("An error occurred while trying to proccess request on server.");
                setModel(oldModel);
            });
    }
    async function onInvite()
    {
        if (!signalRModel.roomModelRef.current||!signalRModel.roomModelRef.current.isPlayerAdmin)
            return;
        let data;
        try {
            data=await signalRModel.connection.current?.invoke<string>("GenerateJoinToken", roomTitle);
        }
        catch (error:any) {
            errorModals.errorModalClosable.current?.show("An error occurred while trying to generate join link.");
            return;
        }
        try{
            await navigator.clipboard.writeText(`${window.location.origin}/join-room/by-link/${data}`);
        }
        catch (e:any) {
            errorModals.errorModalClosable.current?.show(`Link: ${window.location.origin}/join-room/by-link/${data}`);
            return;
        }
    }

    async function onLeave()
    {
        leave(signalRModel);
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

    async function StartGame(){
        if (signalRModel.roomModelRef.current==null) {
            errorModals.errorModalClosable.current?.show("Room is not loaded yet.");
            return;
        }
        if (signalRModel.roomModelRef.current?.playingPlayersCount<2) {
            errorModals.errorModalClosable.current?.show("You need at least 2 players to start the game.");
            return;
        }
        try {
            await signalRModel.connection.current?.invoke("StartGame");
        }
        catch (e:any) {
            errorModals.errorModalClosable.current?.show("An error occurred while trying to start the game.");
        }
    }

    // useEffect(() => {
    //     console.log("rerender model",signalRModel.roomModelRef.current);
    // },[model]);

    function triggerUpdate() {
        // console.log("trigger update from upstairs");
        if (!signalRModel.roomModelRef.current)
            setModel(null);
        else
            setModel({...signalRModel.roomModelRef.current});
    }

    useEffect(() => {
        document.title = roomTitle ?? "Room";
        signalRModel.updateTrigger.current.on(triggerUpdate);
        // console.log("remount")
        if (!signalRModel.connection.current|| !signalRModel.roomModelRef.current || signalRModel.roomModelRef.current?.title !== roomTitle) {
            setLoading(true);
            signalRModel.stopConnection();
            initLoad()
                .then(async () => {
                    signalRModel.createConnection(sessionStorage.getItem("player") ?? "",roomTitle ?? "");
                    
                    if (!signalRModel.connection.current)
                        return;
                    signalRModel.connection.current.keepAliveIntervalInMilliseconds=3000;
                    signalRModel.connection.current.serverTimeoutInMilliseconds=5000;
                    signalRModel.connection.current?.on("ReceiveParams", onReceiveParams);
                    try{
                        await signalRModel.connection.current.start();
                        await signalRModel.connection.current.invoke("Join", roomTitle);
                    }
                    catch(_){
                        await leave(signalRModel);
                        errorModals.errorModal.current?.show("An error occurred while trying to connect to the room.");
                    }
                    setLoading(false);
                })
                .catch(async (error) => {
                    await leave(signalRModel);
                    setLoading(false);
                    errorModals.errorModal.current?.show(error);
                });
        }
        else{
            signalRModel.connection.current.on("ReceiveParams", onReceiveParams);
            setModel({...signalRModel.roomModelRef.current});
        }
        return () => {
            signalRModel.connection.current?.off("ReceiveParams", onReceiveParams);
            signalRModel.updateTrigger.current.off(triggerUpdate);
        }
    }, []);

    return (
        <div className="container-mid" style={{height:"100%"}}>
            <div style={{marginTop:"1vh",width:'100%',display:'flex',justifyContent:'right'}}>
                <LeaveRoomButton onClick={onLeave}/>
            </div>
            <Row className="room-table" style={{marginTop:"1vh"}} gutter={[{ xs: 8, sm: 16, md: 24, lg: 50 }, { xs: 8, sm: 16, md: 24, lg: 46 }]}>
                <Col xs={24} md={6} xxl={4}>
                    <PlayersList 
                        isPlayerAdmin={model?.isPlayerAdmin ?? false}
                        roomTitle={model?.title ?? ""}
                        players={model?.players ?? []}
                        loading={loading}
                        playersCount={model?.actualPlayersCount ?? 0}
                        maxPlayersCount={model?.maxPlayersCount ?? 0}
                        selectedPlayerId={model?.playerId ?? ""}
                        showKickButton
                        showEmptySlots/>
                </Col>
                <Col xs={24} md={18} xxl={20}>
                    <Card className="room-card" title={<Title className="card-title">Rules:</Title>}>
                        <div className="card-content">
                            <p className="card-text">Each player picks a song they love and selects 2 × (n - 1) lines from the lyrics, where n is the number of players. Then, everyone takes turns drawing pictures based on two lines from each other’s songs.</p>
                            <p className="card-text">Once all the drawings are done, the final compilation plays, each song is showcased along with the images created by the group, bringing the lyrics to life!</p>
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
                                        options={[{label:"10s",value:10},{label:"20s",value:20},{label:"30s",value:30},{label:"45s",value:45},{label:"1m",value:60},{label:"1.5m",value:90}]}
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
            <StartGameButton isAdmin={model?.isPlayerAdmin??false} onClick={StartGame} style={{marginTop:"2vh"}}/>
        </div>
    );
}
