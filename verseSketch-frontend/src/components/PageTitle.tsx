import { FC } from "react";
import '../index.css'
interface IPageTitleProps {
    children:string
    style?:React.CSSProperties
};

export const PageTitle: FC<IPageTitleProps> = (props) => {
    return (
        <h1 style={props.style} className="page-title">{props.children}</h1>
    );
}
