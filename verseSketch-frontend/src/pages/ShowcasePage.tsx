import { Col, Row } from "antd";
import { FC, useEffect, useRef, useState } from "react";
import { PlayersList } from "../components/PlayersList";
import { ShowcaseCanvas, ShowcaseCanvasHandle } from "../components/ShowcaseCanvas";
import { useSignalRConnectionContext } from "../components/SignalRProvider";
import { ILine } from "../components/Canvas";
import { delay, leave } from "../misc/MiscFunctions";
import { useNavigate } from "react-router";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";
import { PlayButton } from "../components/buttons/PlayButton";
import { FinishButton } from "../components/buttons/FinishButton";
interface IShowcasePageProps { };

type LyricImage = {
    lyrics: string[];
    image: ILine[];
    byPlayerId: string;
}

export const ShowcasePage: FC<IShowcasePageProps> = (_) => {
    const signalRModel = useSignalRConnectionContext();
    const [loading, setLoading] = useState(false);
    const [currPlayerPlaying, setCurrPlayerPlaying] = useState<string>(signalRModel.roomModelRef.current?.players[0]?.id ?? "");
    const currPlayerPlayingRef = useRef<number>(0);
    const navigate = useNavigate();
    const [currLyrics, setCurrLyrics] = useState<string[]>(["Prepare to see your own drawings", "for the lyrics you wrote!"]);
    const errorModals = useErrorDisplayContext();
    const [isShowcaseStarted, setIsShowcaseStarted] = useState<boolean>(false);
    const isShowcaseStartedRef = useRef<boolean>(false);
    const [isWaiting, setIsWaiting] = useState<boolean>(false);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const canvas = useRef<ShowcaseCanvasHandle>(null);
    const [drawingAuthor, setDrawingAuthor] = useState<string>("");
    const timeoutRef = useRef<number>(0);


    async function getStoryline(playerId: string): Promise<LyricImage[]> {
        setLoading(true);
        let response;
        try {
            response = await fetch(`${ConnectionConfig.Api}/game/getPlayersStoryline?${new URLSearchParams({
                playerId: playerId,
            })}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("player")}`
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
        try {
            await signalRModel.connection.current?.invoke("StartShowcase", signalRModel.roomModelRef.current?.players[currPlayerPlayingRef.current].id);
        }
        catch (e: any) {
            errorModals.errorModalClosable.current?.show("Failed to start showcase.");
            return;
        }
    }

    async function onFinish() {
        try {
            await signalRModel.connection.current?.invoke("FinishGame");
        }
        catch (e: any) {
            errorModals.errorModalClosable.current?.show("Failed to finish the game.");
            return;
        }
    }

    async function getAudio(text: string): Promise<Blob | null> {
        let response;
        try {
            response = await fetch(`${ConnectionConfig.Api}/game/getAudio?${new URLSearchParams({
                text: text,
            })}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("player")}`
                }
            });
        }
        catch (e: any) {
            errorModals.errorModalClosable.current?.show("Could not get audio for the lyrics.");
            return null;
        }
        if (!response.ok) {
            let data = await response.json();
            errorModals.errorModalClosable.current?.show(data.message);
            return null;
        }
        return await response.blob();
    }

    async function playStoryline(playerId: string) {
        if (!signalRModel.roomModelRef.current)
            return;
        setIsShowcaseStarted(true);
        isShowcaseStartedRef.current = true;
        setIsWaiting(true);
        setCurrPlayerPlaying(playerId);
        currPlayerPlayingRef.current = signalRModel.roomModelRef.current?.players.findIndex(p => p.id === playerId);
        const lyricImages = await getStoryline(playerId);
        if (lyricImages.length === 0) {
            setIsShowcaseStarted(false);
            await signalRModel.connection.current?.invoke("PlayerFinishedShowcase");
            return;
        }
        for (const lyricImage of lyricImages) {
            if (!lyricImage.byPlayerId)
                break;
            setDrawingAuthor(signalRModel.roomModelRef.current?.players.find(p => p.id === lyricImage.byPlayerId)?.nickname ?? "Unknown");
            setCurrLyrics([lyricImage.lyrics[0], lyricImage.lyrics[1]]);
            const blob = await getAudio(lyricImage.lyrics.join('\n'));
            let msgEnd: Promise<void> = Promise.resolve();
            if (blob) {
                const audio = new Audio(URL.createObjectURL(blob));
                msgEnd = new Promise<void>((resolve) => {
                    audio.onended = () => {
                        resolve();
                    }
                });
                audio.play().catch((_) => {
                    errorModals.errorModalClosable.current?.show("Failed to play audio for the lyrics.");
                    msgEnd = Promise.resolve();
                });
            }
            let drawingEnd = canvas.current?.draw(lyricImage.image);
            await msgEnd;
            console.log("msg end");
            await drawingEnd;
            console.log("drawing end");
        }
        await delay(1500);
        setIsShowcaseStarted(false);
        isShowcaseStartedRef.current = false;
        setCurrLyrics(["Prepare to see your own drawings", "for the lyrics you wrote!"]);
        setDrawingAuthor("");
        canvas.current?.reset();
        try {
            await signalRModel.connection.current?.invoke("PlayerFinishedShowcase");
        }
        catch (e:any){

        }
        if (signalRModel.roomModelRef.current.isPlayerAdmin) {
            timeoutRef.current = setTimeout(() => {
                setIsWaiting(false);
            }, 5000);
        }
        if (currPlayerPlayingRef.current + 1 >= signalRModel.roomModelRef.current.actualPlayersCount) {
            if (signalRModel.roomModelRef.current.isPlayerAdmin)
                setIsFinished(true);
            return;
        }
        currPlayerPlayingRef.current++;
        setCurrPlayerPlaying(signalRModel.roomModelRef.current.players[currPlayerPlayingRef.current].id);
    }

    function onShowcaseFinished() {
        clearTimeout(timeoutRef.current);
        setIsWaiting(false);
    }

    async function onReconnected() {
        if (!isShowcaseStartedRef.current)
            await signalRModel.connection.current?.invoke("PlayerFinishedShowcase");
    }

    useEffect(() => {
        document.title = "Showcase";
        if (!signalRModel.roomModelRef.current || signalRModel.roomModelRef.current.stage < 1 || !signalRModel.connection.current) {
            leave(signalRModel);
            navigate("/", { replace: true });
            return;
        }
        signalRModel.connection.current.on("StartShowcase", playStoryline);
        signalRModel.connection.current.on("ShowcaseFinished", onShowcaseFinished);
        signalRModel.connection.current.onreconnected(onReconnected);
        return () => {
            signalRModel.connection.current?.off("onreconnected", onReconnected);
            signalRModel.connection.current?.off("StartShowcase", playStoryline);
            signalRModel.connection.current?.off("ShowcaseFinished", onShowcaseFinished);
        }
    }, []);

    let playButtonText = "";
    if (isShowcaseStarted)
        playButtonText = "PLAYING";
    else if (!signalRModel.roomModelRef.current?.isPlayerAdmin)
        playButtonText = "WAITING FOR ADMIN";
    else if (isWaiting)
        playButtonText = "WAIT";
    else
        playButtonText = "PLAY";

    let button = isFinished && !isWaiting ? <FinishButton disabled={!signalRModel.roomModelRef.current?.isPlayerAdmin} onClick={onFinish} /> : <PlayButton style={{ marginRight: 10 }} disabled={isWaiting || !signalRModel.roomModelRef.current?.isPlayerAdmin || isShowcaseStarted} onClick={onPlayClick}>{playButtonText}</PlayButton>
    return (
        <div className="container-mid">
            <Row style={{ marginTop: "2vh", width: "100%" }} gutter={[20, 5]}>
                <Col xs={24} md={6} xxl={4}>
                    <PlayersList
                        players={signalRModel.roomModelRef.current?.players ?? []}
                        roomTitle={signalRModel.roomModelRef.current?.title ?? ""}
                        loading={false}
                        playersCount={signalRModel.roomModelRef.current?.actualPlayersCount ?? 0}
                        maxPlayersCount={signalRModel.roomModelRef.current?.maxPlayersCount ?? 0}
                        selectedPlayerId={currPlayerPlaying} />
                </Col>
                <Col xs={24} md={18} xxl={20}>
                    <div className="showcase-container">
                        <div className="header">
                            <h1 className="lyrics-2line">{currLyrics[0]}</h1>
                            <h1 className="lyrics-2line">{currLyrics[1]}</h1>
                        </div>
                        <ShowcaseCanvas ref={canvas} style={{ marginTop: "auto" }} loading={loading} />
                        {drawingAuthor != "" ? <div style={{ width: "100%", display: "flex", justifyContent: "end" }}>
                            <label className="showcase-player-name">Drawn by {drawingAuthor}</label>
                        </div> : ""}
                    </div>
                </Col>
            </Row>
            <div style={{ display: "flex", justifyContent: "end", width: "100%", marginTop: "2vh" }}>
                {button}
            </div>
        </div>
    );
}
