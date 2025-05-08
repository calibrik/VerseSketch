import { FC } from "react";
import { SecondaryButton } from "./SecondaryButton";
import { PlusSquareFilled } from "@ant-design/icons";
import { Spinner } from "../Spinner";
interface ICreateRoomButtonProps {
        onClick?:()=>void,
        style?:React.CSSProperties,
        loading?:boolean,
};

export const CreateRoomButton: FC<ICreateRoomButtonProps> = (props) => {
    return (
        <SecondaryButton 
            style={props.style}
            htmlType="submit"
            onClick={props.onClick}
            icon={props.loading?<Spinner/>:<PlusSquareFilled className="button-icon"/>}
            disabled={props.loading}>
            CREATE ROOM
            </SecondaryButton>
    );
}
