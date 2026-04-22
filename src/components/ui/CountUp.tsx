"use client";

import { useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function CountUp({ to, duration = 1.6, prefix = "", suffix = "", decimals = 0 }: Props) {
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) =>
    v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
  const [text, setText] = useState("0");

  useEffect(() => {
    const controls = animate(value, to, { duration, ease: "easeOut" });
    const unsub = rounded.on("change", setText);
    return () => {
      controls.stop();
      unsub();
    };
  }, [to, duration, value, rounded]);

  return (
    <span>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
