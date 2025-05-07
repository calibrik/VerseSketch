import { Loading3QuartersOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { FC } from "react";
import { IconWrapper } from "./IconWrapper";
interface ISpinnerProps {
    style?: React.CSSProperties
};

export const Spinner: FC<ISpinnerProps> = (props) => {
    return (
        <div style={{display:"flex", justifyContent: "center"}}>
            <Spin style={props.style} indicator={<IconWrapper icon={<Loading3QuartersOutlined className="spinner" spin />} />}/>
        </div>
    );
}
