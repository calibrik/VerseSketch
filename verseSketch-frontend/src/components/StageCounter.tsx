import { FC } from "react";
interface IStageCounterProps {
    style?: React.CSSProperties;
    stage: number;
    maxStage: number;
};

export const StageCounter: FC<IStageCounterProps> = (props) => {
    return (
        <h1 style={props.style} className="step-counter">{(props.stage)+1}/{props.maxStage}</h1>
    );
}
