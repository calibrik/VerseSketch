import { FC } from "react";
import { GoToWelcomePageButton } from "./GoToWelcomePageButton";
interface IErrorDisplayProps {
    children: string;
    style?:React.CSSProperties;
};

export const ErrorDisplay: FC<IErrorDisplayProps> = (props) => {
    return (
        <div style={props.style} className="container-mid">
            <label style={{width:'100%',textAlign:"center"}} className="error-placeholder-text">{props.children}</label>
            <GoToWelcomePageButton style={{marginTop:100}}/>
        </div>
    );
}
