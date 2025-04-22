import { FC } from "react";
import { SecondaryButton } from "./SecondaryButton";
import { useNavigate } from "react-router";
import { PlusSquareFilled } from "@ant-design/icons";
interface ICreateRoomNavigateButtonProps {
    style?:React.CSSProperties
};

export const CreateRoomNavigateButton: FC<ICreateRoomNavigateButtonProps> = (props) => {
    let navigate=useNavigate()
    return (
        <SecondaryButton style={props.style} onClick={()=>{navigate('/create-room',{replace:true})}} icon={<PlusSquareFilled style={{fontSize:33}}/>}>CREATE ROOM</SecondaryButton>
    );
}
