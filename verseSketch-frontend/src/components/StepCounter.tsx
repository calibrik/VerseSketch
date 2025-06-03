import { FC } from "react";
interface IStepCounterProps {
    style?: React.CSSProperties;
};

export const StepCounter: FC<IStepCounterProps> = (props) => {
    return (
        <div style={{...props.style,width:"100%",display:"flex",marginLeft:"1vw",marginTop:"1vh"}}>
            <h1 className="step-counter">1/5</h1>
        </div>
    );
}
