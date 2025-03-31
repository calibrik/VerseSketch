import { Loading3QuartersOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { FC } from "react";
import { Color } from "../misc/colors";
interface ISpinnerProps {
    style?: React.CSSProperties
};

export const Spinner: FC<ISpinnerProps> = (props) => {
    return (
        <div style={{display:"flex", justifyContent: "center"}}>
            <Spin style={{ ...props.style, color: Color.Secondary }} size="large" indicator={<Loading3QuartersOutlined spin />} />
        </div>
    );
}
