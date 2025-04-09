import { PlaySquareFilled } from "@ant-design/icons";
import { Button } from "antd";
import { FC } from "react";
import { useNavigate } from "react-router";
import '../css/JoinRoomButton.css'
interface IJoinToRoomVavigationButtonProps {
    style?:React.CSSProperties
    roomName:string
};

export const JoinToRoomVavigationButton: FC<IJoinToRoomVavigationButtonProps> = (props) => {
    const navigate=useNavigate();
    return (
        <Button
            style={props.style}
            className="join-room-button"
            type="primary"
            icon={<PlaySquareFilled style={{ fontSize: 30 }} />}
            onClick={() => {
                navigate(`/join-room/${props.roomName}`);
            }}/>
    );
};
