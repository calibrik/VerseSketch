import { Card, Col, Divider, Flex, List, Row, Select, Switch } from "antd";
import { FC, useEffect, useRef, useState } from "react";
import { Color } from "../misc/colors";
import { Spinner } from "../components/Spinner";
import { StartGameButton } from "../components/StartGameButton";
import Title from "antd/es/typography/Title";

interface IRoomPageProps {};
interface IPlayerModel{
    nickname:string;
    id:string;
    isAdmin:boolean;
}
interface IRoomModel{
    title:string;
    id:string;
    playerCount:number;
    maxPlayersCount:number;
    players:IPlayerModel[];
    timeToDraw?:number;
    isPublic?:boolean;
}
export const RoomPage: FC<IRoomPageProps> = () => {
    const [model, setModel] = useState<IRoomModel|null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const switchLabelRef = useRef<HTMLLabelElement | null>(null);

    let selectionItems=[];
    for (let i=2;i<=10;i++){
        selectionItems.push({label:`${i} Players`,value:i});
    }

    async function loadData() {
        if (loading) return;
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        let newData: IRoomModel = {
            title: `room name`,
            id: `1`,
            playerCount: 6,
            maxPlayersCount: 10,
            players:[{nickname:"Admin",id:"1",isAdmin:true}]
        };
        for (let i=0;i<newData.playerCount-1;i++) {
            const newPlayer: IPlayerModel = {
                nickname: `player ${i}`,
                id: `${i}`,
                isAdmin: false
            };
            newData.players.push(newPlayer);
        }   
        for (let i=0;i<newData.maxPlayersCount-newData.playerCount;i++) {
            newData.players.push({nickname:"",id:"",isAdmin:false} as IPlayerModel);
        }   
        setLoading(false);
        setModel(newData);
        document.title = newData.title;
    }
    
    function onTimeToDrawChange(value:number) {
        setModel((prevModel) => prevModel?({...prevModel,timeToDraw:value}):null);
    }
    function onMaxPlayersChange(value:number) {
        let players=model?.players;
        if (players) {
            while (players.length < value) {
                players.push({nickname:"",id:"",isAdmin:false} as IPlayerModel);
            }
            let playerCount=model?.playerCount ?? 0;
            if (players.length > value) {
                players = players.slice(0, value);
                playerCount = value;
            }
            setModel((prevModel) => prevModel ? ({ ...prevModel,playerCount:playerCount,players: players ?? [], maxPlayersCount: value }) : null);
        }
    }
    function onSwitchChange(checked:boolean)
    {
        switchLabelRef.current!.innerText=checked?"Public room":"Private room";
        setModel((prevModel) => prevModel ? ({ ...prevModel, isPublic: checked }) : null);
    }

    useEffect(() => {
        console.log("rerender",model);
    });
    useEffect(() => {
        document.title = "Room";
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
                                    Creative Solutions Meeting Space
                                </span>
                            </div>

                            <div style={{width:"50%",display:"flex",justifyContent:"flex-end"}}>
                                <span className="placeholder-text">
                                    Players {model?.playerCount ?? 0}/{model?.maxPlayersCount ?? 0}
                                </span>
                            </div>
                        </div>
                    }
                    loadMore={loading ? <Spinner style={{ margin: '15px' }} /> : ""}
                    locale={{ emptyText: <span className="placeholder-text">Loading...</span>}}
                    dataSource={model?.players ?? []}
                    renderItem={(player) => {
                        console.log(player);
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
                                    disabled={loading}
                                    onChange={onMaxPlayersChange}/>
                                </div>
                                <div style={{display:"flex",flexDirection:"column"}}>
                                    <label style={{color:Color.Secondary}}>Time to draw</label>
                                    <Select
                                    className="input-field"
                                    options={[{label:"10s",value:10},{label:"15s",value:15},{label:"30s",value:30},{label:"1m",value:60}]}
                                    value={model?.timeToDraw ?? 10}
                                    disabled={loading}
                                    onChange={onTimeToDrawChange}/>
                                </div>
                                <div style={{display:"flex",flexDirection:"row",alignItems:"center",alignContent:"center"}}>
                                    <label ref={switchLabelRef} style={{color:Color.Secondary,fontSize:20,marginRight:10}}>Public room</label>
                                    <Switch disabled={loading} onChange={onSwitchChange} defaultChecked={true} />
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
