import { FC } from "react";
interface IStepCounterProps {
    style?: React.CSSProperties;
    step: number;
    totalSteps: number;
};

export const StepCounter: FC<IStepCounterProps> = (props) => {
    return (
        <h1 className="step-counter">{props.step}/{props.totalSteps}</h1>
    );
}
