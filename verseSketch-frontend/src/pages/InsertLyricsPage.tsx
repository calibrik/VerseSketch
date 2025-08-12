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
    const errorModals = useErrorDisplayContext();
    const navigate = useNavigate();
    const lyrics=useRef<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");

    async function validateLyrics(value: string) {
        if (!value || value.trim() === "") {
            setErrorMsg("Lyrics cannot be empty");
            return;
        }
        lyrics.current = value.trim();
        let lines: string[] = value.split("\n").filter(line => line.trim() !== "");
        if (lines.length != ((model?.playersCount ?? 2) - 1) * 2) {
            setErrorMsg(`Please enter exactly ${((model?.playersCount ?? 2) - 1) * 2} lines of lyrics. (You have ${lines.length} ${lines.length == 1 ? "line" : "lines"}.)`);
            return;
        }
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length > 95) {
                setErrorMsg(`Each line of lyrics must be 95 characters or less. (Line ${i + 1} is ${lines[i].length} characters long.)`);
                return;
            }
        }
        setErrorMsg("");
    }

    async function onSubmit() {
        if (!signalRModel.roomModelRef.current || !signalRModel.connection.current||errorMsg!="")
            return;
        setSubmitLoading(true);
        if (!isSubmitted) {
            try {
                await signalRModel.connection.current.invoke("SendLyrics", lyrics.current);
                setIsSubmitted(true);
            }
            catch (e: any) {
                errorModals.errorModalClosable.current?.show("Failed to send lyrics to the server.");
            }
        }
        else {
            try {
                await signalRModel.connection.current.invoke("PlayerCanceledTask")
                setIsSubmitted(false);
            }
            catch (e: any) {
                errorModals.errorModalClosable.current?.show("Failed to cancel submission.");
            }
        }
        setSubmitLoading(false);
    }

    function triggerUpdate(model: RoomModel | null) {
        setModel(model);
    }

    useEffect(() => {
        if (!signalRModel.roomModelRef.current || signalRModel.roomModelRef.current.stage != 0 || !signalRModel.connection.current) {
            leave(signalRModel);
            navigate("/", { replace: true });
            return;
        }
        signalRModel.updateTrigger.current.on(triggerUpdate);
        document.title = "Insert Lyrics";
        return () => {
            signalRModel.updateTrigger.current.off(triggerUpdate);
        }
    }, []);

    if (model === null)
        return (<Spinner style={{ marginTop: "3vh" }} />);

    return (
        <>
            <StageCounter stage={signalRModel.roomModelRef.current?.stage??0} maxStage={signalRModel.roomModelRef.current?.playersCount??0} />
            <PlayerCompleteCounter />
            <div className="container-small">
                <PageTitle style={{ marginTop: "6vh" }}>Past {(model.playersCount - 1) * 2} lines of lyrics of your song!</PageTitle>
                <TextArea onChange={validateLyrics} style={{ marginTop: "5vh" }} placeholder="Insert your lyrics here..." />
                <div style={{width:"100%",height:"4vh"}}>
                    <label style={{color:"red"}}>{errorMsg}</label>
                </div>
                <SubmitButton onClick={onSubmit} loading={submitLoading} isSubmitted={isSubmitted}/>
            </div>
        </>
    );
}
