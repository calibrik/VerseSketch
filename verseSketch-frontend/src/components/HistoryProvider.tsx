import { createContext, FC, ReactNode, useContext, useRef } from "react";
interface IHistoryProviderProps {
    children:ReactNode
};

const HistoryContext=createContext<React.RefObject<string[]>|null>(null);
export const HistoryProvider: FC<IHistoryProviderProps> = (props) => {
    const historyStack=useRef<string[]>([])
    return (
        <HistoryContext.Provider value={historyStack}>
            {props.children}
        </HistoryContext.Provider>
    );
}

export const useHistoryContext = () => {
    const context = useContext(HistoryContext);
    if (!context) {
      throw new Error('useHistoryContext must be used within a ErrorDisplayProvider');
    }
    return context;
  };

