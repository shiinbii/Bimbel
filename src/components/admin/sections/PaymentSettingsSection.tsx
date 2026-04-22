"use client";

import { motion } from "framer-motion";
import {
  CreditCard, FileImage, Plus, QrCode, Smartphone, Trash2, Wallet,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  usePaymentSettings,
  type BankTransferAccount,
  type PaymentMethodId,
  type VirtualAccountBank,
} from "@/lib/payment-settings-store";

const METHOD_ICON: Record<PaymentMethodId, React.ReactNode> = {
  VA: <Wallet className="w-4 h-4" />,
  GOPAY: <Smartphone className="w-4 h-4" />,
  QRIS: <QrCode className="w-4 h-4" />,
  CC: <CreditCard className="w-4 h-4" />,
  TRANSFER: <FileImage className="w-4 h-4" />,
};

export default function PaymentSettingsSection() {
  const { settings, setMethod, update } = usePaymentSettings();

  return (
    <section className="space-y-8">
      {/* ─── Methods Toggle ─── */}
      <div>
        <div className="mb-4">
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Metode Pembayaran</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Aktifkan atau nonaktifkan metode pembayaran yang tersedia untuk
            siswa.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.values(settings.methods).map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`card p-4 flex items-center gap-3 transition ${
                m.enabled ? "" : "opacity-60"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  m.enabled
                    ? "bg-gradient-to-br from-indigo-500/30 to-indigo-700/10 border border-indigo-500/30 text-indigo-200"
                    : "bg-[var(--color-bg-soft)] border border-[var(--color-border)] text-[var(--color-text-mute)]"
                }`}
              >
                {METHOD_ICON[m.id]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--color-text)] font-semibold">{m.label}</p>
                <p className="text-xs text-[var(--color-text-soft)] truncate">
                  {m.description}
                </p>
              </div>
              <label className="relative inline-block">
                <input
                  type="checkbox"
                  checked={m.enabled}
                  onChange={(e) =>
                    setMethod(m.id, { enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <span className="block w-11 h-6 rounded-full bg-[var(--color-bg-soft)] peer-checked:bg-indigo-500 transition" />
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white peer-checked:translate-x-5 transition-transform" />
              </label>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── VA Banks ─── */}
      <VirtualAccountList
        banks={settings.virtualAccounts}
        onChange={(list) => update({ virtualAccounts: list })}
      />

      {/* ─── QRIS + GoPay ─── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-4 h-4 text-indigo-300" />
            <h3 className="font-semibold text-[var(--color-text)]">QRIS Merchant</h3>
          </div>
          <Input
            label="Nama merchant di QR"
            value={settings.qrisMerchant}
            onChange={(e) => update({ qrisMerchant: e.target.value })}
          />
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-indigo-300" />
            <h3 className="font-semibold text-[var(--color-text)]">GoPay</h3>
          </div>
          <Input
            label="Nomor GoPay penerima"
            placeholder="0812-3456-7890"
            value={settings.gopayPhone}
            onChange={(e) => update({ gopayPhone: e.target.value })}
          />
        </div>
      </div>

      {/* ─── Transfer Bank ─── */}
      <TransferAccountList
        accounts={settings.transferAccounts}
        onChange={(list) => update({ transferAccounts: list })}
      />
    </section>
  );
}

/* ─────────────────────── VA Banks ─────────────────────── */

