import { createContext, FC, useContext, useEffect, useRef } from "react";
import { getHeightLevel, getWidthLevel, WindowLevel } from "../misc/MiscFunctions";
interface IWindowLevelProviderProps {
    children?: React.ReactNode;
};
interface IWindowLevelContext {
    widthLevel: React.RefObject<WindowLevel>;
    heightLevel: React.RefObject<WindowLevel>;
}

const WindowLevelContext = createContext<IWindowLevelContext | null>(null);

export const WindowLevelProvider: FC<IWindowLevelProviderProps> = (props) => {
    const widthLevel = useRef<WindowLevel>(WindowLevel.XS);
    const heightLevel= useRef<WindowLevel>(WindowLevel.XS);

     function onResize() {
        widthLevel.current=getWidthLevel();
        heightLevel.current=getHeightLevel();
    }

    useEffect(() => {
        onResize();
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
        }
    }
    , []);
    return (
        <WindowLevelContext.Provider value={{ widthLevel: widthLevel, heightLevel: heightLevel }}>
            {props.children}
        </WindowLevelContext.Provider>
    );
}

export const useWindowLevelContext = () => {
    const context = useContext(WindowLevelContext);
    if (!context) {
        throw new Error('useWindowLevelContext must be used within a WindowLevelProvider');
    }
    return context;
};