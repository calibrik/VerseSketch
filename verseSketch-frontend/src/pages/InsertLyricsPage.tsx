import { FC, useEffect, useState } from "react";
import { PageTitle } from "../components/PageTitle";
import TextArea from "antd/es/input/TextArea";
import { SubmitButton } from "../components/buttons/SubmitButton";
import { StepCounter } from "../components/StepCounter";
import { Form, Spin } from "antd";
import { RuleObject } from "antd/es/form";
import { Spinner } from "../components/Spinner";
import { useSignalRConnectionContext } from "../components/SignalRProvider";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";
interface IInsertLyricsPageProps {};

interface IInsertLyricsFormModel {
    lyrics: string;
}

interface IInsertLyricsModel{
    linesAmount:number
}

export const InsertLyricsPage: FC<IInsertLyricsPageProps> = (_) => {
    const [model,setModel]=useState<IInsertLyricsModel|null>(null);
    const [lodaing,setLoading]=useState<boolean>(false);
    const connection=useSignalRConnectionContext();
    const errorModals=useErrorDisplayContext();

    async function validateLyrics(_: RuleObject, value: string) {
        if (!value || value.trim() === "") {
            Promise.reject("Lyrics cannot be empty");
        }
        console.log("Lyrics submitted:", value);
        let lines:string[] = value.split("\n").filter(line => line.trim() !== "");
        if (lines.length != 6) {
            return Promise.reject(`Please enter exactly 6 lines of lyrics. (You have ${lines.length} ${lines.length==1?"line":"lines"}.)`);
        }
        for (let i=0;i<lines.length;i++) {
            if (lines[i].length > 95) {
                return Promise.reject(`Each line of lyrics must be 95 characters or less. (Line ${i+1} is ${lines[i].length} characters long.)`);
            }
        }
        return Promise.resolve();
    }

    async function onSubmit(value:IInsertLyricsFormModel){
        setLoading(true);
        try {
            await connection.current?.invoke("SendLyrics", value.lyrics)
        }
        catch (e:any) {
            errorModals.errorModalClosable.current?.show("Failed to send lyrics to the server.");
        }
        setLoading(false);
    }

    async function initLoad(){
        let response:Response|null=null;
        try {
            response=await fetch(`${connection.current?.baseUrl}/game/getLinesAmount`, {
                method:"POST",
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
            <StepCounter/>
            <div className="container-small">
                <PageTitle style={{marginTop:"3vh"}}>Past lines of lyrics of your song!</PageTitle>
                <Form
                    onFinish={onSubmit} 
                    style={{width:"100%",display:"flex", flexDirection: "column", alignItems: "center"}}
                    name="insert-lyrics"
                    initialValues={{lyrics:""}}
                    >
                    <Form.Item style={{width:"100%"}} name="lyrics" rules={[{validator:validateLyrics}]}>
                        <TextArea style={{marginTop:"5vh"}} className="text-area" autoSize={{minRows:10,maxRows:20}} placeholder="Insert your lyrics here..."/>
                    </Form.Item>
                    <Form.Item>
                        <SubmitButton style={{marginTop:"2vh"}}/>
                    </Form.Item>
                </Form>
            </div>
        </>
    );
}
