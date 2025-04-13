import { App, Card, Col, Divider, Flex, List, Row, Select, Switch } from "antd";
import { FC, useEffect, useRef, useState } from "react";
import { Color } from "../misc/colors";
import { Spinner } from "../components/Spinner";
import { StartGameButton } from "../components/StartGameButton";
import Title from "antd/es/typography/Title";
import { useNavigate, useParams } from "react-router";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { useCookies } from "react-cookie";
import * as signalR from "@microsoft/signalr";

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
    const navigate=useNavigate();
    const [cookies, setCookie, removeCookie] = useCookies(['player']);
    const [loading, setLoading] = useState<boolean>(false);
    const switchLabelRef = useRef<HTMLLabelElement | null>(null);
    const {roomTitle} = useParams();
    const connection = useRef<signalR.HubConnection | null>(null);

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
    function onReceivePlayerList(data:IPlayerModel[]) {
        if (!modelRef.current) return;
        onRoomReceive({...modelRef.current, players:data,playersCount:data.length});
    }

    async function initLoad()
    {
        setLoading(true);
        let response=await fetch(`${ConnectionConfig.Api}/api/rooms&roomTitle=${roomTitle}`,{
            method:"GET",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${cookies.player}`
            }
        });
        if (response.status===401||response.status===404) {
            throw (response);
        }
        let data:IRoomModel=await response?.json();
        onRoomReceive(data);
        setLoading(false);
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
            console.error(e);
            return;
        }
    }

    function onChangeParams(params:ISetParamsModel) {
        if (!model) return;

        params.roomTitle=roomTitle;
        let oldModel:IRoomModel=model;
        try{
            applyParams(params);
        }
        catch (e) {
            console.error(e);
            return;
        }
        if (connection.current?.state!="Connected") return;
        connection.current?.invoke("SendParams", params)
            .catch((error) => {
                console.error("Error sending params:", error);
                setModel(oldModel);
            });
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

    useEffect(() => {
        console.log("rerender",model);
    });

    useEffect(() => {
        modelRef.current=model;
    }, [model]);


    useEffect(() => {
        document.title = roomTitle ?? "Room";

        initLoad()
            .then(() => {
                connection.current = new signalR.HubConnectionBuilder()
                    .withUrl(`${ConnectionConfig.Api}/api/rooms/roomHub?roomTitle=${roomTitle}&access_token=${cookies.player}`)
                    .build();
                
                connection.current.on("ReceiveRoom", onRoomReceive);
                connection.current.on("ReceiveParams", onReceiveParams);
                connection.current.on("ReceivePlayerList", onReceivePlayerList);

                connection.current.start()
                    .then(() => {
                        console.log("Connected to SignalR hub");
                    })
                    .catch((error) => {
                        console.error("Error connecting to SignalR hub:", error);
                    });
            })
            .catch((error) => {
                console.error("Error loading room:", error);
                navigate("/");
            });
        return () => {connection.current?.state!="Connected"?null:connection.current?.stop();}
    }, []);

    return (
        <div className="container-mid" style={{height:"100%"}}>
            <Row style={{width:"100%", height:"70%",marginTop:48}} gutter={50}>
                <Col md={8}>
                <List
                    className="player-list"
                    header={
                        <div style={{width:"100%",display:"flex",marginBottom:10}}>
                            <div style={{ width: "50%" }}>
                                <span style={{ width: "100%", wordBreak: "break-word", whiteSpace: "normal", fontSize:25 }}>
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
                        if (player.id === "")
                            return(
                                <List.Item>
                                <List.Item.Meta
                                    title={
                                    <span className="placeholder-text" style={{ fontSize: 18 }}>
                                        Player spot
                                    </span>
                                    }
                                />
                                </List.Item>);
                        return (
                        <List.Item>
                        <List.Item.Meta
                            title={
                            <span style={{ color: Color.Secondary, fontSize: 18 }}>
                                {player.nickname}
                            </span>
                            }
                        />
                        </List.Item>);
                    }}
                    />
                </Col>
                <Col md={16}>
                    <Card className="room-card" title={<Title style={{textAlign:"center",color:Color.Secondary,fontSize:32}}>Rules:</Title>}>
                        <div className="card-content">
                            <p className="card-text">Each player picks a song they love and selects 2 × (n - 1) lines from the lyrics, where n is the number of players. Then, everyone takes turns drawing pictures based on two lines from each other’s songs.</p>
                            <p className="card-text">Once all the drawings are done, the final compilation plays—each song is showcased along with the images created by the group, bringing the lyrics to life!</p>
                        </div>
                        <Divider style={{background:Color.Secondary}}/>
                        <div className="card-footer">
                            <Flex gap={50}>
                                <div style={{display:"flex",flexDirection:"column"}}>
                                    <label style={{color:Color.Secondary}}>Max. Players</label>
                                    <Select
                                    className="input-field"
                                    options={selectionItems}
                                    value={model?.maxPlayersCount ?? 2}
                                    disabled={loading||!model?.isPlayerAdmin}
                                    onChange={onMaxPlayersChange}/>
                                </div>
                                <div style={{display:"flex",flexDirection:"column"}}>
                                    <label style={{color:Color.Secondary}}>Time to draw</label>
                                    <Select
                                    className="input-field"
                                    options={[{label:"10s",value:10},{label:"15s",value:15},{label:"30s",value:30},{label:"1m",value:60}]}
                                    value={model?.timeToDraw ?? 10}
                                    disabled={loading||!model?.isPlayerAdmin}
                                    onChange={onTimeToDrawChange}/>
                                </div>
                                <div style={{display:"flex",flexDirection:"row",alignItems:"center",alignContent:"center"}}>
                                    <label ref={switchLabelRef} style={{color:Color.Secondary,fontSize:20,marginRight:10}}>Public room</label>
                                    <Switch disabled={loading||!model?.isPlayerAdmin} onChange={onSwitchChange} value={model?.isPublic??true} />
                                </div>
                            </Flex>
                        </div>
                    </Card>
                </Col>
            </Row>
            <StartGameButton style={{marginTop:"100%"}}/>
        </div>
    );
}
