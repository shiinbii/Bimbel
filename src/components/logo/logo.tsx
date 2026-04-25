import NiSparkle from "@/icons/nexture/ni-sparkle";
import { cn } from "@/lib/utils";

export default function Logo({ classNameFull, classNameMobile }: { classNameFull?: string; classNameMobile?: string }) {
  return (
    <>
      {/* Full wordmark — shown on md+ */}
      <span className={cn("flex items-center gap-2", classNameFull)}>
        <span className="text-primary bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
          <NiSparkle size={18} className="text-primary" />
        </span>
        <span className="font-heading text-text-primary text-xl leading-none tracking-tight">EduDoc</span>
      </span>

      {/* Icon-only — shown on mobile */}
      <span className={cn("flex items-center", classNameMobile)}>
        <span className="text-primary bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
          <NiSparkle size={18} className="text-primary" />
        </span>
      </span>
    </>
  );
}
