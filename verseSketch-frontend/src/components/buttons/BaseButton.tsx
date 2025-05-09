import { Button } from "antd";
import { FC, ReactNode } from "react";
import { IconWrapper } from "../IconWrapper";
interface IBaseButtonProps {
    icon?:ReactNode
    children?:string,
    onClick?:()=>void,
    style?:React.CSSProperties,
    htmlType?:"button" | "submit" | "reset" | undefined,
    disabled?:boolean,
    className?:string,
    iconPosition?:"start"|"end";
};

export const BaseButton: FC<IBaseButtonProps> = (props) => {
    return (
        <Button 
            disabled={props.disabled}
            type="primary"
            htmlType={props.htmlType}
            style={props.style}
            icon={<IconWrapper icon={props.icon}/>}
            onClick={props.onClick}
            className={props.className}
            iconPosition={props.iconPosition??"end"}>
            {props.children!=null?<span className="button-text">{props.children}</span>:""}   
        </Button>
    );
}
