import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  src?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}

export default function Avatar({ name, src, size = 40, className, ring }: Props) {
  const style = { width: size, height: size, fontSize: size / 2.6 };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={style}
        className={cn(
          "rounded-full object-cover",
          ring && "ring-2 ring-[var(--color-primary)]/40 ring-offset-2 ring-offset-[var(--color-bg)]",
          className
        )}
      />
    );
  }
  return (
    <div
      style={style}
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-[var(--color-text)]",
        "bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-500",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
        ring && "ring-2 ring-[var(--color-primary)]/40 ring-offset-2 ring-offset-[var(--color-bg)]",
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
