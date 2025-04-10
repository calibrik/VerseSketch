import { FC } from "react";
import { useNavigate, useParams } from "react-router";
import { Form, Input } from "antd";
import { Color } from "../misc/colors";
import { PageTitle } from "../components/PageTitle";
import { RuleObject } from "antd/es/form";
import { JoinRoomButton } from "../components/JoinRoomButton";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { useCookies } from "react-cookie";
interface ICreatePlayerPageProps {};
interface ICreatePlayerModel{
    nickname:string,
    roomTitle:string,
}

export const CreatePlayerPage: FC<ICreatePlayerPageProps> = () => {
    const { roomTitle } = useParams();
    const [cookies, setCookie, removeCookie] = useCookies(['player']);
    const navigate=useNavigate();
    
    async function onSuccessfulSubmit(values:ICreatePlayerModel) {
        values.nickname=values.nickname.trim();
        console.log("Form values:", JSON.stringify({
            nickname:values.nickname,
            roomTitle:roomTitle}),"Token:",cookies.player);

        let response=await fetch(ConnectionConfig.Api+"/api/rooms/join",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${cookies.player}`
            },
            body:JSON.stringify({
                nickname:values.nickname,
                roomTitle:roomTitle})
            })
            .catch((error)=>{
                console.error("There was a problem with the fetch operation:", error);
            });

        let data=await response?.json();
        if (!response?.ok) {
            console.error("Error:", data);
            return;
        }
        console.log("Success:", data);
        setCookie('player',data.accessToken,{path:"/",sameSite:"strict",secure:true,httpOnly:true});
        navigate("/room/"+roomTitle);
    }

    async function validateNickname(rule:RuleObject, value:string) {
        value=value.trim();
        if (value.length===0) {
            return Promise.reject("Nickname is required");
        }
        if (value.length>30) {
            return Promise.reject("Nickname cannot be longer than 30 characters!");
        }
        console.log("Validating nickname:", JSON.stringify({
            nickname:value,
            roomTitle:roomTitle,
        }));
        let response=await fetch(ConnectionConfig.Api+`/api/rooms/validatePlayerNickname&nickname=${value}&roomTitle=${roomTitle}`,{
            method:"GET",
            headers:{
                "Content-Type":"application/json"
            },
        })
        .catch((error)=>{
            console.error("There was a problem with the fetch operation:", error);
        });
        let data=await response?.json();
        if (!response?.ok) {
            console.error("Error:", data);
            return Promise.resolve();
        }
        console.log("Validation response:",data);
        if (data.isExist){
            return Promise.reject("Nickname already exists in the room!");
        }
        return Promise.resolve();
    }

    return (
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
                        <JoinRoomButton/>
                    </Form.Item>
            </Form>
        </div>
    );
}
