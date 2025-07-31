import { FC } from "react";
import { BaseButton } from "./BaseButton";
interface IShowButtonProps {};

export const ShowButton: FC<IShowButtonProps> = (props) => {
    return (
        <BaseButton
            className="show-button">
            SHOW
        </BaseButton>
    );
}
