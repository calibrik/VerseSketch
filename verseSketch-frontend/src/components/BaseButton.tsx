import { Button } from "antd";
import { FC, ReactNode } from "react";
interface IBaseButtonProps {
    icon:ReactNode
    children?:string
    onClick?:()=>void
};

export const BaseButton: FC<IBaseButtonProps> = (props) => {
    return (
        <Button type="primary" icon={props.icon} onClick={props.onClick} iconPosition="end"><span className="button-text">{props.children}</span></Button>
    );
}
