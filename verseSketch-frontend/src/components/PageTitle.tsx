import { FC } from "react";
import Title from "antd/es/typography/Title";
import '../index.css'
interface IPageTitleProps {
    children:string
    style?:React.CSSProperties
};

export const PageTitle: FC<IPageTitleProps> = (props) => {
    return (
        <Title style={props.style} className="page-title" level={1}>{props.children}</Title>
    );
}
