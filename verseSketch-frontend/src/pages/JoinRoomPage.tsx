import { FC, useEffect, useRef, useState } from "react";
import { PageTitle } from "../components/PageTitle";
import { Input, List } from "antd";
import { Color } from "../misc/colors";
import { Spinner } from "../components/Spinner";
import { JoinRoomButton } from "../components/JoinRoomButton";
import { CreateRoomNavigateButton } from "../components/CreateRoomNavigateButton";
interface IJoinRoomPageProps {};

interface ICreateRoomModel{
    title:string;
    id:string;
    memberCount:number;
    maxMemberCount:number;
};

export const JoinRoomPage: FC<IJoinRoomPageProps> = () => {
    const [data, setData] = useState<ICreateRoomModel[]>([]);
    const defaultResult = useRef<ICreateRoomModel[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const abortLoadRef = useRef<boolean>(false);
    const debounceTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        document.title = "Create room";
        setData(defaultResult.current);
        loadMoreDefaultData();
    }, []);

    async function loadMoreDefaultData() {
        if (loading) return;
        console.log("called load");
        setLoading(true);
        abortLoadRef.current = false; // Reset abort flag

        await new Promise((resolve) => setTimeout(resolve, 5000));
        if (abortLoadRef.current) {
            console.log("loadMoreDefaultData aborted");
            setLoading(false);
            return;
        }

        for (let i = 0; i < 10; i++) {
            const newRoom: ICreateRoomModel = {
                title: `room name ${i}`,
                id: `${i}`,
                memberCount: 3,
                maxMemberCount: 10,
            };
            defaultResult.current.push(newRoom);
        }
        setLoading(false);
    }

    async function onSearchTextChange(e: any) {
        abortLoadRef.current = true;
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        if (e.target.value.length === 0) {
            setData(defaultResult.current);
            return;
        }
        setData([]);
        setLoading(true);

        debounceTimeoutRef.current = setTimeout(async () => {
            console.log("called search");
            abortLoadRef.current = true;

            await new Promise((resolve) => setTimeout(resolve, 2000));
            const newData: ICreateRoomModel[] = [];
            defaultResult.current.forEach((room) => {
                if (room.title.toLowerCase().includes(e.target.value.toLowerCase()))
                    newData.push(room);
            });
            console.log(newData);
            setData(newData);
            setLoading(false);
            debounceTimeoutRef.current = null;
        }, 800);
        console.log(debounceTimeoutRef.current);
    }

    return (
        <div className="container-mid">
            <PageTitle style={{marginTop:15}}>Join existing rooms!</PageTitle>
            <Input style={{marginBottom:28,marginTop:118}} onChange={onSearchTextChange} className="input-field" placeholder="Search..." />
            <div onScrollEnd={loadMoreDefaultData} className="scrollable-list">
                    <List
                    style={{width:'100%', color:Color.Secondary}}
                    locale={{emptyText:<span className="placeholder-text">No rooms found</span>}}
                    // loading={{
                    //     spinning: loading,
                    //     indicator: <Spinner />,
                    // }}
                    dataSource={data}
                    loadMore={loading ? <Spinner style={{ margin: '15px' }} /> : ""}
                    renderItem={(room) => (
                        <List.Item style={{color:Color.Secondary}}>
                            <List.Item.Meta title={<span style={{color:Color.Secondary}}>{room.title}</span>}/>
                            <div>{room.memberCount}/{room.maxMemberCount}</div>
                            <JoinRoomButton style={{marginLeft:100}}/>
                        </List.Item>
                    )}
                    />     
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', width: '100%'}}>
                <CreateRoomNavigateButton style={{marginTop:28}}/>
            </div>
        </div>
    );
}
