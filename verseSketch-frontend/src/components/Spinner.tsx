import { Loading3QuartersOutlined, LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { FC } from "react";
import { Color } from "../misc/colors";
interface ISpinnerProps {};

export const Spinner: FC<ISpinnerProps> = () => {
    return (
        <div style={{display:"flex", justifyContent: "center"}}>
            <Spin style={{color: Color.Secondary}} size="large" indicator={<Loading3QuartersOutlined spin />} />
        </div>
    );
}
