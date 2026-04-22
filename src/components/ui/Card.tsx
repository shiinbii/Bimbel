import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
  glow?: boolean;
}

export default function Card({ children, hoverable, glow, className, ...rest }: Props) {
  return (
    <div
      className={cn(
        "card",
        hoverable && "card-hover cursor-pointer",
        glow && "glow-primary",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
