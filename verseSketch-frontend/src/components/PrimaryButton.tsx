import { FC, ReactNode } from "react";
import '../css/Button.css';
import { BaseButton } from "./BaseButton";

interface IPrimaryButtonProps {
    style?: React.CSSProperties;
    children:string,
    icon?:ReactNode
    onClick?: ()=>void
    htmlType?:"button" | "submit" | "reset" | undefined,
    disabled?:boolean,
};

export const PrimaryButton: FC<IPrimaryButtonProps> = (props) => {
    return (
        <BaseButton
            className="primary-button" 
            htmlType={props.htmlType} 
            style={props.style} 
            onClick={props.onClick} 
            icon={props.icon}
            disabled={props.disabled}>
            {props.children}
        </BaseButton>
    );
}
