import { Col, Row } from "antd";
import { FC, useEffect, useRef, useState } from "react";
import { PlayersList } from "../components/PlayersList";
import { ShowcaseCanvas } from "../components/ShowcaseCanvas";
import { useSignalRConnectionContext } from "../components/SignalRProvider";
import { ILine } from "../components/Canvas";
import { delay, leave } from "../misc/MiscFunctions";
import { useNavigate } from "react-router";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";
import { PlayButton } from "../components/buttons/PlayButton";
interface IShowcasePageProps { };

type LyricImage = {
    lyrics: string[];
    image: ILine[];
    playerId: string;
}

export const ShowcasePage: FC<IShowcasePageProps> = (_) => {
    const signalRModel = useSignalRConnectionContext();
    const [currImg, setCurrImg] = useState<ILine[]>([]);
    const [loading, setLoading] = useState(false);
    const [currPlayerPlaying,setCurrPlayerPlaying] = useState<number>(0);
    const currPlayerPlayingRef = useRef<number>(0);
    const navigate = useNavigate();
    const [currLyrics, setCurrLyrics] = useState<string[]>(["Prepare to see your own drawings", "for the lyrics you wrote!"]);
    const errorModals=useErrorDisplayContext();
    const onFinishDrawing = useRef<()=>void>(()=>{});
    const [isShowcaseStarted, setIsShowcaseStarted] = useState<boolean>(false);
    const [isWaiting, setIsWaiting] = useState<boolean>(false);
    

    async function getStoryline(): Promise<LyricImage[]> {
        // return [
        //     {
        //     lyrics: ["Hello","dick"],
        //     image: testImage1,
        //     playerId: "test-player-1"
        //     },
        //     {
        //     lyrics: ["World","of shit"],
        //     image: testImage2,
        //     playerId: "test-player-2"
        //     }
        // ];
        setLoading(true);
        let response;
        try {
            response=await fetch(`${ConnectionConfig.Api}/game/getPlayersStoryline?${new URLSearchParams({
                playerId: signalRModel.roomModelRef.current?.players[currPlayerPlayingRef.current].id ?? "",
            })}`,{
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":`Bearer ${sessionStorage.getItem("player")}`
                }
            });
        }
        catch (e: any) {
            setLoading(false);
            errorModals.errorModalClosable.current?.show("Something went wrong.");
            return [];
        }
        let data = await response.json();
        if (!response.ok) {
            setLoading(false);
            errorModals.errorModalClosable.current?.show(data.message);
            return [];
        }
        console.log(data);
        setLoading(false);
        return data.lyricImages;
    }

    async function onPlayClick() {
        if (!signalRModel.roomModelRef.current?.isPlayerAdmin)
            return;
        await signalRModel.connection.current?.invoke("StartShowcase");
        // playStoryline();
    }

    async function playStoryline() {
        if (!signalRModel.roomModelRef.current)
            return;
        setIsShowcaseStarted(true);
        window.speechSynthesis.cancel();
        const lyricImages = await getStoryline();
        if (lyricImages.length === 0) {
            setIsShowcaseStarted(false);
            return;
        }
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
            let msgEnd = new Promise<void>((resolve) => {
                msg.onend = () => {
                    resolve();
                };
            });
            let drawingEnd=new Promise<void>((resolve) => {
                onFinishDrawing.current= () => {
                    resolve();
                };
            });
            window.speechSynthesis.speak(msg);
            await msgEnd;
            console.log("msg end");
            await drawingEnd;
            console.log("drawing end");
        }
        await delay(3000);
        if (currPlayerPlayingRef.current+1 >= signalRModel.roomModelRef.current.players.length) {
            navigate(`/room/${signalRModel.roomModelRef.current?.title}`, { replace: true });//placeholder
            return;
        }
        setIsShowcaseStarted(false);
        currPlayerPlayingRef.current++;
        setCurrPlayerPlaying((prev)=>prev+1);
        setCurrLyrics(["Prepare to see your own drawings", "for the lyrics you wrote!"]);
        setCurrImg([]);
        setIsWaiting(true);
        await delay(3000);
        setIsWaiting(false);
    }

    useEffect(() => {
        if (!signalRModel.roomModelRef.current || signalRModel.roomModelRef.current.stage < 1 || !signalRModel.connection.current) {
            leave(signalRModel);
            navigate("/", { replace: true });
            return;
        }
        signalRModel.connection.current.on("StartShowcase", playStoryline);
        return () => {
            signalRModel.connection.current?.off("StartShowcase", playStoryline);
        }
    }, []);



    let playButtonText="";
    if (!signalRModel.roomModelRef.current?.isPlayerAdmin)
        playButtonText="WAITING FOR ADMIN";
    else if (isShowcaseStarted)
        playButtonText="PLAYING";
    else if (isWaiting)
        playButtonText="WAIT";
    else
        playButtonText="PLAY";
    return (
        <div className="container-mid">
            <Row style={{ marginTop: "2vh", width: "100%" }} gutter={[20, 5]}>
                <Col xs={24} md={6} xxl={4}>
                    <PlayersList
                        players={signalRModel.roomModelRef.current?.players??[]}
                        roomTitle={signalRModel.roomModelRef.current?.title??""}
                        loading={false}
                        playersCount={signalRModel.roomModelRef.current?.players.length ?? 0}
                        maxPlayersCount={signalRModel.roomModelRef.current?.maxPlayersCount ?? 0}
                        selectedPlayerId={signalRModel.roomModelRef.current?.players[currPlayerPlaying].id??""}/>
                </Col>
                <Col xs={24} md={18} xxl={20}>
                    <div className="showcase-container">
                        <div className="header">
                            <h1 className="lyrics-2line">{currLyrics[0]}</h1>
                            <h1 className="lyrics-2line">{currLyrics[1]}</h1>
                        </div>
                        <ShowcaseCanvas style={{ marginTop: "auto" }} onFinishDrawing={onFinishDrawing} lines={currImg} loading={loading} isShowcaseStarted={isShowcaseStarted} />
                    </div>
                </Col>
            </Row>
            <div style={{ display: "flex", justifyContent: "end", width: "100%", marginTop: "2vh" }}>
                <PlayButton style={{ marginRight: 10 }} disabled={isWaiting||!signalRModel.roomModelRef.current?.isPlayerAdmin||isShowcaseStarted} onClick={onPlayClick}>{playButtonText}</PlayButton>
            </div>
        </div>
    );
}
