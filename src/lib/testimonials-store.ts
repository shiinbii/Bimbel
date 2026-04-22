"use client";

import { useCallback, useEffect, useState } from "react";
import type { Testimonial } from "./types";
import { mockTestimonials } from "./mock-data";
import { getSupabase } from "./supabase";

type DbRow = {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  message: string;
  rating: number;
  order: number;
};

const toT = (r: DbRow): Testimonial => ({
  id: r.id,
  name: r.name,
  role: r.role,
  avatar: r.avatar ?? undefined,
  message: r.message,
  rating: r.rating,
});

const toDb = (t: Testimonial, order = 0) => ({
  id: t.id,
  name: t.name,
  role: t.role,
  avatar: t.avatar ?? null,
  message: t.message,
  rating: t.rating,
  order,
});

export function useTestimonials() {
  const [list, setList] = useState<Testimonial[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setList(mockTestimonials);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const { data } = await supa
        .from("testimonials")
        .select("*")
        .order("order", { ascending: true });
      if (cancelled) return;
      setList(((data as DbRow[]) ?? []).map(toT));
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`tst_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "testimonials" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const add = useCallback((t: Omit<Testimonial, "id">) => {
    const full: Testimonial = { ...t, id: `ts_${Date.now()}` };
    setList((prev) => [full, ...prev]);
    const supa = getSupabase();
    if (supa) void supa.from("testimonials").insert(toDb(full, 0));
  }, []);

  const remove = useCallback((id: string) => {
    setList((prev) => prev.filter((t) => t.id !== id));
    const supa = getSupabase();
    if (supa) void supa.from("testimonials").delete().eq("id", id);
  }, []);

  const reset = useCallback(() => {
    setList(mockTestimonials);
  }, []);

  return { list, add, remove, reset, loaded };
}
