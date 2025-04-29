import { HubConnection } from "@microsoft/signalr";
import { createContext, FC, ReactNode, useContext, useRef } from "react";
interface ISignalRProviderProps {
    children:ReactNode
};

const SignalRContext=createContext<React.RefObject<HubConnection | null> | null>(null);

export const SignalRProvider: FC<ISignalRProviderProps> = (props) => {

    const connection = useRef<signalR.HubConnection | null>(null);

    return (
        <SignalRContext.Provider value={connection}>
            {props.children}
        </SignalRContext.Provider>
    );
}

export const useSignalRConnectionContext = () => {
    const context = useContext(SignalRContext);
    if (!context) {
      throw new Error('useSignalRConnection must be used within a SignalRProvider');
    }
    return context;
  };
