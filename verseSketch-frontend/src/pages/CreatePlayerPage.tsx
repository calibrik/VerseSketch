import { FC, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Form, Input } from "antd";
import { Color } from "../misc/colors";
import { PageTitle } from "../components/PageTitle";
import { RuleObject } from "antd/es/form";
import { JoinRoomButton } from "../components/buttons/JoinRoomButton";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { useCookies } from "react-cookie";
import { Spinner } from "../components/Spinner";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";
import { leave } from "../misc/MiscFunctions";
import { BackButton } from "../components/buttons/BackButtton";
import { useHistoryContext } from "../components/HistoryProvider";


interface ICreatePlayerPageProps {};
interface ICreatePlayerModel{
    nickname:string,
    roomTitle:string,
}

export const CreatePlayerPage: FC<ICreatePlayerPageProps> = () => {
    const { roomTitle,joinToken } = useParams<string>();
    const [cookies, setCookie,removeCookie] = useCookies(['player']);
    const navigate=useNavigate();
    const validateAbort=useRef<AbortController|null>(null);
    const [loading,setLoading]=useState<boolean>(false);
    const errorModals=useErrorDisplayContext();
    const [validationLoading,setValidationLoading]=useState<boolean>(true);
    const isLinkValid=useRef<boolean>(true);
    const historyStack=useHistoryContext();
    
    useEffect(()=>{
        console.log(`cookies: ${cookies.player}`);
        validateJoinLink();
    },[]);

    async function validateJoinLink() {
        let response:Response|null=null;
        try{
            response=await fetch(`${ConnectionConfig.Api}/rooms/validateJoinLink?${new URLSearchParams({
                joinToken: joinToken??"",
                roomTitle: roomTitle??"",
            })}`,{
                method:"GET",
                headers:{
                    "Content-Type":"application/json"
                },
            });
        }
        catch(error:any) {
            isLinkValid.current=false;
            errorModals.errorModal.current?.show("No connection to the server.");
            setValidationLoading(false);
            return;
        }
        if (response.ok)
        {
            setValidationLoading(false);
            return;
        }
        let data=await response?.json();
        isLinkValid.current=false;
        errorModals.errorModal.current?.show(data.message);
        setValidationLoading(false);
    }
    
    async function beforeBack()
    {
        await leave(cookies.player,removeCookie);
    }
    
    async function onSuccessfulSubmit(values:ICreatePlayerModel) {
        if (!isLinkValid.current) 
            return;
        values.nickname=values.nickname.trim();
        setLoading(true);

        let response=await fetch(`${ConnectionConfig.Api}/rooms/join`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${cookies.player}`
            },
            body:JSON.stringify({
                nickname:values.nickname,
                roomTitle:roomTitle,
                joinToken:joinToken
            })
            })
            .catch((_)=>{
                errorModals.errorModalClosable.current?.show("No connection to the server.");
                setLoading(false);
            });

        let data=await response?.json();
        setLoading(false);
        if (!response?.ok) {
            errorModals.errorModalClosable.current?.show(data.message);
            return;
        }
        setCookie('player',data.accessToken,{path:"/non-existent-cookie-path",sameSite:"strict",secure:true,httpOnly:true});
        historyStack.current=[];
        navigate(`/room/${data.roomTitle}`,{replace:true});
    }

    async function validateNickname(_:RuleObject, value:string) {
        if (!isLinkValid.current)
            return;
        validateAbort.current?.abort();
        validateAbort.current=new AbortController();
        value=value.trim();
        if (value.length===0) {
            return Promise.reject("Nickname is required");
        }
        if (value.length>30) {
            return Promise.reject("Nickname cannot be longer than 30 characters!");
        }
        const pattern=/.*[^a-zA-Z0-9 _]/;
        if (pattern.test(value))
            return Promise.reject("Nickname cannot contain special characters!");
        setLoading(true);

        let response:Response|null=null;
        try{
            response=await fetch(`${ConnectionConfig.Api}/rooms/validatePlayerNickname?${new URLSearchParams({
                nickname: value,
                roomTitle: roomTitle??"",
                joinToken:joinToken??""
            })}`,{
                method:"GET",
                signal:validateAbort.current.signal,
                headers:{
                    "Content-Type":"application/json"
                },
            });
        }
        catch(error:any) {
            if (error.name!=="AbortError"){
                errorModals.errorModalClosable.current?.show("No connection to the server.");
                setLoading(false);
            }
            return Promise.resolve();
        }
        let data=await response?.json();
        setLoading(false);
        if (!response?.ok) {
            errorModals.errorModalClosable.current?.show(data.message);
            return Promise.resolve();
        }
        if (data.isExist){
            return Promise.reject("Nickname already exists in the room!");
        }
        return Promise.resolve();
    }

    if (validationLoading) {
        return (
            <Spinner style={{marginTop:50}}/>
        );
    }

    return (
        <div className="container-small">
            <div style={{width:"100%",marginTop:50,marginBottom:70}}>
                <BackButton beforeBack={beforeBack}/>
            </div>
            <PageTitle style={{width:"70%"}}>Choose your nickname and join the game!</PageTitle>
            <Form
                name="create-player"
                layout="vertical"
                onFinish={onSuccessfulSubmit}
                initialValues={{
                    nickname:"",
                } as ICreatePlayerModel}
                style={{width:"100%",marginTop:148}}>
                    <Form.Item
                        name="nickname"
                        label={<label style={{color:Color.Secondary}}>Nickname</label>}
                        validateDebounce={500}
                        rules={[{validator:validateNickname}]}>
                        <Input style={{width:"100%"}} className="input-field" placeholder="Enter your nickname"/>
                    </Form.Item>
                    <Form.Item style={{display:"flex",justifyContent:"center",marginTop:80}}>
                        <JoinRoomButton loading={loading}/>
                    </Form.Item>
            </Form>
        </div>
    )
}
