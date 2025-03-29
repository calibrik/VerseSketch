import { FC, ReactNode, useEffect, useRef, useState } from "react";
import './CreateRoomPage.css'
import { PageTitle } from "../components/PageTitle";
import { List } from "antd";
import { Color } from "../misc/colors";
import { Spinner } from "../components/Spinner";
import { PrimaryButton } from "../components/PrimaryButton";
import { JoinRoomButton } from "../components/JoinRoomButton";
interface ICreateRoomPageProps {};

export const CreateRoomPage: FC<ICreateRoomPageProps> = (props) => {
    
    const [data,setData]=useState<string[]>([])
    const [loading,setLoading]=useState<boolean>(false);
    
    useEffect(()=>{
        document.title="Create room"
        loadMoreData();
    },[]);

    async function loadMoreData()
    {
        if (loading)
            return;
        console.log("called load");
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 5000));
        for (let i=0;i<10;i++)
        {
            setData(d=>[...d,`room name ${i}`]);
        }
        setLoading(false);
    }
    return (
        <div className="container-mid">
            <PageTitle>Join existing rooms!</PageTitle>
            <div onScrollEnd={loadMoreData} className="scrollable-list">
                    <List
                    style={{width:'100%', color:Color.Secondary}}
                    dataSource={data}
                    renderItem={(item) => (
                        <List.Item style={{color:Color.Secondary}}>
                            <List.Item.Meta title={<span style={{color:Color.Secondary}}>{item}</span>}/>
                            <div>{item}</div>
                            <JoinRoomButton style={{marginLeft:100}}/>
                        </List.Item>
                    )}
                    />
                    {loading?<Spinner/>:""}
            </div>
        </div>
    );
}
