import { FC, ReactNode } from "react";
import { BaseButton } from "./BaseButton";
interface ISecondaryButtonProps {
    children:string,
    icon?:ReactNode
    onClick?: ()=>void
};

export const SecondaryButton: FC<ISecondaryButtonProps> = (props) => {
    return (
        <div className="secondary-button">
            <BaseButton onClick={props.onClick} icon={props.icon}>{props.children}</BaseButton>
        </div>
    );
}
