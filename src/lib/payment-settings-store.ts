"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

const KEY = "edudoc.payment_settings";
const SETTINGS_ID = "default";

export type PaymentMethodId = "VA" | "GOPAY" | "QRIS" | "CC" | "TRANSFER";

export interface PaymentMethodConfig {
  id: PaymentMethodId;
  label: string;
  enabled: boolean;
  description: string;
}

export interface VirtualAccountBank {
  id: string;
  name: string;
  code: string;
  accountNumber: string;
  enabled: boolean;
}

export interface BankTransferAccount {
  id: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  enabled: boolean;
}

export interface PaymentSettings {
  methods: Record<PaymentMethodId, PaymentMethodConfig>;
  virtualAccounts: VirtualAccountBank[];
  qrisMerchant: string;
  gopayPhone: string;
  transferAccounts: BankTransferAccount[];
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  methods: {
    VA: {
      id: "VA",
      label: "Virtual Account",
      enabled: true,
      description: "BCA / Mandiri / BNI / BRI · konfirmasi otomatis",
    },
    GOPAY: {
      id: "GOPAY",
      label: "GoPay",
      enabled: true,
      description: "Scan QR GoPay · konfirmasi otomatis",
    },
    QRIS: {
      id: "QRIS",
      label: "QRIS",
      enabled: true,
      description: "Semua e-wallet & m-banking",
    },
    CC: {
      id: "CC",
      label: "Kartu Kredit",
      enabled: true,
      description: "Visa / Mastercard / JCB",
    },
    TRANSFER: {
      id: "TRANSFER",
      label: "Transfer Bank",
      enabled: true,
      description: "Upload bukti · konfirmasi manual admin",
    },
  },
  virtualAccounts: [
    { id: "va_bca", name: "BCA", code: "014", accountNumber: "7730-8876-xxxxxx", enabled: true },
    { id: "va_mandiri", name: "Mandiri", code: "008", accountNumber: "8838-0123-xxxxxx", enabled: true },
    { id: "va_bni", name: "BNI", code: "009", accountNumber: "9882-0044-xxxxxx", enabled: true },
    { id: "va_bri", name: "BRI", code: "002", accountNumber: "2631-7788-xxxxxx", enabled: true },
    { id: "va_permata", name: "Permata", code: "013", accountNumber: "8712-9988-xxxxxx", enabled: false },
  ],
  qrisMerchant: "EDUDOC MERCHANT",
  gopayPhone: "0812-3456-7890",
  transferAccounts: [
    {
      id: "tr_bca",
      bank: "BCA",
      accountNumber: "720-123-4567",
      accountName: "PT EDUDOC NUSANTARA",
      enabled: true,
    },
    {
      id: "tr_mandiri",
      bank: "Mandiri",
      accountNumber: "166-00-1234567-8",
      accountName: "PT EDUDOC NUSANTARA",
      enabled: true,
    },
  ],
};

type DbRow = {
  id: string;
  methods: Record<string, PaymentMethodConfig>;
  virtual_accounts: VirtualAccountBank[];
  qris_merchant: string;
  gopay_phone: string;
  transfer_accounts: BankTransferAccount[];
};

const fromDb = (r: DbRow): PaymentSettings => ({
  methods: { ...DEFAULT_PAYMENT_SETTINGS.methods, ...(r.methods as PaymentSettings["methods"]) },
  virtualAccounts: Array.isArray(r.virtual_accounts) ? r.virtual_accounts : [],
  qrisMerchant: r.qris_merchant ?? DEFAULT_PAYMENT_SETTINGS.qrisMerchant,
  gopayPhone: r.gopay_phone ?? DEFAULT_PAYMENT_SETTINGS.gopayPhone,
  transferAccounts: Array.isArray(r.transfer_accounts) ? r.transfer_accounts : [],
});

const toDb = (s: PaymentSettings) => ({
  id: SETTINGS_ID,
  methods: s.methods,
  virtual_accounts: s.virtualAccounts,
  qris_merchant: s.qrisMerchant,
  gopay_phone: s.gopayPhone,
  transfer_accounts: s.transferAccounts,
});

function readLS(): PaymentSettings {
  if (typeof window === "undefined") return DEFAULT_PAYMENT_SETTINGS;
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_PAYMENT_SETTINGS;
  try {
    return { ...DEFAULT_PAYMENT_SETTINGS, ...(JSON.parse(raw) as PaymentSettings) };
  } catch {}
  return DEFAULT_PAYMENT_SETTINGS;
}
function writeLS(s: PaymentSettings) {
  if (typeof window === "undefined") return;
  const v = JSON.stringify(s);
  localStorage.setItem(KEY, v);
  queueMicrotask(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: v }));
  });
}

export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setSettings(readLS());
      setLoaded(true);
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) setSettings(readLS());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    let cancelled = false;
    const refresh = async () => {
      const { data } = await supa
        .from("payment_settings")
        .select("*")
        .eq("id", SETTINGS_ID)
        .maybeSingle();
      if (cancelled) return;
      setSettings(data ? fromDb(data as DbRow) : DEFAULT_PAYMENT_SETTINGS);
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`ps_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_settings" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const persist = (next: PaymentSettings) => {
    const supa = getSupabase();
    setSettings(next);
    if (supa) void supa.from("payment_settings").upsert(toDb(next));
    else writeLS(next);
  };

  const setMethod = useCallback(
    (id: PaymentMethodId, patch: Partial<PaymentMethodConfig>) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          methods: { ...prev.methods, [id]: { ...prev.methods[id], ...patch } },
        };
        persist(next);
        return next;
      });
    },
    []
  );

  const update = useCallback((patch: Partial<PaymentSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    persist(DEFAULT_PAYMENT_SETTINGS);
  }, []);

  return { settings, setMethod, update, reset, loaded };
}
