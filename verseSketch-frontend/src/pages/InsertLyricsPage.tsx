import { FC } from "react";
import { PageTitle } from "../components/PageTitle";
import TextArea from "antd/es/input/TextArea";
import { SubmitButton } from "../components/buttons/SubmitButton";
import { StepCounter } from "../components/StepCounter";
interface IInsertLyricsPageProps {};

export const InsertLyricsPage: FC<IInsertLyricsPageProps> = (_) => {
    return (
        <div>
            <StepCounter/>
            <div className="container-small">
                <PageTitle style={{marginTop:"2vh"}}>Past n lines of lyrics of your song!</PageTitle>


                <TextArea style={{marginTop:"5vh"}} className="text-area" autoSize={{minRows:10,maxRows:20}} placeholder="Insert your lyrics here..."/>
                <SubmitButton style={{marginTop:"2vh"}}/>
            </div>
        </div>
    );
}
