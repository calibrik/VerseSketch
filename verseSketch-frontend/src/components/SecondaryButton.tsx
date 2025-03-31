import { FC, ReactNode } from "react";
import { BaseButton } from "./BaseButton";
import '../css/Button.css';
interface ISecondaryButtonProps {
    children:string;
    style?:React.CSSProperties;
    icon?:ReactNode;
    htmlType?:"button" | "submit" | "reset" | undefined;
    onClick?: ()=>void;
    disabled?:boolean;
};

export const SecondaryButton: FC<ISecondaryButtonProps> = (props) => {
    return (
        <div className="secondary-button">
            <BaseButton disabled={props.disabled} htmlType={props.htmlType} style={props.style} onClick={props.onClick} icon={props.icon}>{props.children}</BaseButton>
        </div>
    );
}
