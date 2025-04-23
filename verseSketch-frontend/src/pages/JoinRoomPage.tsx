import { FC, useEffect, useRef, useState } from "react";
import { PageTitle } from "../components/PageTitle";
import { Flex, Input} from "antd";
import { Spinner } from "../components/Spinner";
import { JoinToRoomNavigationButton } from "../components/buttons/JoinToRoomNavigationButton";
import { CreateRoomNavigateButton } from "../components/buttons/CreateRoomNavigateButton";
import { ConnectionConfig } from "../misc/ConnectionConfig";
import InfiniteScroll from "react-infinite-scroll-component";
import { SearchOutlined } from "@ant-design/icons";
import { RefreshButton } from "../components/buttons/RefreshButton";
import { useErrorDisplayContext } from "../components/ErrorDisplayProvider";
interface IJoinRoomPageProps {
};

interface IRoomModel{
    title:string;
    playersCount:number;
    maxPlayersCount:number;
};

export const JoinRoomPage: FC<IJoinRoomPageProps> = () => {
    const [data, setData] = useState<IRoomModel[]>([]);
    const searchText = useRef<string>("");
    const pageSize=9;
    const isMoreDataAvailable=useRef<boolean>(true);
    const pageNumber=useRef<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const debounceTimeoutRef = useRef<number | null>(null);
    const loadMoreAbortController=useRef<AbortController | null>(null);
    const searchAbortController=useRef<AbortController | null>(null);
    const errorModals=useErrorDisplayContext();


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

    async function onRefresh() {
        if (loading)
            return;
        setLoading(true);
        pageNumber.current=0;
        setData([]);
        searchAbortController.current=new AbortController();
        try{
            await search(searchAbortController.current.signal);
        }
        catch(error:any) {
            if (error.name !== 'AbortError') {
                errorModals.errorModalClosable.current?.show("No connection to the server.")
                setLoading(false);
            }
            return;
        }
        console.log("search finished");
        setLoading(false);
        searchAbortController.current = null;
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
                errorModals.errorModalClosable.current?.show("No connection to the server.")
                setLoading(false);
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
                    errorModals.errorModalClosable.current?.show("No connection to the server.")
                    setLoading(false);
                }
                return;
            }
            console.log("search finished");
            setLoading(false);
            debounceTimeoutRef.current = null;
            searchAbortController.current = null;
        }, 300);
    }

    return (
        <div className="container-mid">
            <PageTitle style={{marginTop:15}}>Join existing rooms!</PageTitle>
            <Flex
                justify="space-between"
                align="center"
                dir="row"
                style={{marginBottom:28,marginTop:118, width:'100%'}}
                gap={22}>
                <Input onChange={onSearchTextChange} suffix={<SearchOutlined style={{fontSize:20}}/>} className="input-field" placeholder="Search..." />
                <RefreshButton spin={loading} onClick={onRefresh} disabled={loading}/>
            </Flex>
            <div id="scrollableDiv" className="scrollable-list">
                <InfiniteScroll
                dataLength={data.length}
                next={loadMoreData}
                hasMore={isMoreDataAvailable.current}
                scrollableTarget="scrollableDiv"
                loader={""}>
                    {
                        data.length===0?
                        <div style={{marginTop:20, display:'flex', justifyContent:'center', alignItems:'center'}}>
                            <label className="placeholder-text">No rooms found</label>
                        </div>:
                        data.map((room, index) => (
                            <div className="scrollable-list-item" key={index}>
                                <label style={{fontSize:16}}><b>{room.title}</b></label>
                                <div className="sub-item">
                                    <div>{room.playersCount}/{room.maxPlayersCount}</div>
                                    <JoinToRoomNavigationButton roomName={room.title} style={{marginLeft:100}}/>
                                </div>
                            </div>
                        ))
                    }
                    {loading?<Spinner style={{ margin: '15px' }}/>:""}
                </InfiniteScroll>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', width: '100%'}}>
                <CreateRoomNavigateButton style={{marginTop:28}}/>
            </div>
        </div>
    );
}
