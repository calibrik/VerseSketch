import { FC, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Form, Input } from "antd";
import { Color } from "../misc/colors";
import { PageTitle } from "../components/PageTitle";
import { RuleObject } from "antd/es/form";
import { JoinRoomButton } from "../components/JoinRoomButton";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { useCookies } from "react-cookie";
import { Spinner } from "../components/Spinner";
import { ErrorDisplay } from "../components/ErrorDisplay";
interface ICreatePlayerPageProps {};
interface ICreatePlayerModel{
    nickname:string,
    roomTitle:string,
}

export const CreatePlayerPage: FC<ICreatePlayerPageProps> = () => {
    const { roomTitle,joinToken } = useParams<string>();
    const [cookies, setCookie] = useCookies(['player']);
    const navigate=useNavigate();
    const validateAbort=useRef<AbortController|null>(null);
    const [loading,setLoading]=useState<boolean>(false);
    const [validationErrorMessage,setValidationErrorMessage]=useState<string|undefined>(undefined);
    const [validationLoading,setValidationLoading]=useState<boolean>(true);
    
    useEffect(()=>{
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
            console.error("There was a problem with the fetch operation:", error);
            setValidationErrorMessage("Something went wrong, please try again later");
            return;
        }
        if (response.ok)
        {
            setValidationErrorMessage(undefined);
            setValidationLoading(false);
            return;
        }
        let data=await response?.json();
        console.log("Join link validation response:",data);
        setValidationErrorMessage(data.message);
        setValidationLoading(false);
    }
    
    async function onSuccessfulSubmit(values:ICreatePlayerModel) {
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
            .catch((error)=>{
                console.error("There was a problem with the fetch operation:", error);
                setLoading(false);
            });

        let data=await response?.json();
        setLoading(false);
        if (!response?.ok) {
            console.error("Error:", data);
            return;
        }
        console.log("Success:", data);
        console.log(`/room/${data.roomTitle}`);
        setCookie('player',data.accessToken,{path:"/",sameSite:"strict",secure:true,httpOnly:true});
        navigate(`/room/${data.roomTitle}`);
    }

    async function validateNickname(_:RuleObject, value:string) {
        validateAbort.current?.abort();
        validateAbort.current=new AbortController();
        value=value.trim();
        if (value.length===0) {
            return Promise.reject("Nickname is required");
        }
        if (value.length>30) {
            return Promise.reject("Nickname cannot be longer than 30 characters!");
        }
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
                console.error("There was a problem with the fetch operation:", error);
                setLoading(false);
            }
            return Promise.resolve();
        }
        let data=await response?.json();
        setLoading(false);
        if (!response?.ok) {
            console.error("Error:", data);
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

    return validationErrorMessage===undefined ?(
        <div className="container-small">
            <PageTitle style={{marginTop:148,width:"70%"}}>Choose your nickname and join the game!</PageTitle>
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
    ):(
        <ErrorDisplay style={{marginTop:200}}>{validationErrorMessage}</ErrorDisplay>
    );
}
