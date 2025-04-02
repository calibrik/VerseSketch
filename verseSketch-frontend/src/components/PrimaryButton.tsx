import { FC, ReactNode } from "react";
import '../css/Button.css';
import { BaseButton } from "./BaseButton";

interface IPrimaryButtonProps {
    style?: React.CSSProperties;
    children:string,
    icon?:ReactNode
    onClick?: ()=>void
};

export const PrimaryButton: FC<IPrimaryButtonProps> = (props) => {
    return (
        <div className="primary-button">
            <BaseButton style={props.style} onClick={props.onClick} icon={props.icon}>{props.children}</BaseButton>
        </div>
    );
}