function VirtualAccountList({
  banks,
  onChange,
}: {
  banks: VirtualAccountBank[];
  onChange: (list: VirtualAccountBank[]) => void;
}) {
  const addBank = () => {
    const fresh: VirtualAccountBank = {
      id: `va_${Date.now()}`,
      name: "Bank Baru",
      code: "",
      accountNumber: "",
      enabled: true,
    };
    onChange([...banks, fresh]);
    toast.success("Bank VA ditambahkan — silakan edit");
  };

  const patch = (id: string, data: Partial<VirtualAccountBank>) => {
    onChange(banks.map((b) => (b.id === id ? { ...b, ...data } : b)));
  };

  const remove = (id: string) => {
    onChange(banks.filter((b) => b.id !== id));
    toast.success("Bank VA dihapus");
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--color-text)]">Virtual Account Banks</h3>
          <p className="text-xs text-[var(--color-text-soft)]">
            Daftar bank + nomor VA yang ditampilkan saat siswa pilih VA.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addBank}>
          Tambah Bank
        </Button>
      </div>
      <div className="space-y-2">
        {banks.map((b) => (
          <div
            key={b.id}
            className={`card p-3 flex flex-wrap items-center gap-2 ${
              b.enabled ? "" : "opacity-60"
            }`}
          >
            <div className="w-24">
              <Input
                placeholder="Nama"
                value={b.name}
                onChange={(e) => patch(b.id, { name: e.target.value })}
              />
            </div>
            <div className="w-20">
              <Input
                placeholder="Kode"
                value={b.code}
                onChange={(e) => patch(b.id, { code: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <Input
                placeholder="No VA (contoh: 7730-xxxx)"
                value={b.accountNumber}
                onChange={(e) => patch(b.id, { accountNumber: e.target.value })}
              />
            </div>
            <label className="relative inline-block">
              <input
                type="checkbox"
                checked={b.enabled}
                onChange={(e) => patch(b.id, { enabled: e.target.checked })}
                className="sr-only peer"
              />
              <span className="block w-10 h-5.5 rounded-full bg-[var(--color-bg-soft)] peer-checked:bg-indigo-500 transition" />
              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white peer-checked:translate-x-5 transition-transform" />
            </label>
            <button
              onClick={() => remove(b.id)}
              className="w-9 h-9 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {banks.length === 0 && (
          <p className="text-xs text-[var(--color-text-mute)] text-center py-6">
            Belum ada bank. Klik &ldquo;Tambah Bank&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Transfer Bank accounts ─────────────────────── */

function TransferAccountList({
  accounts,
  onChange,
}: {
  accounts: BankTransferAccount[];
  onChange: (list: BankTransferAccount[]) => void;
}) {
  const addAccount = () => {
    const fresh: BankTransferAccount = {
      id: `tr_${Date.now()}`,
      bank: "BCA",
      accountNumber: "",
      accountName: "PT EduDoc",
      enabled: true,
    };
    onChange([...accounts, fresh]);
    toast.success("Rekening transfer ditambahkan");
  };

  const patch = (id: string, data: Partial<BankTransferAccount>) => {
    onChange(accounts.map((a) => (a.id === id ? { ...a, ...data } : a)));
  };

  const remove = (id: string) => {
    onChange(accounts.filter((a) => a.id !== id));
    toast.success("Rekening dihapus");
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--color-text)]">Rekening Transfer Bank</h3>
          <p className="text-xs text-[var(--color-text-soft)]">
            Rekening yang ditampilkan saat siswa pilih Transfer Bank manual.
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={addAccount}
        >
          Tambah Rekening
        </Button>
      </div>
      <div className="space-y-2">
        {accounts.map((a) => (
          <div
            key={a.id}
            className={`card p-3 flex flex-wrap items-center gap-2 ${
              a.enabled ? "" : "opacity-60"
            }`}
          >
            <div className="w-24">
              <Input
                placeholder="Bank"
                value={a.bank}
                onChange={(e) => patch(a.id, { bank: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <Input
                placeholder="No rekening"
                value={a.accountNumber}
                onChange={(e) => patch(a.id, { accountNumber: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <Input
                placeholder="Nama pemilik"
                value={a.accountName}
                onChange={(e) => patch(a.id, { accountName: e.target.value })}
              />
            </div>
            <label className="relative inline-block">
              <input
                type="checkbox"
                checked={a.enabled}
                onChange={(e) => patch(a.id, { enabled: e.target.checked })}
                className="sr-only peer"
              />
              <span className="block w-10 h-5.5 rounded-full bg-[var(--color-bg-soft)] peer-checked:bg-indigo-500 transition" />
              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white peer-checked:translate-x-5 transition-transform" />
            </label>
            <button
              onClick={() => remove(a.id)}
              className="w-9 h-9 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-xs text-[var(--color-text-mute)] text-center py-6">
            Belum ada rekening. Klik &ldquo;Tambah Rekening&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
