import { FC } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
interface IGoToWelcomePageButtonProps {
    style?:React.CSSProperties
};

export const GoToWelcomePageButton: FC<IGoToWelcomePageButtonProps> = (props) => {
    const navigate=useNavigate();
    return (
        <PrimaryButton style={props.style} onClick={()=>navigate("/")} icon={<HomeOutlined style={{fontSize:20}}/>}>Home</PrimaryButton>
    );
}
