import { BiDownload, BiHistory, BiHome, BiSend } from "react-icons/bi";
import { CiSettings } from "react-icons/ci";
import { AiOutlineCloudDownload } from "react-icons/ai";
import {
  MdSpeed,
  MdNetworkCheck,
  MdSettings,
  MdFolderOpen,
  MdSecurity,
  MdCloudQueue,
  MdAnalytics,
  MdDevices,
  MdStorage,
  MdSchedule,
  MdNotifications,
  MdHelp,
  MdAccountCircle,
  MdBackup,
  MdApi,
} from "react-icons/md";
import { RiTestTubeLine } from "react-icons/ri";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { sidebarRoutes } from "@/constants/routes";

const Sidebar = () => {
  const route = useLocation();

  return (
    <div className=" h-full  text-zinc-500 flex flex-col border-r border-zinc-400/20">
      <nav className="flex-1 p-2 space-y-2">
        {/* Dashboard/Home */}
      
        {sidebarRoutes.map((route_name) => (
          <Link
            to={route_name.path}
            className={`flex items-center gap-3 p-2 rounded hover:bg-zinc-400/20  ${
              route.pathname === route_name.path &&
              "bg-blue-400/20 text-blue-500"
            }`}
          >
            <route_name.icon size={15} />
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
