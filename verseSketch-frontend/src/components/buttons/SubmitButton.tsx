import { FC } from "react";
import { BaseButton } from "./BaseButton";
import { CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import { Spinner } from "../Spinner";
interface ISubmitButtonProps {
    style?: React.CSSProperties;
    loading:boolean;
    isSubmitted:boolean;
    onClick?:()=>Promise<void>
};

export const SubmitButton: FC<ISubmitButtonProps> = (props) => {

    let icon;
    if (props.isSubmitted) {
        icon = <EditOutlined className="button-icon"/>
    } 
    else {
        icon = <CheckCircleOutlined className="button-icon"/>;
    }
    
    if (props.loading) {
        icon = <Spinner/>;
    }
    return (
        <BaseButton
            icon={icon}
            className="secondary-button"
            style={props.style}
            htmlType={"submit"}>
                {props.isSubmitted?"EDIT":"SUBMIT"}
        </BaseButton>
    );
}
