import { Loader2 } from "lucide-react";

export default function LoadingSpinner({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Loader2
      className={`animate-spin text-[var(--color-primary)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
