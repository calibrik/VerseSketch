import { PlaySquareFilled } from "@ant-design/icons";
import { FC } from "react";
import { useNavigate } from "react-router";
import '../../index.css'
import { useHistoryContext } from "../HistoryProvider";
import { BaseButton } from "./BaseButton";
interface IJoinToRoomNavigationButtonProps {
    style?:React.CSSProperties
    roomName:string
};

export const JoinToRoomNavigationButton: FC<IJoinToRoomNavigationButtonProps> = (props) => {
    const navigate=useNavigate();
    const historyStack=useHistoryContext();
    return (
        <BaseButton
            style={props.style}
            className="join-room-button"
            icon={<PlaySquareFilled className="button-icon" />}
            onClick={() => {
                historyStack.current=[location.pathname];
                navigate(`/join-room/${props.roomName}`,{replace:true});
            }}/>
    );
};
