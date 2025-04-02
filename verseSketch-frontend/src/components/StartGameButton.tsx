import { FC } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { PlaySquareFilled } from "@ant-design/icons";
interface IStartGameButtonProps {
    style?: React.CSSProperties;
};

export const StartGameButton: FC<IStartGameButtonProps> = (props) => {
    return (
        <PrimaryButton
            style={props.style}
            icon={<PlaySquareFilled style={{ fontSize: 30 }} />}>
            START THE GAME
        </PrimaryButton>
    );
}
