"use client";

import { logAudit } from "./audit-store";
import { getSupabase } from "./supabase";
import { useEffect, useState } from "react";

export const DEFAULT_DEMO_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

export function getYoutubeEmbed(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/embed/${trimmed}?autoplay=1&rel=0`;
  }
  return null;
}

export function useDemoVideoUrl() {
  const [url, setUrlState] = useState<string>(DEFAULT_DEMO_VIDEO_URL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const { data } = await supa.from("demo_video").select("url").eq("id", "default").maybeSingle();
      if (cancelled) return;
      setUrlState((data?.url as string) || DEFAULT_DEMO_VIDEO_URL);
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`dv_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "demo_video" }, () => refresh())
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const setUrl = (v: string) => {
    setUrlState(v);
    const supa = getSupabase();
    if (supa)
      void supa.from("demo_video").upsert({
        id: "default",
        url: v,
        updated_at: new Date().toISOString(),
      });
    logAudit({ action: "DEMO_VIDEO_UPDATE", target: v });
  };

  const reset = () => {
    setUrl(DEFAULT_DEMO_VIDEO_URL);
  };

  return { url, setUrl, reset, loaded, embed: getYoutubeEmbed(url) };
}
