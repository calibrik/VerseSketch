import { FC, useEffect, useState } from "react";
import { PageTitle } from "../components/PageTitle";
import TextArea from "antd/es/input/TextArea";
import { SubmitButton } from "../components/buttons/SubmitButton";
import { StepCounter } from "../components/StepCounter";
import { Form } from "antd";
import { RuleObject } from "antd/es/form";
import { Spinner } from "../components/Spinner";
import { useSignalRConnectionContext } from "../components/SignalRProvider";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";
import { Timer } from "../components/Timer";
import { PlayerCompleteCounter } from "../components/PlayerCompleteCounter";
import { ConnectionConfig } from "../misc/ConnectionConfig";
interface IInsertLyricsPageProps {};

interface IInsertLyricsFormModel {
    lyrics: string;
}

interface IInsertLyricsModel{
    time:number;
    totalPlayers:number;
    roomTitle:string;
    isAdmin:boolean;
}

export const InsertLyricsPage: FC<IInsertLyricsPageProps> = (_) => {
    const [model,setModel]=useState<IInsertLyricsModel|null>(null);
    const [submitLoading,setSubmitLoading]=useState<boolean>(false);
    const [isSubmitted,setIsSubmitted]=useState<boolean>(false);
    const connection=useSignalRConnectionContext();
    const errorModals=useErrorDisplayContext();

    async function validateLyrics(_: RuleObject, value: string) {
        if (!value || value.trim() === "") {
            Promise.reject("Lyrics cannot be empty");
        }
        console.log("Lyrics submitted:", value);
        let lines:string[] = value.split("\n").filter(line => line.trim() !== "");
        if (lines.length != ((model?.totalPlayers??2)-1)*2) {
            return Promise.reject(`Please enter exactly ${((model?.totalPlayers??2)-1)*2} lines of lyrics. (You have ${lines.length} ${lines.length==1?"line":"lines"}.)`);
        }
        for (let i=0;i<lines.length;i++) {
            if (lines[i].length > 95) {
                return Promise.reject(`Each line of lyrics must be 95 characters or less. (Line ${i+1} is ${lines[i].length} characters long.)`);
            }
        }
        return Promise.resolve();
    }

    async function onSubmit(value:IInsertLyricsFormModel){
        setSubmitLoading(true);
        let isGood:boolean=true;
        if (!isSubmitted) {
            try {
                await connection.current?.invoke("SendLyrics", value.lyrics)
            }
            catch (e:any) {
                errorModals.errorModalClosable.current?.show("Failed to send lyrics to the server.");
                isGood=false;
            }
        }
        else {
            try {
                await connection.current?.invoke("PlayerCanceledTask", model?.roomTitle)
            }
            catch (e:any) {
                errorModals.errorModalClosable.current?.show("Failed to cancel submission.");
                isGood=false;
            }
        }
        setSubmitLoading(false);
        if (isGood)
            setIsSubmitted(prev=>(!prev));
    }

    async function initLoad(){
        let response:Response|null=null;
        try {
            response=await fetch(`${ConnectionConfig.Api}/game/getLinesAmount`, {
                method:"GET",
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${sessionStorage.getItem("player")}`
                }
            });
        }
        catch (e:any) {
            errorModals.errorModalClosable.current?.show("Failed to connect to the server.");
            return;
        }
        let data=await response?.json();
        if (response?.ok) {
            console.log(data);
            setModel(data);
        }
        else {
            errorModals.errorModal.current?.show(data.message);
        }
    }

    useEffect(() => {
        document.title="Insert Lyrics";
        if (connection===null||connection.current===null) {
            errorModals.errorModal.current?.show("No connection to the server.");
            return;
        }
        initLoad();
    }, []);
    
    if (model===null)
        return (<Spinner style={{marginTop:"3vh"}}/>);

    return (
        <>
            <Timer time={30}/>
            <StepCounter step={1} totalSteps={model.totalPlayers}/>
            <PlayerCompleteCounter totalPlayers={model.totalPlayers} completedPlayers={0} isAdmin={model.isAdmin}/>
            <div className="container-small">
                <PageTitle style={{marginTop:"3vh"}}>Past {(model.totalPlayers-1)*2} lines of lyrics of your song!</PageTitle>
                <Form
                    onFinish={onSubmit} 
                    style={{width:"100%",display:"flex", flexDirection: "column", alignItems: "center"}}
                    name="insert-lyrics"
                    initialValues={{lyrics:""}}
                    >
                    <Form.Item style={{width:"100%"}} name="lyrics" rules={[{validator:validateLyrics}]}>
                        <TextArea disabled={isSubmitted} style={{marginTop:"5vh"}} className="text-area" autoSize={{minRows:10,maxRows:20}} placeholder="Insert your lyrics here..."/>
                    </Form.Item>
                    <Form.Item>
                        <SubmitButton loading={submitLoading} isSubmitted={isSubmitted}/>
                    </Form.Item>
                </Form>
            </div>
        </>
    );
}
