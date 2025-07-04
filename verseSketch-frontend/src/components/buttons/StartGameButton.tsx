import { FC, useState } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { PlaySquareFilled } from "@ant-design/icons";
import { Spinner } from "../Spinner";
interface IStartGameButtonProps {
    style?: React.CSSProperties;
    onClick?: () => Promise<void>;
    isAdmin:boolean
};

export const StartGameButton: FC<IStartGameButtonProps> = (props) => {

    const [loading,setLoading] = useState<boolean>(false);

    async function handleClick() {
        setLoading(true);
        await props.onClick?.();
        setLoading(false);
    }

    return (
        <PrimaryButton
            style={props.style}
            disabled={loading||!props.isAdmin}
            onClick={handleClick}
            icon={loading?<Spinner/>:<PlaySquareFilled className="button-icon" />}>
            {props.isAdmin?"START GAME":"WAITING FOR ADMIN"}
        </PrimaryButton>
    );
}
