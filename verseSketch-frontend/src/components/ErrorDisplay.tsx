import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { GoToWelcomePageButton } from "./buttons/GoToWelcomePageButton";
import { Modal } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
interface IErrorDisplayProps {
};

export interface IErrorDisplayHandle{
    show:(err:string)=>void;
}

export const ErrorDisplay = forwardRef<IErrorDisplayHandle,IErrorDisplayProps>((_,ref) => {
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
        closable={false}
        centered
        title={<label className="error-modal-title"><CloseCircleOutlined />  Error</label>}
        footer={<div style={{width:'100%',display:'flex',justifyContent:'center'}}><GoToWelcomePageButton onClick={()=>setOpen(false)}/></div>}
        >
            <label className="error-modal-text">{errorMsg.current}</label>
        </Modal>
    );
})