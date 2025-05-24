import { FC, use, useEffect } from "react";
import { useNavigate } from "react-router";
import { leave } from "../misc/MiscFunctions";
import { useSignalRConnectionContext } from "../components/SignalRProvider";
interface IErrorPageProps {};

export const ErrorPage: FC<IErrorPageProps> = () => {
    const navigate = useNavigate();
    const connection=useSignalRConnectionContext();
    useEffect(() => {
        leave(connection);
        navigate("/");
    }, []);

    return (
        <div>
            
        </div>
    );
}
