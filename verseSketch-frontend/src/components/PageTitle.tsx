import { FC } from "react";
import Title from "antd/es/typography/Title";
import './PageTitle.css'
interface IPageTitleProps {
    children:string
};

export const PageTitle: FC<IPageTitleProps> = (props) => {
    return (
        <Title className="page-title" level={1}>{props.children}</Title>
    );
}
