import { createContext, FC, ReactNode, RefObject, useContext, useRef } from "react";
import { ErrorDisplay, IErrorDisplayHandle } from "./ErrorDisplay";
import { ErrorDisplayClosable, IErrorDisplayClosableHandle } from "./ErrorDisplayClosable";
interface IErrorDisplayProviderProps {
    children?:ReactNode
};
interface IErrorDisplayContextType{
    errorModal:RefObject<IErrorDisplayHandle | null>;
    errorModalClosable:RefObject<IErrorDisplayClosableHandle | null>;
}

const ErrorDisplayContext=createContext<IErrorDisplayContextType | null>(null)

export const ErrorDisplayProvider: FC<IErrorDisplayProviderProps> = (props) => {
    const errorModal=useRef<IErrorDisplayHandle|null>(null);
    const errorModalClosable=useRef<IErrorDisplayClosableHandle | null>(null);

    return (
        <ErrorDisplayContext.Provider value={{errorModal,errorModalClosable}}>
            <ErrorDisplay ref={errorModal}/>
            <ErrorDisplayClosable ref={errorModalClosable}/>
            {props.children}
        </ErrorDisplayContext.Provider>
    );
}

export const useErrorDisplayContext = () => {
    const context = useContext(ErrorDisplayContext);
    if (!context) {
      throw new Error('useErrorDisplayContext must be used within a ErrorDisplayProvider');
    }
    return context;
  };
