import { FC } from "react";
import { SecondaryButton } from "./SecondaryButton";
import { useNavigate } from "react-router";
import { PlusSquareFilled } from "@ant-design/icons";
import { useHistoryContext } from "../HistoryProvider";
interface ICreateRoomNavigateButtonProps {
    style?:React.CSSProperties
};

export const CreateRoomNavigateButton: FC<ICreateRoomNavigateButtonProps> = (props) => {
    const navigate=useNavigate();
    const historyStack=useHistoryContext();
    return (
        <SecondaryButton
            style={props.style}
            onClick={()=>{
                historyStack.current=[location.pathname];
                navigate('/create-room',{replace:true});
            }} 
            icon={<PlusSquareFilled style={{fontSize:33}}/>}>
            CREATE ROOM
        </SecondaryButton>
    );
}
