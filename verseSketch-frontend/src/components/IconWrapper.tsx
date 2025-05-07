import { FC, ReactNode } from "react";
interface IIconWrapperProps {
    icon:ReactNode
};

export const IconWrapper: FC<IIconWrapperProps> = (props) => {
    return (
        <div style={{display:'flex',justifyContent:"center",alignItems:"center"}}>{props.icon}</div>
    );
}
