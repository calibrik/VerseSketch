import { Progress } from "antd";
import { FC, useEffect, useState } from "react";
import { Color } from "../misc/colors";
import { useSignalRConnectionContext } from "./SignalRProvider";
import { delay } from "../misc/MiscFunctions";
interface ITimerProps {
    onTimeIsUp:()=>void
};

export const Timer: FC<ITimerProps> = (props) => {
    const [percent, setPercent] = useState<number>(0);
    const signalRModel = useSignalRConnectionContext();

    async function onTimeIsUp()
    {
        await delay(1000);
        props.onTimeIsUp();
    }

    useEffect(() => {
        let startTime = Date.now();
        const interval = setInterval(() => {
            if (!signalRModel.roomModelRef.current) {
                clearInterval(interval);
                return;
            }
            const elapsed = Date.now() - startTime;
            const newPercent = Math.min((elapsed / (signalRModel.roomModelRef.current.timeToDraw * 1000)) * 100, 100);
            setPercent(newPercent);
            if (elapsed>=(signalRModel.roomModelRef.current.timeToDraw * 1000)) {
                onTimeIsUp();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
            <Progress style={{ transition: "all 1s" }} className="timer" size="small" percent={percent} showInfo={false} trailColor={Color.InputField} strokeColor={Color.Secondary} />
        </div>
    );
}
