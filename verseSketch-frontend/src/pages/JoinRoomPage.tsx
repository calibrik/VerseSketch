import { FC, useEffect, useRef, useState } from "react";
import { PageTitle } from "../components/PageTitle";
import { Input} from "antd";
import { Spinner } from "../components/Spinner";
import { JoinToRoomNavigationButton } from "../components/JoinToRoomNavigationButton";
import { CreateRoomNavigateButton } from "../components/CreateRoomNavigateButton";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import InfiniteScroll from "react-infinite-scroll-component";
interface IJoinRoomPageProps {
};

interface IRoomModel{
    title:string;
    playersCount:number;
    maxPlayersCount:number;
};

export const JoinRoomPage: FC<IJoinRoomPageProps> = () => {
    const [data, setData] = useState<IRoomModel[]>([]);
    // const dataRef = useRef<IRoomModel[]>([]);
    const searchText = useRef<string>("");
    // const connection=useRef<signalR.HubConnection | null>(null);
    const pageSize=9;
    const isMoreDataAvailable=useRef<boolean>(true);
    const pageNumber=useRef<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const debounceTimeoutRef = useRef<number | null>(null);
    const loadMoreAbortController=useRef<AbortController | null>(null);
    const searchAbortController=useRef<AbortController | null>(null);


    useEffect(() => {
        document.title = "Join room!";
        loadMoreData();
    }, []);

    async function search(signal: AbortSignal) {
        let response: Response | null = await fetch(`${ConnectionConfig.Api}/rooms/search?${new URLSearchParams({
            roomTitle:searchText.current,
            page:pageNumber.current.toString(),
            pageSize:pageSize.toString()
            })}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            signal: signal
            });
        
        let newData = await response?.json();
        console.log(newData);
        isMoreDataAvailable.current = newData.length >= pageSize;
        setData((prevData) => [...prevData, ...newData]);
        pageNumber.current++;
    }

    async function loadMoreData() {
        if (loading) 
            return;
        loadMoreAbortController.current=new AbortController();
        setLoading(true);
        try{
            await search(loadMoreAbortController.current.signal);
        }
        catch(error:any) {
            if (error.name !== 'AbortError') {
                console.error("There was a problem with the fetch operation:", error);
            }
            return;
        }
        loadMoreAbortController.current=null;
        setLoading(false);
    }

    async function onSearchTextChange(e: any) {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        searchAbortController.current?.abort();
        loadMoreAbortController.current?.abort();
        loadMoreAbortController.current=null;
        e.target.value=e.target.value.trim();
        searchText.current=e.target.value;
        pageNumber.current=0;
        setData([]);
        setLoading(true);


        debounceTimeoutRef.current = setTimeout(async () => {
            searchAbortController.current=new AbortController();
            try{
                await search(searchAbortController.current.signal);
            }
            catch(error:any) {
                if (error.name !== 'AbortError') {
                    console.error("There was a problem with the fetch operation:", error);
                }
                return;
            }
            console.log("search finished");
            setLoading(false);
            debounceTimeoutRef.current = null;
            searchAbortController.current = null;
        }, 500);
    }

    return (
        <div className="container-mid">
            <PageTitle style={{marginTop:15}}>Join existing rooms!</PageTitle>
            <Input style={{marginBottom:28,marginTop:118}} onChange={onSearchTextChange} className="input-field" placeholder="Search..." />
            <div id="scrollableDiv" className="scrollable-list">
                <InfiniteScroll
                dataLength={data.length}
                next={loadMoreData}
                hasMore={isMoreDataAvailable.current}
                scrollableTarget="scrollableDiv"
                loader={""}>
                    {data.map((room, index) => (
                        <div className="scrollable-list-item" key={index}>
                            <label style={{fontSize:16}}><b>{room.title}</b></label>
                            <div className="sub-item">
                                <div>{room.playersCount}/{room.maxPlayersCount}</div>
                                <JoinToRoomNavigationButton roomName={room.title} style={{marginLeft:100}}/>
                            </div>
                        </div>
                    ))}
                    {loading?<Spinner style={{ margin: '15px' }}/>:""}
                </InfiniteScroll>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', width: '100%'}}>
                <CreateRoomNavigateButton style={{marginTop:28}}/>
            </div>
        </div>
    );
}
