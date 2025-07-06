import { FC } from "react";
import { useSignalRConnectionContext } from "./SignalRProvider";
interface IStageCounterProps {
    style?: React.CSSProperties;
};

export const StageCounter: FC<IStageCounterProps> = (props) => {
    const signalRModel = useSignalRConnectionContext();
    return (
        <h1 style={props.style} className="step-counter">{(signalRModel.roomModelRef.current?.stage??0)+1}/{signalRModel.roomModelRef.current?.playersCount}</h1>
    );
}
