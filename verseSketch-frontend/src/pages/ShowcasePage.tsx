import { Col, Row } from "antd";
import { FC } from "react";
import { PlayersList } from "../components/PlayersList";
import { ShowcaseCanvas } from "../components/ShowcaseCanvas";
import { SkipButton } from "../components/buttons/SkipButton";
import { PlayerModel } from "../components/SignalRProvider";
interface IShowcasePageProps {};

export const ShowcasePage: FC<IShowcasePageProps> = (_) => {

    let players:PlayerModel[]=[];
    for (let i = 0; i < 8; i++) {
        players.push({
            id: `player${i+1}`,
            nickname: `qwertyu`,
            isAdmin: i === 0 // First player is admin
        });
    }
    players.push({
        id: "dfgsdfg",
        nickname: "qwertyui oplkjhgfdsa zxcvb nm,",
        isAdmin: false
    });

    return (
        <div className="container-mid">
            <Row style={{marginTop:"2vh",width:"100%"}} gutter={[20, 5]}>
                <Col xs={24} md={6} xxl={4}>
                    <PlayersList 
                        players={players} 
                        roomTitle={"penis"} 
                        loading={false} 
                        playersCount={10} 
                        maxPlayersCount={10} 
                        selectedPlayerId={"player3"}
                        isPlayerAdmin
                        showKickButton/>
                </Col>
                <Col xs={24} md={18} xxl={20}>
                    <div className="showcase-container">
                        <div className="header">
                            <h1 className="lyrics-2line">Ridin' in my GNX with Anita Baker in the tape deck, it's gon' be a sweet love</h1>
                            <h1 className="lyrics-2line">Fuck apologies, I wanna see y'all geeked up</h1>
                        </div>
                        <ShowcaseCanvas style={{marginTop:"1vh"}}/>
                    </div>
                </Col>
            </Row>
            <div style={{display:"flex",justifyContent:"end",width:"100%",marginTop:"2vh"}}>
                <SkipButton style={{marginRight:10}}/>
            </div>
        </div>
    );
}
