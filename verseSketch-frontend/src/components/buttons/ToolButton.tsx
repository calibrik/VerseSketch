import { FC } from "react";
interface IToolButtonProps {
    active: boolean;
    icon: React.ReactNode;
    style?: React.CSSProperties;
    onClick?: () => void;
};

export const ToolButton: FC<IToolButtonProps> = (props) => {
    let className="tool-button"+(props.active ? " active" : "");
    return (
        <div onClick={props.onClick} onTouchStart={props.onClick} className={className} style={props.style}>
            {props.icon}
        </div>
    );
}
