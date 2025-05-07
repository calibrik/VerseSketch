import { FC } from "react";
import { SyncOutlined } from "@ant-design/icons";
import { BaseButton } from "./BaseButton";
interface IRefreshButtonProps {
    style?: React.CSSProperties;
    onClick?: () => void;
    spin?: boolean;
    disabled?: boolean;
};

export const RefreshButton: FC<IRefreshButtonProps> = (props) => {
    return (
        <BaseButton
            style={props.style}
            onClick={props.onClick}
            disabled={props.disabled}
            className="refresh-button"
            icon={<SyncOutlined spin={props.spin} className="button-icon-md"/>}/>
    );
}
