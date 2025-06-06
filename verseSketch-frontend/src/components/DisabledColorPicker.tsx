import ColorPicker, { Color } from "antd/es/color-picker";
import { FC } from "react";
interface IDisabledColorPickerProps {
    color:string
    onClick?:()=>void
};

export const DisabledColorPicker: FC<IDisabledColorPickerProps> = (props) => {
    return (
        <div style={{display:'flex',justifyContent:'center'}} onClick={props.onClick}>
            <ColorPicker className="recent-color" disabled defaultValue={props.color} />
        </div>
    );
}
