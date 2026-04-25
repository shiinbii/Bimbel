"use client";

import { useEffect } from "react";

import {
  IDLE_ACTIVITY_THROTTLE_MS,
  IDLE_CHECK_INTERVAL_MS,
  IDLE_COOKIE_NAME,
  IDLE_TIMEOUT_MS,
} from "@/lib/idle-config";
import { getSupabase } from "@/lib/supabase";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "click", "scroll", "touchstart"] as const;

function writeActivityCookie(ts: number) {
  if (typeof document === "undefined") return;
  const maxAge = Math.floor(IDLE_TIMEOUT_MS / 1000);
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${IDLE_COOKIE_NAME}=${ts}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function clearActivityCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${IDLE_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export default function IdleTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const supa = getSupabase();
    if (!supa) return;

    let active = false;
    let lastActivity = Date.now();
    let lastCookieWrite = 0;
    let checkTimer: ReturnType<typeof setInterval> | null = null;
    let loggingOut = false;

    const onActivity = () => {
      const now = Date.now();
      lastActivity = now;
      if (now - lastCookieWrite >= IDLE_ACTIVITY_THROTTLE_MS) {
        lastCookieWrite = now;
        writeActivityCookie(now);
      }
    };

    const forceLogout = async () => {
      if (loggingOut) return;
      loggingOut = true;
      try {
        clearActivityCookie();
        await supa.auth.signOut();
      } catch {
        // Swallow — we redirect regardless so the user never gets stuck.
      }
      window.location.replace("/login?reason=idle");
    };

    const checkIdle = () => {
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        void forceLogout();
      }
    };

    const start = () => {
      if (active) return;
      active = true;
      const now = Date.now();
      lastActivity = now;
      lastCookieWrite = now;
      writeActivityCookie(now);
      ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
      checkTimer = setInterval(checkIdle, IDLE_CHECK_INTERVAL_MS);
    };

    const stop = () => {
      if (!active) return;
      active = false;
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      if (checkTimer) {
        clearInterval(checkTimer);
        checkTimer = null;
      }
    };

    void (async () => {
      const { data } = await supa.auth.getSession();
      if (data.session) start();
    })();

    const { data: sub } = supa.auth.onAuthStateChange((_event, session) => {
      if (session) {
        start();
      } else {
        clearActivityCookie();
        stop();
      }
    });

    return () => {
      sub.subscription.unsubscribe();
      stop();
    };
  }, []);

  return null;
}
