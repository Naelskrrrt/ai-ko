import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type { ColorTheme, ColorThemeId } from "./theme";
export { COLOR_THEMES } from "./theme";
