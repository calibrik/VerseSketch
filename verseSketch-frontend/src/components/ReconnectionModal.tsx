import { SyncOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

interface IStatusModalProps {};

export interface IStatusModalHandle{
    show:(status:string)=>void;
    close:()=>void;
};

export const StatusModal =forwardRef<IStatusModalHandle,IStatusModalProps>((_,ref) => {
    const [open,setOpen]=useState<boolean>(false);
    const statusMsg=useRef<string>("")
    
    useImperativeHandle(ref, () => ({
        show: (status:string) => {
            statusMsg.current=status;
            setOpen(true);
        },
        close: () => {
            setOpen(false);
        },
        }));
    return (
        <Modal
        className="status-modal"
        open={open}
        closable={false}
        centered
        footer={null}>
            <label className="status-modal-text">{statusMsg.current}</label>
            <SyncOutlined spin style={{fontSize:30,marginTop:10}}/>
        </Modal>
    );
});