import { FC } from "react";
import { Canvas } from "../components/Canvas";
import { PageTitle } from "../components/PageTitle";
interface IDrawingPageProps {};

export const DrawingPage: FC<IDrawingPageProps> = (props) => {
    return (
        <div className="container-mid">
            <div className="conatainer-small">
                <PageTitle>Ridin' in my GNX with Anita Baker in the tape deck, it's gon' be a sweet love</PageTitle>
                <PageTitle>Fuck apologies, I wanna see y'all geeked up</PageTitle>
            </div>
            <Canvas />
        </div>
    );
}
