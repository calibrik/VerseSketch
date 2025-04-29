import { CSSProperties, FC, useState } from "react";
import { BaseButton } from "./BaseButton";
import { Spinner } from "../Spinner";
import { LogoutOutlined } from "@ant-design/icons";
interface ILeaveRoomButtonProps {
    style?:CSSProperties;
    disabled?:boolean;
    onClick:()=>Promise<void>;
};

export const LeaveRoomButton: FC<ILeaveRoomButtonProps> = (props) => {
    const [loading,setLoading]=useState<boolean>(false);
    async function onClick()
    {
        setLoading(true);
        await props.onClick();
        setLoading(false);
    }

    return (
        <BaseButton
        className="leave-button"
        style={props.style}
        disabled={loading||props.disabled}
        icon={loading?<Spinner/>:<LogoutOutlined style={{fontSize:20}}/>}
        onClick={onClick}>
            LEAVE
        </BaseButton>
    );
}
