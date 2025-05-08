import { FC } from "react";
import { PlaySquareFilled } from "@ant-design/icons";
import { PrimaryButton } from "./PrimaryButton";
import { Spinner } from "../Spinner";
interface IJoinRoomButtonProps {
    style?: React.CSSProperties;
    loading?: boolean;
};

export const JoinRoomButton: FC<IJoinRoomButtonProps> = (props) => {

    return (
        <PrimaryButton 
            htmlType="submit" 
            style={props.style} 
            icon={props.loading?<Spinner/>:<PlaySquareFilled className="button-icon"/>}
            disabled={props.loading}>
            JOIN ROOM
        </PrimaryButton>
    );
}
