import { FC } from "react";
import { PlaySquareFilled } from "@ant-design/icons";
import { PrimaryButton } from "./PrimaryButton";
interface IJoinRoomButtonProps {
    style?: React.CSSProperties;
};

export const JoinRoomButton: FC<IJoinRoomButtonProps> = (props) => {

    return (
        <PrimaryButton htmlType="submit" style={props.style} icon={<PlaySquareFilled style={{ fontSize: 33 }} />}>JOIN ROOM</PrimaryButton>
    );
}
