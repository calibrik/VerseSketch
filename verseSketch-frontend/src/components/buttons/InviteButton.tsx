import { FC, ReactNode, useState } from "react";
import { CheckOutlined, LinkOutlined } from "@ant-design/icons";
import { Spinner } from "../Spinner";
import { BaseButton } from "./BaseButton";
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
        icon=<CheckOutlined className="button-icon"/>
    else
        icon=<LinkOutlined className="button-icon"/>

    return (
        <BaseButton
            onClick={onClick}
            style={props.style}
            disabled={props.disabled||loading||copied}
            className="invite-button"
            icon={icon}>
            {copied?"COPIED":"INVITE"}
        </BaseButton>
    );
}
