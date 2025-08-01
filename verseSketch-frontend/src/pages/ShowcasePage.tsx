import { Col, Row } from "antd";
import { FC, useEffect, useState } from "react";
import { PlayersList } from "../components/PlayersList";
import { ShowcaseCanvas } from "../components/ShowcaseCanvas";
import { SkipButton } from "../components/buttons/SkipButton";
import { PlayerModel } from "../components/SignalRProvider";
import { testImage1, testImage2 } from "../misc/testImage";
import { ILine } from "../components/Canvas";
import { delay } from "../misc/MiscFunctions";
interface IShowcasePageProps { };

type LyricImage = {
    lyrics: string[];
    image: ILine[];
    playerId: string;
}

export const ShowcasePage: FC<IShowcasePageProps> = (_) => {
    const [currImg, setCurrImg] = useState<ILine[]>([]);
    const [loading, setLoading] = useState(false);
    const [currPlayerPlayed, setCurrPlayerPlayed] = useState<number>(0);
    const [currLyrics, setCurrLyrics] = useState<string[]>(["Prepare to see your own drawings", "for lyrics you wrote!"]);
    let players: PlayerModel[] = [];
    for (let i = 0; i < 8; i++) {
        players.push({
            id: `player${i + 1}`,
            nickname: `qwertyu`,
            isAdmin: i === 0 // First player is admin
        });
    }
    players.push({
        id: "dfgsdfg",
        nickname: "qwertyui oplkjhgfdsa zxcvb nm,",
        isAdmin: false
    });

    async function getStoryline(): Promise<LyricImage[]> {
        setLoading(true);
        await delay(2000);//getting current player's storyline
        setLoading(false);
        return [
            {
                lyrics: [`Ridin' in my GNX with Anita Baker in the tape deck, it's gon' be a sweet love`, `Fuck apologies, I wanna see y'all geeked up`],
                image: testImage1,
                playerId: "player1"
            },
            {
                lyrics: [`Don't acknowledge me, then maybe we can say it's fair`, `Take it to the internet and I'ma take it there`],
                image: testImage2,
                playerId: "player2"
            },
            {
                lyrics: [`Miss my uncle Lil' Mane, he said that he would kill me if I didn't make it`, `Now I'm possessed by a spirit and they can't take it`],
                image: testImage1,
                playerId: "player1"
            },
            {
                lyrics: [`Used to bump The Carter III, I held my Rollie chain proud`, `Irony, I think my hard work let Lil Wayne down`],
                image: testImage2,
                playerId: "player2"
            },
        ];
    }

    async function playStoryline() {
        window.speechSynthesis.cancel();
        const lyricImages=await getStoryline();
        if (window.speechSynthesis.getVoices().length == 0) {
            await new Promise<void>(resolve => {
                window.speechSynthesis.onvoiceschanged = () => {
                    resolve();
                }
            });
        }
        for (const lyricImage of lyricImages) {
            setCurrImg(lyricImage.image);
            setCurrLyrics([lyricImage.lyrics[0], lyricImage.lyrics[1]]);
            const msg = new SpeechSynthesisUtterance(lyricImage.lyrics[0] + '\n' + lyricImage.lyrics[1]);
            const voice = window.speechSynthesis.getVoices()[0];
            if (voice) {
                msg.voice = voice;
            }
            let p = new Promise<void>((resolve) => {
                msg.onend = () => {
                    resolve();
                };
            });
            window.speechSynthesis.speak(msg);
            await p;
        }
        setCurrLyrics(["Prepare to see your own drawings", "for lyrics you wrote!"]);
        setCurrImg([]);
    }

    useEffect(() => {
    }, []);




    return (
        <div className="container-mid">
            <Row style={{ marginTop: "2vh", width: "100%" }} gutter={[20, 5]}>
                <Col xs={24} md={6} xxl={4}>
                    <PlayersList
                        players={players}
                        roomTitle={"penis"}
                        loading={false}
                        playersCount={10}
                        maxPlayersCount={10}
                        selectedPlayerId={"player2"}
                        isPlayerAdmin />
                </Col>
                <Col xs={24} md={18} xxl={20}>
                    <div className="showcase-container">
                        <div className="header">
                            <h1 className="lyrics-2line">{currLyrics[0]}</h1>
                            <h1 className="lyrics-2line">{currLyrics[1]}</h1>
                        </div>
                        <ShowcaseCanvas style={{marginTop:"auto"}} onPlayClick={playStoryline} lines={currImg} loading={loading} />
                    </div>
                </Col>
            </Row>
            <div style={{ display: "flex", justifyContent: "end", width: "100%", marginTop: "2vh" }}>
                <SkipButton style={{ marginRight: 10 }} />
            </div>
        </div>
    );
}
