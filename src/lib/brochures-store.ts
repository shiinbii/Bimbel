"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export interface Brochure {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  order: number;
}

type DbRow = {
  id: string;
  image: string;
  title: string;
  subtitle: string | null;
  order: number;
};

const toB = (r: DbRow): Brochure => ({
  id: r.id,
  image: r.image,
  title: r.title,
  subtitle: r.subtitle ?? undefined,
  order: r.order,
});

const toDb = (b: Brochure) => ({
  id: b.id,
  image: b.image,
  title: b.title,
  subtitle: b.subtitle ?? null,
  order: b.order,
});

const DEFAULT_BROCHURES: Brochure[] = [
  {
    id: "br1",
    image:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'>
          <rect width='1200' height='600' fill='%236366f1'/>
          <text x='60' y='180' font-family='Georgia,serif' font-size='68' fill='white'>Naomi Ardelia</text>
          <text x='60' y='240' font-family='sans-serif' font-size='28' fill='rgba(255,255,255,0.85)'>Lolos Kedokteran UI 2025</text>
        </svg>`
      ),
    title: "Naomi Ardelia",
    subtitle: "Lolos Kedokteran UI 2025",
    order: 1,
  },
];

export function useBrochures() {
  const [list, setList] = useState<Brochure[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setList(DEFAULT_BROCHURES);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const { data, error } = await supa
        .from("brochures")
        .select("*")
        .order("order", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn("[brochures] select error:", error.message);
        setList(DEFAULT_BROCHURES);
        setLoaded(true);
        return;
      }
      const rows = ((data as DbRow[]) ?? []).map(toB);
      setList(rows.length > 0 ? rows : DEFAULT_BROCHURES);
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`br_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brochures" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const add = useCallback((b: Omit<Brochure, "id" | "order">) => {
    const supa = getSupabase();
    setList((prev) => {
      const full: Brochure = {
        ...b,
        id: `br_${Date.now()}`,
        order: prev.length + 1,
      };
      if (supa) {
        void supa
          .from("brochures")
          .insert(toDb(full))
          .then(({ error }) => {
            if (error) console.warn("[brochures] insert error:", error.message);
          });
      }
      return [...prev, full];
    });
  }, []);

  const update = useCallback((id: string, patch: Partial<Brochure>) => {
    const supa = getSupabase();
    setList((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (supa) {
      const dbPatch: Record<string, unknown> = {};
      if (patch.image !== undefined) dbPatch.image = patch.image;
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.subtitle !== undefined) dbPatch.subtitle = patch.subtitle ?? null;
      if (patch.order !== undefined) dbPatch.order = patch.order;
      if (Object.keys(dbPatch).length) {
        void supa
          .from("brochures")
          .update(dbPatch)
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.warn("[brochures] update error:", error.message);
          });
      }
    }
  }, []);

  const remove = useCallback((id: string) => {
    const supa = getSupabase();
    setList((prev) =>
      prev.filter((x) => x.id !== id).map((x, i) => ({ ...x, order: i + 1 }))
    );
    if (supa) {
      void supa
        .from("brochures")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("[brochures] delete error:", error.message);
        });
    }
  }, []);

  const move = useCallback((id: string, dir: -1 | 1) => {
    const supa = getSupabase();
    setList((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i < 0) return prev;
      const target = i + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[target]] = [next[target], next[i]];
      const reordered = next.map((x, idx) => ({ ...x, order: idx + 1 }));
      if (supa) {
        void (async () => {
          for (const b of reordered) {
            await supa.from("brochures").update({ order: b.order }).eq("id", b.id);
          }
        })();
      }
      return reordered;
    });
  }, []);

  const reset = useCallback(() => {
    setList(DEFAULT_BROCHURES);
  }, []);

  return { list, add, update, remove, move, reset, loaded };
}
