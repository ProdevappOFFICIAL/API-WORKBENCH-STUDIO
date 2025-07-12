import { Assets } from "@/constants/assets";
import WindowsControls from "./windows-controls";

const Header = () => {
  return (
    <div className="flex flex-row w-full items-center draggable text-[10px] bg-zinc-50 border-b border-gray-400/20">
      <img
        src={Assets.ICON}
        alt={Assets.ICON_ALT}
        width={Assets.ICON_WIDTH}
        height={Assets.ICON_HEIGHT}
      />
      <p className="font-medium">{Assets.APP_NAME}</p>
      <div className="flex ml-auto">
        <WindowsControls />
      </div>
    </div>
  );
};

export default Header;
