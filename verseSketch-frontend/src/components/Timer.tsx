import { Progress } from "antd";
import { FC } from "react";
import { Color } from "../misc/colors";
interface ITimerProps {
    time: number;
};

export const Timer: FC<ITimerProps> = (props) => {
    return (
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",width:"100%"}}>
            <Progress className="timer" size="small" percent={30} showInfo={false} trailColor={Color.InputField} strokeColor={Color.Secondary}/>
        </div>
    );
}
