import { CloseOutlined } from "@ant-design/icons";
import { CSSProperties, FC } from "react";
import { BaseButton } from "./BaseButton";
interface ICloseModalButtonProps {
    onClick:()=>void;
    style?:CSSProperties
};

export const CloseModalButton: FC<ICloseModalButtonProps> = (props) => {
    return (
        <BaseButton
            className="error-modal-button" 
            style={props.style} 
            onClick={props.onClick} 
            icon={<CloseOutlined className="button-icon-md"/>}>
            Close
        </BaseButton>
    );
}
