import { PlaySquareFilled } from "@ant-design/icons";
import { Button } from "antd";
import { FC } from "react";
import '../css/JoinRoomButton.css'
interface IJoinRoomButtonProps {
    style?:React.CSSProperties
};

export const JoinRoomButton: FC<IJoinRoomButtonProps> = (props) => {

    return (
        <Button
            style={props.style}
            className="join-room-button"
            type="primary"
            icon={<PlaySquareFilled style={{ fontSize: 30 }} />}
            htmlType="submit"
        />);
};
