import { CSSProperties, FC } from "react";
import { BaseButton } from "./BaseButton";
import { StepForwardOutlined } from "@ant-design/icons";
interface ISkipButtonProps {
    style?:CSSProperties
};

export const SkipButton: FC<ISkipButtonProps> = (props) => {
    return (
        <BaseButton
        className="primary-button"
        iconPosition="end"
        icon={<StepForwardOutlined className="button-icon"/>}
        {...props}>
            SKIP PLAYER
        </BaseButton>
    );
}
