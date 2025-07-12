import { BiDownload, BiHistory, BiHome, BiSend } from "react-icons/bi";
import { CiSettings } from "react-icons/ci";
import { AiOutlineCloudDownload } from "react-icons/ai";
import { MdSpeed, MdNetworkCheck, MdSettings, MdFolderOpen, MdSecurity, MdCloudQueue, MdAnalytics, MdDevices, MdStorage, MdSchedule, MdNotifications, MdHelp, MdAccountCircle, MdBackup } from "react-icons/md";
import { RiTestTubeLine } from "react-icons/ri";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";

const Sidebar = () => {
  const route = useLocation();

  return (
    <div className=" h-full  text-zinc-500 flex flex-col border-r border-zinc-400/20">
      <nav className="flex-1 p-2 space-y-2">
        {/* Dashboard/Home */}
        <Link
          to="/"
          className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <BiHome size={15} /> 
        </Link>
        
        {/* Send File */}
        <Link
          to="/send-file"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/send-file" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <BiSend size={15} /> 
        </Link>
        
        {/* Receive File */}
        <Link
          to="/receive-file"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/receive-file" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <AiOutlineCloudDownload size={15} /> 
        </Link>
        
        {/* File History */}
        <Link
          to="/file-history"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/file-history" && "bg-blue-400/20 text-blue-500" 
          }`}
        >
          <BiHistory size={15} /> 
        </Link>
        
        {/* Network Analysis */}
        <Link
          to="/network-analysis"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/network-analysis" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <MdNetworkCheck size={15} /> 
        </Link>
        
        {/* Benchmarking & Testing */}
        <Link
          to="/benchmarking"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/benchmarking" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <RiTestTubeLine size={15} /> 
        </Link>
        
        {/* Settings & Optimization */}
        <Link
          to="/settings"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/settings" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <MdSettings size={15} /> 
        </Link>

        {/* Security & Privacy */}
        <Link
          to="/security"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/security" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <MdSecurity size={15} /> 
        </Link>

        {/* Cloud Sync */}
        <Link
          to="/cloud-sync"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/cloud-sync" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <MdCloudQueue size={15} /> 
        </Link>

        {/* Analytics */}
        <Link
          to="/analytics"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/analytics" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <MdAnalytics size={15} /> 
        </Link>

        {/* Device Manager */}
        <Link
          to="/device-manager"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/device-manager" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <MdDevices size={15} /> 
        </Link>

        {/* Storage Manager */}
        <Link
          to="/storage-manager"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/storage-manager" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <MdStorage size={15} /> 
        </Link>

        {/* Scheduler */}
        <Link
          to="/scheduler"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/scheduler" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <MdSchedule size={15} /> 
        </Link>

        {/* Notifications */}
        <Link
          to="/notifications"
           className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
            route.pathname === "/notifications" && "bg-blue-400/20 text-blue-500"
          }`}
        >
          <MdNotifications size={15} /> 
        </Link>

      </nav>
    </div>
  );
};

export default Sidebar;