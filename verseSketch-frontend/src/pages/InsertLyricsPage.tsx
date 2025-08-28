import { FC, useEffect, useRef, useState } from "react";
import { PageTitle } from "../components/PageTitle";
import { SubmitButton } from "../components/buttons/SubmitButton";
import { StageCounter } from "../components/StageCounter";
import { Spinner } from "../components/Spinner";
import { RoomModel, useSignalRConnectionContext } from "../components/SignalRProvider";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";
import { PlayerCompleteCounter } from "../components/PlayerCompleteCounter";
import { useNavigate } from "react-router";
import { leave } from "../misc/MiscFunctions";
import { TextArea } from "../components/TextArea";
interface IInsertLyricsPageProps { };

export const InsertLyricsPage: FC<IInsertLyricsPageProps> = (_) => {
    const signalRModel = useSignalRConnectionContext();
    const [model, setModel] = useState<RoomModel | null>(signalRModel.roomModelRef.current);
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const isSubmittedRef = useRef<boolean>(false);
    const errorModals = useErrorDisplayContext();
    const navigate = useNavigate();
    const lyrics = useRef<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const isValid = useRef<boolean>(true);

    function validateLyrics(value: string) {
        if (!value || value.trim() === "") {
            setErrorMsg("Lyrics cannot be empty");
            isValid.current = false;
            return;
        }
        lyrics.current = value.trim();
        let lines: string[] = value.split("\n").filter(line => line.trim() !== "");
        if (lines.length != ((signalRModel.roomModelRef.current?.playingPlayersCount ?? 2) - 1) * 2) {
            setErrorMsg(`Please enter exactly ${((signalRModel.roomModelRef.current?.playingPlayersCount ?? 2) - 1) * 2} lines of lyrics. (You have ${lines.length} ${lines.length == 1 ? "line" : "lines"}.)`);
            isValid.current = false;
            return;
        }
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length > 95) {
                setErrorMsg(`Each line of lyrics must be 95 characters or less. (Line ${i + 1} is ${lines[i].length} characters long.)`);
                isValid.current = false;
                return;
            }
        }
        isValid.current = true;
        setErrorMsg("");
    }

    async function onSubmit() {
        validateLyrics(lyrics.current);
        if (!signalRModel.roomModelRef.current || !signalRModel.connection.current || !isValid.current)
            return;
        setSubmitLoading(true);
        if (!isSubmittedRef.current) {
            try {
                await signalRModel.connection.current.invoke("SendLyrics", lyrics.current);
                setIsSubmitted(true);
                isSubmittedRef.current = true;
            }
            catch (e: any) {
                errorModals.errorModalClosable.current?.show("Failed to send lyrics to the server.");
            }
        }
        else {
            try {
                await signalRModel.connection.current.invoke("PlayerCanceledTask")
                setIsSubmitted(false);
                isSubmittedRef.current = false;
            }
            catch (e: any) {
                errorModals.errorModalClosable.current?.show("Failed to cancel submission.");
            }
        }
        setSubmitLoading(false);
    }

    async function onPlayerLeft(_: string, __: boolean) {
        validateLyrics(lyrics.current);
        if (isSubmittedRef.current) {

            isSubmittedRef.current = false;
            setIsSubmitted(false);
        }
    }

    async function triggerUpdate() {
        if (!signalRModel.roomModelRef.current)
            setModel(null);
        else
            setModel({ ...signalRModel.roomModelRef.current });
    }

    useEffect(() => {
        document.title = "Insert Lyrics";
        if (!signalRModel.roomModelRef.current || signalRModel.roomModelRef.current.stage != 0 || !signalRModel.connection.current) {
            leave(signalRModel);
            navigate("/", { replace: true });
            return;
        }
        signalRModel.connection.current.on("PlayerLeft",onPlayerLeft);
        signalRModel.updateTrigger.current.on(triggerUpdate);
        return () => {
            signalRModel.connection.current?.off("PlayerLeft",onPlayerLeft);
            signalRModel.updateTrigger.current.off(triggerUpdate);
        }
    }, []);

    if (model === null)
        return (<Spinner style={{ marginTop: "3vh" }} />);

    return (
        <>
            <StageCounter stage={model.stage} maxStage={model.actualPlayersCount} />
            <PlayerCompleteCounter />
            <div className="container-small">
                <PageTitle style={{ marginTop: "6vh" }}>Past {(model.playingPlayersCount - 1) * 2} lines of lyrics from your song!</PageTitle>
                <TextArea onChange={validateLyrics} style={{ marginTop: "5vh" }} disabled={isSubmitted} placeholder="Insert your lyrics here..." />
                <div style={{ width: "100%", height: "4vh" }}>
                    <label style={{ color: "red" }}>{errorMsg}</label>
                </div>
                <SubmitButton onClick={onSubmit} loading={submitLoading} isSubmitted={isSubmitted} />
                <label style={{marginTop:"20vh"}} className="input-field-label">Please use a single language for a better voice over.</label>
            </div>
        </>
    );
}
