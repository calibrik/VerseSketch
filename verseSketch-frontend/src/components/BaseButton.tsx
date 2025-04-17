import { Button } from "antd";
import { FC, ReactNode } from "react";
interface IBaseButtonProps {
    icon:ReactNode
    children?:string,
    onClick?:()=>void,
    style?:React.CSSProperties,
    htmlType?:"button" | "submit" | "reset" | undefined,
    disabled?:boolean,
    className?:string,
};

export const BaseButton: FC<IBaseButtonProps> = (props) => {
    return (
        <Button 
            disabled={props.disabled}
            type="primary"
            htmlType={props.htmlType}
            style={props.style}
            icon={props.icon}
            onClick={props.onClick}
            className={props.className}
            iconPosition="end">
            <span className="button-text">{props.children}</span>   
        </Button>
    );
}
