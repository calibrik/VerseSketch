import { FC, useEffect } from "react";
import { useNavigate } from "react-router";
import { leave } from "../misc/MiscFunctions";
interface IErrorPageProps {};

export const ErrorPage: FC<IErrorPageProps> = () => {
    const navigate = useNavigate();
    useEffect(() => {
        leave();
        navigate("/");
    }, []);

    return null;
}
