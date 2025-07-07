import { createContext, FC, useContext, useRef } from "react";
interface IRecentColorsProviderProps {
    children?: React.ReactNode;
};

export interface IRecentColorsProviderModel {
    pushColor: (color: string) => void;
    recentColors: React.RefObject<string[]>;
    popColor: (color: string) => void;
}

const RecentColorsContext=createContext<IRecentColorsProviderModel | null>(null);

export const RecentColorsProvider: FC<IRecentColorsProviderProps> = (props) => {
    const recentColors = useRef<string[]>([]);
    const maxRecentColors = 45;

    function pushColor(color: string) {
        // let i = recentColors.current.indexOf(color);
        // if (i !== -1) {
        //     recentColors.current.splice(i, 1);
        // }
        recentColors.current.unshift(color);
        if (recentColors.current.length > maxRecentColors) {
            recentColors.current.pop();
        }
    }

    function popColor(color:string) {
        let i = recentColors.current.indexOf(color);
        if (i !== -1) {
            recentColors.current.splice(i, 1);
        }
    }

    return (
        <RecentColorsContext.Provider value={{
            pushColor: pushColor,
            recentColors: recentColors,
            popColor: popColor
        }}>
            {props.children}
        </RecentColorsContext.Provider>
    );
}

export function useRecentColorsContext() {
    const context = useContext(RecentColorsContext);
    if (!context) {
        throw new Error("useRecentColorsContext must be used within a RecentColorsProvider");
    }
    return context;
}
