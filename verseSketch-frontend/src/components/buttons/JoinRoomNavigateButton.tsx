import { FC } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { PlaySquareFilled } from "@ant-design/icons";
import { useNavigate } from "react-router";
interface IJoinRoomNavigateButtonProps {};

export const JoinRoomNavigateButton: FC<IJoinRoomNavigateButtonProps> = () => {

    let navigate=useNavigate()

    return (
        <PrimaryButton 
            onClick={()=>navigate('/join-room',{replace:true})} 
            icon={<PlaySquareFilled className="button-icon" />}>
            JOIN ROOM
        </PrimaryButton>
    );
}
