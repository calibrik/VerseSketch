import { FC } from "react";
import { SyncOutlined } from "@ant-design/icons";
import { Button } from "antd";
interface IRefreshButtonProps {
    style?: React.CSSProperties;
    onClick?: () => void;
    spin?: boolean;
    disabled?: boolean;
};

export const RefreshButton: FC<IRefreshButtonProps> = (props) => {
    return (
        <Button
            type="primary"
            style={props.style}
            onClick={props.onClick}
            disabled={props.disabled}
            className="refresh-button"
            icon={<SyncOutlined spin={props.spin} style={{fontSize:23}}/>}/>
    );
}
