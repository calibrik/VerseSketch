import { FC, useState } from "react";
import { SecondaryButton } from "./SecondaryButton";
import { LinkOutlined } from "@ant-design/icons";
import { Spinner } from "./Spinner";
interface IInviteButtonProps {
    style?:React.CSSProperties;
    onClick:()=>Promise<void>;
    disabled?:boolean
};

export const InviteButton: FC<IInviteButtonProps> = (props) => {
    const [loading,setLoading]=useState<boolean>(false);

    async function onClick()
    {
        setLoading(true);
        await props.onClick();
        setLoading(false);
    }

    return (
        <SecondaryButton onClick={onClick} style={props.style} disabled={props.disabled||loading} icon={loading?<Spinner/>:<LinkOutlined style={{fontSize:25}}/>}>INVITE</SecondaryButton>
    );
}
