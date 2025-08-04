import { FC } from "react";
import { BaseButton } from "./BaseButton";
import { PlaySquareFilled } from "@ant-design/icons";
interface IPlayButtonProps {
    onClick: () => Promise<void>;
    style?: React.CSSProperties;
    disabled?: boolean;
    children:string
};

export const PlayButton: FC<IPlayButtonProps> = (props) => {
    return (
        <BaseButton
            className="primary-button"
            onClick={props.onClick}
            style={props.style}
            disabled={props.disabled}
            icon={<PlaySquareFilled className="button-icon" />}>
            {props.children}
        </BaseButton>
    );
}
