import { FC } from "react";
import { BaseButton } from "./BaseButton";
import { CheckCircleOutlined } from "@ant-design/icons";
interface ISubmitButtonProps {
    style?: React.CSSProperties;
};

export const SubmitButton: FC<ISubmitButtonProps> = (props) => {
    return (
        <BaseButton
            icon={<CheckCircleOutlined className="button-icon"/>}
            className="secondary-button"
            style={props.style}
            htmlType={"submit"}>
                SUBMIT
        </BaseButton>
    );
}
