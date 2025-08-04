import { useRef } from "react";
import { FC } from "react";
interface ITextAreaProps {
    disabled?: boolean;
    style?: React.CSSProperties;
    placeholder?: string;
    onChange?:(value:string)=>void;
};

export const TextArea: FC<ITextAreaProps> = (props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maxLines = 16;
    const minLines = 10;

    const handleInput = (e:any) => {
        if (!textareaRef.current)
            return;
        let rows = e.target.value.split("\n").length;
        textareaRef.current.rows = Math.max(minLines, Math.min(rows, maxLines));
        if (rows >= maxLines)
            textareaRef.current.style.overflowY = "auto";
        props.onChange?.(e.target.value);
    };

    return (
        <textarea
            ref={textareaRef}
            disabled={props.disabled}
            style={props.style}
            placeholder={props.placeholder}
            className="text-area"
            onInput={handleInput}
            rows={minLines}
        />
    );
}
