
import { FC } from "react";
import { BaseButton } from "./BaseButton";
import { IconWrapper } from "../IconWrapper";
import { ExitIcon } from "../Icons";
interface IFinishButtonProps {
    disabled?: boolean;
    onClick: () => void;
};

export const FinishButton: FC<IFinishButtonProps> = (props) => {
    return (
        <BaseButton
            className="primary-button"
            disabled={props.disabled}
            onClick={props.onClick}
            iconPosition="end"
            icon={<IconWrapper icon={<ExitIcon/>} />}>
                FINISH
            </BaseButton>
    )
}
