import { StarFilled } from "@ant-design/icons";
import { List } from "antd";
import { FC, ReactNode, useEffect, useState } from "react";
import { KickButton } from "./buttons/KickButton";
import { Spinner } from "./Spinner";
import { getWidthLevel, WindowLevel } from "../misc/MiscFunctions";
import { PlayerModel } from "./SignalRProvider";
interface IPlayersListProps {
    roomTitle: string;
    players:PlayerModel[];
    loading:boolean;
    playersCount:number
    maxPlayersCount:number;
    isPlayerAdmin?:boolean;
    selectedPlayerId:string;
    showKickButton?:boolean;
    showEmptySlots?:boolean
};

export const PlayersList: FC<IPlayersListProps> = (props) => {
    const [widthLevel,setWidthLevel] = useState<WindowLevel>(WindowLevel.XS);

    function onResize() {
        setWidthLevel(getWidthLevel());
    }

    useEffect(() => {
        onResize();
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
        }
    }
    , []);

    let players=[...props.players];
    if (props.showEmptySlots)
    {
        for (let i=players.length;i<props.maxPlayersCount;i++) {
            players.push({nickname:"",id:"",isAdmin:false});
        }
    }   

    if (widthLevel <= WindowLevel.SM) 
        return(
        <div className="player-list-mobile">
            <div style={{width:"100%",display:"flex",alignItems:"center",marginBottom:10}}>
                <div style={{ width: "50%" }}>
                    <span className="room-title">
                        {props.roomTitle}
                    </span>
                </div>

                <div style={{width:"50%",display:"flex",justifyContent:"flex-end"}}>
                    <span className="placeholder-text">
                        Players {props.playersCount}/{props.maxPlayersCount ?? 0}
                    </span>
                </div>
            </div>
            <div className="player-list-content">
                {
                    props.playersCount===0?<span className="placeholder-text">Loading...</span>:
                    players.map((player,i) => {
                        let suffix:ReactNode|null=null;
                        if (player.isAdmin)
                            suffix=<StarFilled style={{marginTop:"auto"}} className="button-icon"/>;
                        else if (props.showKickButton&&props.isPlayerAdmin)
                            suffix=<KickButton style={{marginTop:"auto"}} playerId={player.id} roomTitle={props.roomTitle}/>
                        if (player.id === "")
                            return(
                                <div key={i} className="list-item player-field">
                                    <span className="player-placeholder-text">
                                        Player slot
                                    </span>
                                </div>);
                        return (
                        <div key={i} className={`list-item ${props.selectedPlayerId==player.id ? "player-selected-field" : "player-field"}`}>
                            <span className="player-nickname-text">
                                {player.nickname}
                            </span>
                            {suffix}
                        </div>);
                    
                    })
                }
            </div>
        </div>
    );

    return (
        <List
            className="player-list"
            header={
                <div style={{width:"100%",display:"flex",marginBottom:10}}>
                    <div style={{ width: "50%" }}>
                        <span className="room-title">
                            {props.roomTitle}
                        </span>
                    </div>

                    <div style={{width:"50%",display:"flex",justifyContent:"flex-end"}}>
                        <span className="placeholder-text">
                            Players {props.playersCount}/{props.maxPlayersCount ?? 0}
                        </span>
                    </div>
                </div>
            }
            loadMore={props.loading ? <Spinner style={{ margin: '15px' }} /> : ""}
            locale={{ emptyText: <span className="placeholder-text">Loading...</span>}}
            dataSource={players}
            renderItem={(player) => {
                let suffix:ReactNode|null=null;
                if (player.isAdmin)
                    suffix=<StarFilled className="button-icon" style={{marginRight:10}}/>;
                else if (props.showKickButton&&props.isPlayerAdmin)
                    suffix=<KickButton style={{marginRight:10}} playerId={player.id} roomTitle={props.roomTitle}/>
                if (player.id === "")
                    return(
                        <List.Item className="player-field">
                        <span className="player-placeholder-text">
                            Player slot
                        </span>
                        </List.Item>);
                return (
                <List.Item extra={suffix} className={props.selectedPlayerId==player.id?"player-selected-field":"player-field"}>
                <span className="player-nickname-text">
                    {player.nickname}
                </span>
                </List.Item>);
            }}
        />
    );
}
