import { FC, useRef } from "react";
import { PageTitle } from "../components/PageTitle";
import { Col, Form, Input, Row, Select, Switch } from "antd";
import { Color } from "../misc/colors";
import { CreateRoomButton } from "../components/CreateRoomButton";
import { useState } from "react";
import { RuleObject } from "antd/es/form";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import { useNavigate } from "react-router";
import { useCookies } from "react-cookie";
interface ICreateRoomPageProps {};

interface ICreateRoomModel{
    title:string,
    maxPlayersCount:number,
    isPublic:boolean,
}

export const CreateRoomPage: FC<ICreateRoomPageProps> = () => {
    const switchLabelRef = useRef<HTMLLabelElement | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate=useNavigate();
    const [, setCookie, ] = useCookies();
    const validateAbort=useRef<AbortController|null>(null);

    let selectionItems=[];
    for (let i=2;i<=10;i++){
        selectionItems.push({label:`${i} Players`,value:i});
    }

    function onSwitchChange(checked:boolean)
    {
        switchLabelRef.current!.innerText=checked?"Public room":"Private room";
    }

    async function onSuccessfulSubmit(values:ICreateRoomModel) {
        setLoading(true);
        values.title=values.title.trim();
        console.log("Form values:", JSON.stringify(values));
        let response=await fetch(`${ConnectionConfig.Api}/rooms/create`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(values)
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
        setLoading(false);
        navigate(`/join-room/by-link/${data.joinToken}`);
    }

    async function validateTitle(_:RuleObject,value:string) {
        validateAbort.current?.abort();
        validateAbort.current=new AbortController();
        value=value.trim();
        if (value.length===0) {
            return Promise.reject("Room name is required!");
        }
        setLoading(true);
        let response:Response|null=null;
        try{
            response=await fetch(`${ConnectionConfig.Api}/rooms/validateRoomTitle?${new URLSearchParams({
                roomTitle:value,
                })}`,{
                method:"GET",
                signal:validateAbort.current.signal,
                headers:{
                    "Content-Type":"application/json"
                }});
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
        if (!response) {
            return Promise.resolve();
        }
        if (data.isExist) {
            return Promise.reject("This room name is already taken!");
        }
        return Promise.resolve();
    }
    
    return (
        <div className="container-small">
            <PageTitle style={{marginTop:'20%'}}>Create your room!</PageTitle>
            <Form 
                style={{marginTop:'30%',width:'100%',display:"flex", flexDirection: "column", alignItems: "center"}}
                name="create-room"
                layout="vertical"
                onFinish={onSuccessfulSubmit}
                initialValues={{
                    title:"",
                    maxPlayersCount:selectionItems[0].value,
                    isPublic:true,} as ICreateRoomModel}>
                <Row gutter={20} style={{ width: "100%" }}>
                    <Col md={16}>
                    <Form.Item
                        name="title"
                        validateDebounce={300}
                        label={<label style={{color:Color.Secondary}}>Room Name</label>}
                        rules={[{validator:validateTitle}]}>
                        <Input className="input-field" placeholder="Enter room name"/>
                    </Form.Item>
                    </Col>
                    <Col md={8}>
                    <Form.Item
                        name="maxPlayersCount"
                        label={<label style={{color:Color.Secondary}}>Max. Players</label>}>
                        <Select
                        className="input-field"
                        options={selectionItems}
                        />
                    </Form.Item>
                    </Col>
                    <Col md={10} offset={14}>
                        <div style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"end"}}>
                            <label ref={switchLabelRef} style={{color:Color.Secondary,fontSize:20}}>Public room</label>
                            <Form.Item 
                                name="isPublic" style={{marginBottom:0,marginLeft:10}} valuePropName="checked">
                                    <Switch onChange={onSwitchChange} defaultChecked={true} />
                            </Form.Item>
                        </div>
                    </Col>
                </Row>
                <Form.Item style={{ marginTop: 70 }}>
                    <CreateRoomButton loading={loading}/>
                </Form.Item>
            </Form>
        </div>
    );
}
