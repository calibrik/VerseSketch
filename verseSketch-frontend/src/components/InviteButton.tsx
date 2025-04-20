import { FC, ReactNode, useState } from "react";
import { SecondaryButton } from "./SecondaryButton";
import { CheckOutlined, LinkOutlined } from "@ant-design/icons";
import { Spinner } from "./Spinner";
interface IInviteButtonProps {
    style?:React.CSSProperties;
    onClick:()=>Promise<void>;
    disabled?:boolean
};

export const InviteButton: FC<IInviteButtonProps> = (props) => {
    const [loading,setLoading]=useState<boolean>(false);
    const [copied,setCopied]=useState<boolean>(false);

    async function onClick()
    {
        setLoading(true);
        await props.onClick();
        setLoading(false);
        setCopied(true);
        setTimeout(()=>setCopied(false),1000);
    }

    let icon:ReactNode;
    if (loading)
        icon=<Spinner/>
    else if (copied)
        icon=<CheckOutlined style={{fontSize:25}}/>
    else
        icon=<LinkOutlined style={{fontSize:25}}/>

    return (
        <SecondaryButton onClick={onClick} style={props.style} disabled={props.disabled||loading||copied} icon={icon}>{copied?"COPIED":"INVITE"}</SecondaryButton>
    );
}
