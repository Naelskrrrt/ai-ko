import * as React from "react";
import { GraduationCap } from "lucide-react";

// Custom brand/logo component (kept)
export const Logo: React.FC<{
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}> = () => {
  return (
    <div className="flex items-center gap-2 bg-theme-primary p-2 rounded-md">
      <GraduationCap className="w-6 h-6 text-white" />
      <span className="text-md font-bold text-white">AI-KO</span>
    </div>
  );
};

// Lucide icons re-exports for drop-in usage - Only actually used icons
export {
  Menu as MenuIcon,
  LayoutDashboard as DashboardIcon,
  Users as TeamIcon,
  Calendar as CalendarIcon,
  Settings as SettingsIcon,
  User as ProfileIcon,
  Sun as SunFilledIcon,
  Moon as MoonFilledIcon,
  BookOpen as BookOpenIcon,
  FileText as FileTextIcon,
  ClipboardList as ClipboardListIcon,
} from "lucide-react";
