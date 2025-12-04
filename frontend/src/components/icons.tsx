import * as React from "react";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import { GraduationCap } from "lucide-react";

// Custom brand/logo component (kept)
export const Logo: React.FC<{
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}> = ({ size = 36, width, height, className: _className }) => {
  const _logoWidth = width || size;
  const _logoHeight = height || size;
  const { theme } = useTheme();
  const isSSR = useIsSSR();

  // Pendant l'hydratation, utiliser le thème par défaut pour éviter les erreurs d'hydratation
  const _logoSrc =
    isSSR || theme === "dark"
      ? "/logo-capt_dark-mode.png"
      : "/logo-capt_light-mode.png";

  return (
    <div className="flex items-center gap-2 bg-theme-primary p-2 rounded-md">
      {/* <Image
          unoptimized
          alt="Capt IA Logo"
          className={`object-contain ${className || ""}`}
          height={logoHeight}
          src={logoSrc}
          width={logoWidth}
        /> */}
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
