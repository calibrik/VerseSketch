import { CloseCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import "../index.css"
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { CloseModalButton } from "./buttons/CloseModalButton";
interface IErrorDisplayClosableProps {};
export interface IErrorDisplayClosableHandle{
    show:(err:string)=>void;
};

export const ErrorDisplayClosable =forwardRef<IErrorDisplayClosableHandle,IErrorDisplayClosableProps>((_,ref) => {
    const [open,setOpen]=useState<boolean>(false);
    const errorMsg=useRef<string>("")
    
    useImperativeHandle(ref, () => ({
        show: (err:string) => {
            errorMsg.current=err;
            setOpen(true);
        },
        }));
    return (
        <Modal
        className="error-modal"
        open={open}
        closable={true}
        centered
        title={<label className="error-modal-title"><CloseCircleOutlined />  Error</label>}
        footer={<div style={{width:'100%',display:'flex',justifyContent:'center'}}><CloseModalButton onClick={()=>setOpen(false)}/></div>}>
            <label className="error-modal-text">{errorMsg.current}</label>
        </Modal>
    );
});
