"use client";

import { ReactNode } from "react";
import { useThemeContext } from "@/theme/theme-provider";

export type Theme = "light" | "dark";

export function useTheme() {
  const ctx = useThemeContext();
  const theme: Theme = ctx.isDarkMode ? "dark" : "light";
  return {
    theme,
    setTheme: (t: Theme) => ctx.setMode(t),
    toggle: () => ctx.setMode(ctx.isDarkMode ? "light" : "dark"),
    loaded: true,
  };
}

export function useAppTheme() {
  return useTheme();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
