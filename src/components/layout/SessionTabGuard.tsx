"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { IDLE_COOKIE_NAME } from "@/lib/idle-config";

const TABS_KEY = "edudoc.session_tabs";
const TAB_ID_KEY = "edudoc.tab_id";
const HEARTBEAT_INTERVAL_MS = 30_000;
const STALE_THRESHOLD_MS = 120_000;

function getOrCreateTabId(): string {
  try {
    let id = sessionStorage.getItem(TAB_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(TAB_ID_KEY, id);
    }
    return id;
  } catch {
    return `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

function readTabs(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TABS_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? (obj as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeTabs(tabs: Record<string, number>) {
  try {
    localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  } catch {
    // ignore quota / private mode errors
  }
}

function pruneStale(tabs: Record<string, number>, now: number) {
  for (const [id, t] of Object.entries(tabs)) {
    if (now - t > STALE_THRESHOLD_MS) delete tabs[id];
  }
}

function hasFreshEntry(tabs: Record<string, number>, now: number): boolean {
  for (const t of Object.values(tabs)) {
    if (now - t <= STALE_THRESHOLD_MS) return true;
  }
  return false;
}

export default function SessionTabGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const supa = getSupabase();
    if (!supa) return;

    const tabId = getOrCreateTabId();
    let hasSession = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let stopped = false;
    let loggingOut = false;

    const forceColdLogout = async () => {
      if (loggingOut) return;
      loggingOut = true;
      try {
        localStorage.removeItem(TABS_KEY);
        document.cookie = `${IDLE_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
        await supa.auth.signOut();
      } catch {
        // ignore
      }
      window.location.replace("/login?reason=cold");
    };

    const heartbeat = () => {
      if (!hasSession) return;
      const now = Date.now();
      const tabs = readTabs();
      pruneStale(tabs, now);
      tabs[tabId] = now;
      writeTabs(tabs);
    };

    void (async () => {
      const { data } = await supa.auth.getSession();
      if (stopped) return;
      hasSession = !!data.session;

      if (hasSession) {
        const now = Date.now();
        const tabs = readTabs();
        pruneStale(tabs, now);
        if (!hasFreshEntry(tabs, now)) {
          await forceColdLogout();
          return;
        }
        heartbeat();
      }
      interval = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    })();

    const { data: sub } = supa.auth.onAuthStateChange((_event, session) => {
      hasSession = !!session;
      if (!session) {
        const tabs = readTabs();
        delete tabs[tabId];
        writeTabs(tabs);
      } else {
        heartbeat();
      }
    });

    return () => {
      stopped = true;
      if (interval) clearInterval(interval);
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
