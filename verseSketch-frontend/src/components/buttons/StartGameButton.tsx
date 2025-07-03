import { FC } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { PlaySquareFilled } from "@ant-design/icons";
interface IStartGameButtonProps {
    style?: React.CSSProperties;
    onClick?: () => void;
};

export const StartGameButton: FC<IStartGameButtonProps> = (props) => {
    return (
        <PrimaryButton
            style={props.style}
            onClick={props.onClick}
            icon={<PlaySquareFilled className="button-icon" />}>
            START GAME
        </PrimaryButton>
    );
}
