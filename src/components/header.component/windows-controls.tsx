import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "@/electron-actions/window-actions";
import React, { useEffect, useState } from "react";
import { BiMinus } from "react-icons/bi";
import { PiCopySimple } from "react-icons/pi";
import { VscChromeMaximize, VscClose } from "react-icons/vsc";

const WindowsControls = () => {
  const [message, setMessage] = useState("");

  const check = () => {
    window?.api.checkWindows();
  };
  useEffect(() => {
    window?.api.onFunctionFinished((msg) => {
      setMessage(msg);
    });
    const interval = setInterval(check, 100);

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex w-full h-full items-center non-draggable ">
      <button
        onClick={minimizeWindow}
        className="hover:bg-gray-300/20 px-3 py-2 flex items-center justify-center dark:text-white dark:hover:bg-gray-700"
        id="non-draggable"
      >
        <BiMinus size={16} />
      </button>

      {message === "maximized" ? (
        <button
          onClick={maximizeWindow}
          className="hover:bg-gray-300/20 px-3 py-2 flex items-center justify-center dark:text-white dark:hover:bg-gray-700"
        >
          <PiCopySimple size={14} />
        </button>
      ) : (
        <button
          onClick={maximizeWindow}
          className="hover:bg-gray-300/20 px-3 py-2 flex items-center justify-center dark:text-white dark:hover:bg-gray-700"
        >
          <VscChromeMaximize size={14} />
        </button>
      )}

      <button
        onClick={closeWindow}
        className="hover:bg-red-500 hover:text-white px-3 py-2 flex items-center justify-center dark:text-white"
      >
        <VscClose size={16} />
      </button>
    </div>
  );
};

export default WindowsControls;
