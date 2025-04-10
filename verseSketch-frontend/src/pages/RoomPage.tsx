import { Card, Col, Divider, Flex, List, Row, Select, Switch } from "antd";
import { FC, useEffect, useRef, useState } from "react";
import { Color } from "../misc/colors";
import { Spinner } from "../components/Spinner";
import { StartGameButton } from "../components/StartGameButton";
import Title from "antd/es/typography/Title";
import { useNavigate, useParams } from "react-router";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { useCookies } from "react-cookie";

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
}
export const RoomPage: FC<IRoomPageProps> = () => {
    const [model, setModel] = useState<IRoomModel|null>(null);
    const navigate=useNavigate();
    const [cookies, setCookie, removeCookie] = useCookies(['player']);
    const [loading, setLoading] = useState<boolean>(false);
    const switchLabelRef = useRef<HTMLLabelElement | null>(null);
    const {roomTitle} = useParams();

    let selectionItems=[];
    for (let i=2;i<=10;i++){
        selectionItems.push({label:`${i} Players`,value:i});
    }

    async function loadData() {
        if (loading) return;
        setLoading(true);
        let response;
        try{
            response=await fetch(ConnectionConfig.Api+`/api/rooms&title=${roomTitle}`,{
                method:"GET",
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${cookies.player}`
                },
            })
        }
        catch (error: any) {
            console.error("There was a problem with the fetch operation:", error);
        }
        if (response?.status===404||response?.status===401) {
            navigate("/");
            return;
        }
        let data:IRoomModel=await response?.json();
        console.log(data);
        for (let i=0;i<data.maxPlayersCount-data.playersCount;i++) {
            data.players.push({nickname:"",id:"",isAdmin:false} as IPlayerModel);
        }   
        setLoading(false);
        setModel(data);
    }

    async function onChangeParams(params:ISetParamsModel) {
        let response;
        console.log("onChangeParams",JSON.stringify({...params,roomTitle:roomTitle}));
        try{
            response=await fetch(ConnectionConfig.Api+`/api/rooms/setParams`,{
                method:"PUT",
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${cookies.player}`
                },
                body:JSON.stringify({...params,roomTitle:roomTitle})
            });
        }
        catch (error: any) {
            console.error("There was a problem with the fetch operation:", error);
        }

        let data=await response?.json();
        if (!response?.ok)
        {
            console.error("Error:", data);
            return;
        }
        console.log("Success:", data);
    }
    
    function onTimeToDrawChange(value:number) {
        setModel((prevModel) => prevModel?({...prevModel,timeToDraw:value}):null);
        onChangeParams({timeToDraw:value});
    }
    function onMaxPlayersChange(value:number) {
        if (model?.playersCount&&model?.playersCount>value)
        {
            console.error("Cannot set max players count lower than current players count!"); 
            return;
        }
        let players=model?.players;
        if (players) {
            while (players.length < value) {
                players.push({nickname:"",id:"",isAdmin:false} as IPlayerModel);
            }
            setModel((prevModel) => prevModel ? ({ ...prevModel,players: players ?? [], maxPlayersCount: value }) : null);
            onChangeParams({maxPlayersCount:value});
        }
    }
    function onSwitchChange(checked:boolean)
    {
        switchLabelRef.current!.innerText=checked?"Public room":"Private room";
        setModel((prevModel) => prevModel ? ({ ...prevModel, isPublic: checked }) : null);
        onChangeParams({isPublic:checked});
    }

    useEffect(() => {
        console.log("rerender",model);
    });
    useEffect(() => {
        document.title = roomTitle ?? "Room";
        loadData();
    }, []);

    return (
        <div className="container-mid" style={{height:"100%"}}>
            <Row style={{width:"100%", height:"70%",marginTop:48}} gutter={50}>
                <Col md={8}>
                <List
                    className="player-list"
                    header={
                        <div style={{width:"100%",display:"flex"}}>
                            <div style={{ width: "50%" }}>
                                <span style={{ width: "100%", wordBreak: "break-word", whiteSpace: "normal", fontSize:20 }}>
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
