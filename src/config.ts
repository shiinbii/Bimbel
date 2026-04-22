import { BackgroundShape, ContentType, MenuType } from "./types";

import { ModeVariant, ThemeVariant } from "@/constants";

export const DEFAULTS = {
  appRoot: "/",
  locale: "en",
  themeColor: "theme-orange" as ThemeVariant,
  themeMode: "system" as ModeVariant,
  contentType: ContentType.Boxed,
  backgroundShape: BackgroundShape.Waves,
  innerShadowOpacity: 0,
  foregroundOpacity: 40,
  bgOpacity: 100,
  leftMenuType: MenuType.SingleLayer,
  leftMenuWidth: {
    [MenuType.Minimal]: { primary: 40, secondary: 280 },
    [MenuType.Comfort]: { primary: 80, secondary: 280 },
    [MenuType.SingleLayer]: { primary: 280, secondary: 0 },
  },
  rightMenuType: MenuType.Minimal,
  rightMenuWidth: {
    [MenuType.Minimal]: { primary: 40, secondary: 280 },
    [MenuType.Comfort]: { primary: 80, secondary: 280 },
    [MenuType.SingleLayer]: { primary: 280, secondary: 0 },
  },
  transitionDuration: 150,
  rightMenuAlwaysHidden: false,
};
