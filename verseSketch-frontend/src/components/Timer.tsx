import { Progress } from "antd";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Color } from "../misc/colors";
import { useSignalRConnectionContext } from "./SignalRProvider";
import { delay } from "../misc/MiscFunctions";
interface ITimerProps {
    onTimeIsUp:()=>void
};

export interface ITimerHandle {
    reset: () => void;
}

export const Timer = forwardRef<ITimerHandle, ITimerProps>((props, ref) => {
    const [percent, setPercent] = useState<number>(0);
    const signalRModel = useSignalRConnectionContext();
    const intervalRef=useRef<NodeJS.Timeout>(undefined);

    async function onTimeIsUp() {
        await delay(1000);
        props.onTimeIsUp();
    }

    useImperativeHandle(ref, () => ({
        reset: () => {
            clearInterval(intervalRef.current);
            setPercent(0);
            startTimer();
        }
    }));

    function startTimer() {
        let startTime = Date.now();
        intervalRef.current = setInterval(() => {
            if (!signalRModel.roomModelRef.current) {
                clearInterval(intervalRef.current);
                return;
            }
            const elapsed = Date.now() - startTime;
            const newPercent = Math.min((elapsed / (signalRModel.roomModelRef.current.timeToDraw * 1000)) * 100, 100);
            setPercent(newPercent);
            if (elapsed >= (signalRModel.roomModelRef.current.timeToDraw * 1000)) {
                onTimeIsUp();
                clearInterval(intervalRef.current);
            }
        }, 1000);
    }

    useEffect(() => {
        startTimer();
        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
            <Progress style={{ transition: "all 1s" }} className="timer" size="small" percent={percent} showInfo={false} trailColor={Color.InputField} strokeColor={Color.Secondary} />
        </div>
    );
});
