import { PlaySquareFilled } from "@ant-design/icons";
import { Button } from "antd";
import { FC } from "react";
import { useNavigate } from "react-router";
import '../../index.css'
import { useHistoryContext } from "../HistoryProvider";
interface IJoinToRoomNavigationButtonProps {
    style?:React.CSSProperties
    roomName:string
};

export const JoinToRoomNavigationButton: FC<IJoinToRoomNavigationButtonProps> = (props) => {
    const navigate=useNavigate();
    const historyStack=useHistoryContext();
    return (
        <Button
            style={props.style}
            className="join-room-button"
            type="primary"
            icon={<PlaySquareFilled style={{ fontSize: 30 }} />}
            onClick={() => {
                historyStack.current=[location.pathname];
                navigate(`/join-room/${props.roomName}`,{replace:true});
            }}/>
    );
};
