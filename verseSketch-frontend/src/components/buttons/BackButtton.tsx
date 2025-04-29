import { CSSProperties, FC, useState } from "react";
import { BaseButton } from "./BaseButton";
import { Spinner } from "../Spinner";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useHistoryContext } from "../HistoryProvider";
import { useNavigate } from "react-router";
interface IBackButtonProps {
    style?:CSSProperties;
    beforeBack?:()=>Promise<void>
};

export const BackButton: FC<IBackButtonProps> = (props) => {
    const [loading,setLoading]=useState<boolean>(false);
    const historyStack=useHistoryContext();
    const navigate=useNavigate();

    async function onClick()
    {
        setLoading(true);
        if (props.beforeBack)
            await props.beforeBack();
        navigate(historyStack.current.pop()??"/",{replace:true});
        setLoading(false);
    }

    return (
        <BaseButton
            className="back-button"
            onClick={onClick}
            style={props.style}
            disabled={loading}
            icon={loading?<Spinner/>:<ArrowLeftOutlined style={{fontSize:20}}/>}
            iconPosition="start">
            BACK
        </BaseButton>
    );
}
