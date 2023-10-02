import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CustomToast = (props) => {
  return (
    <ToastContainer
      position={props.position}
      autoClose={props.autoCloseInSeconds}
      hideProgressBar={props.isHideProgressBar}
    />
  );
};

export default CustomToast;
