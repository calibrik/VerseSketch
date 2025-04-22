import { FC } from "react";
import { HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { BaseButton } from "./BaseButton";
interface IGoToWelcomePageButtonProps {
    style?:React.CSSProperties;
    onClick:()=>void;
};

export const GoToWelcomePageButton: FC<IGoToWelcomePageButtonProps> = (props) => {
    const navigate=useNavigate();
    return (
        <BaseButton
            className="error-modal-button" 
            style={props.style} 
            onClick={async ()=>{
                props.onClick();
                navigate("/",{replace:true});
            }} 
            icon={<HomeOutlined style={{fontSize:20}}/>}>
            Go Home
        </BaseButton>
    );
}
