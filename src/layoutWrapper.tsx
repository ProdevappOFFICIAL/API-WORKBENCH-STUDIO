import React from "react";
import Sidebar from "./components/sidebar.componet/sidebar.components";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full w-full">
      <Sidebar />
      {children}
    </div>
  );
};

export default LayoutWrapper;
