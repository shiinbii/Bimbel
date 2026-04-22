"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check, CheckCircle2, Clock, Coins, CreditCard, FileImage, Gift,
  Loader2, QrCode, Smartphone, Upload, Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  DEFAULT_CREDIT_PACKAGES,
  useCreditPackages,
  type CreditPackage,
} from "@/lib/credit-packages-store";
import {
  usePaymentSettings,
  type PaymentMethodId,
  type VirtualAccountBank,
  type BankTransferAccount,
} from "@/lib/payment-settings-store";
import { useWallet } from "@/lib/points-store";
import { formatIDR, sleep } from "@/lib/utils";

type Stage = "pick" | "confirm" | "pay" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
  /** preselect a specific package (from landing "Pilih Paket") */
  preselectId?: string;
}

const METHOD_ICON: Record<PaymentMethodId, React.ReactNode> = {
  VA: <Wallet className="w-4 h-4" />,
  GOPAY: <Smartphone className="w-4 h-4" />,
  QRIS: <QrCode className="w-4 h-4" />,
  CC: <CreditCard className="w-4 h-4" />,
  TRANSFER: <FileImage className="w-4 h-4" />,
};

export default function BuyCreditModal({ open, onClose, preselectId }: Props) {
  const { list: packages } = useCreditPackages();
  const { settings } = usePaymentSettings();
  const { grant } = useWallet();

  const activeMethods = Object.values(settings.methods).filter((m) => m.enabled);
  const [stage, setStage] = useState<Stage>("pick");
  const [pkgId, setPkgId] = useState<string>(
    preselectId ?? packages[0]?.id ?? ""
  );
  const [methodId, setMethodId] = useState<PaymentMethodId>(
    activeMethods[0]?.id ?? "VA"
  );
  const [selectedVA, setSelectedVA] = useState<string>("");
  const [selectedTransfer, setSelectedTransfer] = useState<string>("");
  const [ccNumber, setCcNumber] = useState("");
  const [ccCvv, setCcCvv] = useState("");
  const [ccExp, setCcExp] = useState("");
  const [proofFile, setProofFile] = useState<string | undefined>();
  const [processing, setProcessing] = useState(false);
  const [paidManually, setPaidManually] = useState(false);
  const proofRef = useRef<HTMLInputElement>(null);

  const pkg = useMemo(
    () =>
      packages.find((p) => p.id === pkgId) ??
      packages[0] ??
      DEFAULT_CREDIT_PACKAGES[0],
    [packages, pkgId]
  );

  const method = settings.methods[methodId];
  const totalPoints = pkg.points + (pkg.bonus ?? 0);
  const adminFee = 2500;
  const grandTotal = pkg.price + adminFee;

  // Reset to pick stage when modal opens
  useEffect(() => {
    if (open) {
      setStage("pick");
      setPaidManually(false);
      setProcessing(false);
      setProofFile(undefined);
      setCcNumber("");
      setCcCvv("");
      setCcExp("");
      if (preselectId) setPkgId(preselectId);
      if (!activeMethods.some((m) => m.id === methodId)) {
        setMethodId(activeMethods[0]?.id ?? "VA");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectId]);

  const enabledVAs = settings.virtualAccounts.filter((b) => b.enabled);
  const enabledTransfers = settings.transferAccounts.filter((b) => b.enabled);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus gambar (JPG/PNG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran maks 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProofFile(typeof reader.result === "string" ? reader.result : undefined);
      toast.success("Bukti transfer diunggah");
    };
    reader.readAsDataURL(file);
  };

  const beginPayment = async () => {
    // Validate per method
    if (methodId === "VA" && !selectedVA) {
      toast.error("Pilih bank VA");
      return;
    }
    if (methodId === "CC") {
      if (ccNumber.replace(/\s/g, "").length < 12) {
        toast.error("Nomor kartu tidak valid");
        return;
      }
      if (ccCvv.length < 3) {
        toast.error("CVV tidak valid");
        return;
      }
      if (ccExp.length < 4) {
        toast.error("Tanggal expired tidak valid");
        return;
      }
    }
    if (methodId === "TRANSFER") {
      if (!selectedTransfer) {
        toast.error("Pilih bank tujuan transfer");
        return;
      }
      // Transfer requires proof — but user uploads after seeing instructions
    }
    setStage("pay");
    setProcessing(true);
    setPaidManually(false);
    // Simulate polling for auto-confirm (5 seconds)
    await sleep(5000);
    setProcessing(false);
    // For CC, auto-success. Others wait for manual confirm.
    if (methodId === "CC") {
      finishSuccess();
    }
  };

  const confirmManually = async () => {
    setProcessing(true);
    if (methodId === "TRANSFER" && !proofFile) {
      toast.error("Upload bukti transfer dulu");
      setProcessing(false);
      return;
    }
    await sleep(1200);
    setProcessing(false);
    setPaidManually(true);
    if (methodId === "TRANSFER") {
      // Manual review flow — don't grant points yet
      setStage("done");
      toast(
        "Bukti terkirim. Admin akan mengonfirmasi dalam 1×24 jam.",
        { icon: "⏳", duration: 4000 }
      );
    } else {
      finishSuccess();
    }
  };

  const finishSuccess = () => {
    grant(totalPoints, undefined, "PURCHASE", `Beli ${pkg.points} poin`);
    setStage("done");
    toast.success(
      `${totalPoints} poin berhasil ditambahkan! Masa berlaku 1 tahun.`
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        stage === "pick"
          ? "Beli Credit"
          : stage === "confirm"
          ? "Konfirmasi Pembelian"
          : stage === "pay"
          ? `Pembayaran ${method?.label ?? ""}`
          : "Pembayaran Selesai"
      }
      description={
        stage === "pick"
          ? "Pilih jumlah credit yang ingin dibeli."
          : stage === "confirm"
          ? "Periksa kembali detail sebelum melanjutkan."
          : stage === "pay"
          ? "Ikuti instruksi pembayaran di bawah."
          : undefined
      }
      size="lg"
    >
      <AnimatePresence mode="wait">
        {/* ─────────── STAGE: PICK PACKAGE + METHOD ─────────── */}
        {stage === "pick" && (
          <motion.div
            key="pick"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div>
              <p className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider mb-2">
                Nominal Credit
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {packages.map((p) => {
                  const selected = p.id === pkgId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPkgId(p.id)}
                      className={`relative text-left p-3 rounded-xl border transition ${
                        selected
                          ? "border-indigo-500/60 bg-indigo-500/10 ring-2 ring-indigo-500/25"
                          : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/40"
                      }`}
                    >
                      {p.popular && (
                        <Badge
                          tone="gold"
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px]"
                        >
                          Populer
                        </Badge>
                      )}
                      <p className="flex items-center gap-1 text-amber-300 font-semibold">
                        <Coins className="w-3.5 h-3.5" /> {p.points}
                      </p>
                      {p.bonus && (
                        <p className="text-[10px] text-emerald-300 mt-0.5 flex items-center gap-1">
                          <Gift className="w-3 h-3" /> +{p.bonus} bonus
                        </p>
                      )}
                      <p className="mt-2 font-serif text-xl text-[var(--color-text)]">
                        {formatIDR(p.price)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider mb-2">
                Metode Pembayaran
              </p>
              {activeMethods.length === 0 ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
                  Semua metode pembayaran sedang dinonaktifkan. Hubungi admin.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {activeMethods.map((m) => {
                    const selected = m.id === methodId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethodId(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                          selected
                            ? "border-indigo-500/60 bg-indigo-500/10"
                            : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/30"
                        }`}
                      >
                        <span
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            selected
                              ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)]"
                              : "bg-[var(--color-bg-soft)] text-[var(--color-text-soft)]"
                          }`}
                        >
                          {METHOD_ICON[m.id]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-text)]">
                            {m.label}
                          </p>
                          <p className="text-xs text-[var(--color-text-soft)] truncate">
                            {m.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-soft)]">
              <div>
                <p className="text-xs text-[var(--color-text-soft)]">
                  Total bayar
                </p>
                <p className="font-serif text-2xl text-gradient-gold">
                  {formatIDR(grandTotal)}
                </p>
              </div>
              <Button
                onClick={() => setStage("confirm")}
                disabled={activeMethods.length === 0}
                size="lg"
              >
                Lanjutkan →
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─────────── STAGE: CONFIRM ─────────── */}
        {stage === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
              <p className="text-xs uppercase tracking-widest text-amber-300">
                Ringkasan Pembelian
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <span className="text-[var(--color-text-soft)]">Paket</span>
                <span className="text-right text-[var(--color-text)]">
                  {pkg.points} poin{pkg.bonus ? ` + ${pkg.bonus} bonus` : ""}
                </span>
                <span className="text-[var(--color-text-soft)]">Harga</span>
                <span className="text-right text-[var(--color-text)]">
                  {formatIDR(pkg.price)}
                </span>
                <span className="text-[var(--color-text-soft)]">Admin fee</span>
                <span className="text-right text-[var(--color-text)]">
                  {formatIDR(adminFee)}
                </span>
                <span className="text-[var(--color-text-soft)]">Metode</span>
                <span className="text-right text-[var(--color-text)]">{method?.label}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                <span className="text-[var(--color-text-soft)] text-sm">
                  Total
                </span>
                <span className="font-serif text-2xl text-gradient-gold">
                  {formatIDR(grandTotal)}
                </span>
              </div>
            </div>

            {/* Method-specific extra inputs */}
            {methodId === "VA" && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider mb-2">
                  Pilih Bank VA
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {enabledVAs.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedVA(b.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedVA === b.id
                          ? "border-indigo-500/60 bg-indigo-500/10"
                          : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--color-text)]">{b.name}</p>
                      <p className="text-[10px] text-[var(--color-text-soft)] font-mono">
                        Code: {b.code}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {methodId === "CC" && (
              <div className="space-y-2">
                <Input
                  label="Nomor Kartu"
                  placeholder="0000 0000 0000 0000"
                  value={ccNumber}
                  onChange={(e) => setCcNumber(e.target.value)}
                  icon={<CreditCard className="w-4 h-4" />}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Exp (MM/YY)"
                    placeholder="12/28"
                    value={ccExp}
                    onChange={(e) => setCcExp(e.target.value)}
                  />
                  <Input
                    label="CVV"
                    type="password"
                    placeholder="•••"
                    value={ccCvv}
                    onChange={(e) => setCcCvv(e.target.value)}
                  />
                </div>
              </div>
            )}

            {methodId === "TRANSFER" && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider mb-2">
                  Bank Tujuan Transfer
                </p>
                <div className="space-y-2">
                  {enabledTransfers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTransfer(t.id)}
                      className={`w-full p-3 rounded-xl border text-left transition ${
                        selectedTransfer === t.id
                          ? "border-indigo-500/60 bg-indigo-500/10"
                          : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        {t.bank}
                      </p>
                      <p className="text-xs text-[var(--color-text-soft)]">
                        {t.accountName}
                      </p>
                      <p className="text-sm font-mono text-[var(--color-text)] mt-0.5">
                        {t.accountNumber}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-border-soft)]">
              <Button variant="ghost" onClick={() => setStage("pick")}>
                ← Kembali
              </Button>
              <Button size="lg" onClick={beginPayment}>
                Bayar Sekarang
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─────────── STAGE: PAY (instructions + polling) ─────────── */}
        {stage === "pay" && (
          <motion.div
            key="pay"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Instructions per method */}
            {methodId === "VA" && (
              <VAInstructions
                bank={enabledVAs.find((b) => b.id === selectedVA)}
                amount={grandTotal}
              />
            )}
            {methodId === "GOPAY" && (
              <GoPayInstructions
                phone={settings.gopayPhone}
                amount={grandTotal}
              />
            )}
            {methodId === "QRIS" && (
              <QrisInstructions
                merchant={settings.qrisMerchant}
                amount={grandTotal}
              />
            )}
            {methodId === "CC" && (
              <CcInstructions amount={grandTotal} processing={processing} />
            )}
            {methodId === "TRANSFER" && (
              <TransferInstructions
                bank={enabledTransfers.find((b) => b.id === selectedTransfer)}
                amount={grandTotal}
                proofFile={proofFile}
                onSelectFile={() => proofRef.current?.click()}
                onRemoveFile={() => setProofFile(undefined)}
              />
            )}
            <input
              ref={proofRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                if (proofRef.current) proofRef.current.value = "";
              }}
            />

            {/* Polling state */}
            {processing && methodId !== "CC" && (
              <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-3 flex items-center gap-2 text-xs">
                <Loader2 className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
                <span className="text-[var(--color-text)]">
                  Menunggu konfirmasi pembayaran otomatis...
                </span>
                <span className="ml-auto text-[var(--color-text-soft)]">
                  Timeout 5 dtk
                </span>
              </div>
            )}
            {!processing && methodId !== "CC" && !paidManually && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
                <span className="text-[var(--color-text)]">
                  Sudah melakukan pembayaran? Klik{" "}
                  <strong>Konfirmasi Pembayaran</strong> di bawah.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-border-soft)]">
              <Button
                variant="ghost"
                onClick={() => setStage("confirm")}
                disabled={processing}
              >
                ← Kembali
              </Button>
              {methodId !== "CC" && (
                <Button
                  variant="gold"
                  onClick={confirmManually}
                  loading={processing}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  disabled={
                    methodId === "TRANSFER" && !proofFile
                  }
                >
                  Konfirmasi Pembayaran
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* ─────────── STAGE: DONE ─────────── */}
        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 items-center justify-center shadow-lg">
              <CheckCircle2 className="w-7 h-7 text-[var(--color-text)]" />
            </div>
            <div>
              <p className="font-serif text-2xl text-[var(--color-text)]">
                {methodId === "TRANSFER" && paidManually
                  ? "Bukti Terkirim"
                  : "Pembayaran Berhasil"}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-soft)] max-w-sm mx-auto">
                {methodId === "TRANSFER" && paidManually
                  ? "Admin akan mengonfirmasi bukti transfermu dalam 1×24 jam. Poin akan ditambahkan setelah konfirmasi."
                  : `${totalPoints} poin sudah ditambahkan ke saldo kamu. Masa berlaku 1 tahun dari hari ini.`}
              </p>
            </div>
            <Button full variant="gold" onClick={onClose}>
              Tutup
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

/* ─────────── Instruction cards ─────────── */

function VAInstructions({
  bank,
  amount,
}: {
  bank?: VirtualAccountBank;
  amount: number;
}) {
  if (!bank) return null;
  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-transparent p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-serif text-xl text-[var(--color-text)]">Virtual Account {bank.name}</p>
        <Badge tone="primary">{bank.code}</Badge>
      </div>
      <p className="text-xs text-[var(--color-text-soft)]">Nomor VA</p>
      <p className="mt-1 font-mono text-2xl text-[var(--color-text)] tracking-wider">
        {bank.accountNumber}
      </p>
      <div className="mt-3 pt-3 border-t border-indigo-500/20 flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-soft)]">Nominal</span>
        <span className="font-serif text-xl text-gradient-gold">
          {formatIDR(amount)}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-[var(--color-text-mute)]">
        Buka m-banking → Menu Transfer VA → masukkan nomor di atas. Nominal
        sudah otomatis (tidak perlu diketik manual).
      </p>
    </div>
  );
}

function GoPayInstructions({
  phone,
  amount,
}: {
  phone: string;
  amount: number;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 text-center">
      <p className="font-serif text-xl text-[var(--color-text)]">Scan QR GoPay</p>
      <div className="mt-3 mx-auto w-40 h-40 rounded-2xl bg-white p-3 grid grid-cols-10 gap-px">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="bg-black"
            style={{
              opacity: Math.random() > 0.5 ? 1 : 0,
            }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--color-text-soft)]">
        Penerima: {phone}
      </p>
      <p className="mt-1 font-serif text-xl text-gradient-gold">
        {formatIDR(amount)}
      </p>
    </div>
  );
}

function QrisInstructions({
  merchant,
  amount,
}: {
  merchant: string;
  amount: number;
}) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-transparent p-4 text-center">
      <p className="font-serif text-xl text-[var(--color-text)]">QRIS</p>
      <div className="mt-3 mx-auto w-40 h-40 rounded-2xl bg-white p-3 grid grid-cols-10 gap-px">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="bg-black"
            style={{ opacity: (i * 97) % 2 === 0 ? 1 : 0 }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--color-text-soft)]">{merchant}</p>
      <p className="mt-1 font-serif text-xl text-gradient-gold">
        {formatIDR(amount)}
      </p>
      <p className="mt-2 text-[11px] text-[var(--color-text-mute)]">
        Scan dengan aplikasi e-wallet / m-banking apa saja.
      </p>
    </div>
  );
}

function CcInstructions({
  amount,
  processing,
}: {
  amount: number;
  processing: boolean;
}) {
  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-transparent p-5 text-center">
      {processing ? (
        <>
          <Loader2 className="w-10 h-10 mx-auto text-indigo-300 animate-spin" />
          <p className="mt-3 text-[var(--color-text)] font-serif text-lg">
            Memproses Transaksi
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-soft)]">
            Jangan tutup jendela ini. Sedang berkomunikasi dengan bank...
          </p>
        </>
      ) : (
        <>
          <CreditCard className="w-10 h-10 mx-auto text-indigo-300" />
          <p className="mt-3 text-[var(--color-text)] font-serif text-lg">Kartu Terverifikasi</p>
        </>
      )}
      <p className="mt-3 font-serif text-xl text-gradient-gold">
        {formatIDR(amount)}
      </p>
    </div>
  );
}

function TransferInstructions({
  bank,
  amount,
  proofFile,
  onSelectFile,
  onRemoveFile,
}: {
  bank?: BankTransferAccount;
  amount: number;
  proofFile?: string;
  onSelectFile: () => void;
  onRemoveFile: () => void;
}) {
  if (!bank) return null;
  return (
    <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 to-transparent p-4">
      <p className="font-serif text-xl text-[var(--color-text)]">
        Transfer Bank {bank.bank}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <span className="text-[var(--color-text-soft)]">A/n</span>
        <span className="text-right text-[var(--color-text)]">{bank.accountName}</span>
        <span className="text-[var(--color-text-soft)]">No. Rekening</span>
        <span className="text-right font-mono text-[var(--color-text)]">
          {bank.accountNumber}
        </span>
        <span className="text-[var(--color-text-soft)]">Nominal</span>
        <span className="text-right font-mono text-amber-300">
          {formatIDR(amount)}
        </span>
      </div>

      <p className="mt-4 text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
        Upload Bukti Transfer
      </p>
      {proofFile ? (
        <div className="mt-2 relative rounded-xl overflow-hidden border border-sky-500/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofFile}
            alt="Bukti transfer"
            className="w-full max-h-48 object-contain bg-black/30"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={onSelectFile}
              className="px-2.5 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-[var(--color-text)] text-xs flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Ganti
            </button>
            <button
              type="button"
              onClick={onRemoveFile}
              className="w-8 h-8 rounded-lg bg-black/50 hover:bg-red-500/70 text-[var(--color-text)] flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelectFile}
          className="mt-2 w-full rounded-xl border-2 border-dashed border-sky-500/30 bg-[var(--color-bg-soft)] hover:border-sky-500/50 p-6 text-center cursor-pointer transition"
        >
          <Upload className="w-5 h-5 text-sky-300 mx-auto" />
          <p className="mt-2 text-sm text-[var(--color-text)]">
            Klik untuk upload bukti transfer
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--color-text-soft)]">
            JPG / PNG · maks 5 MB
          </p>
        </button>
      )}
      <p className="mt-3 text-[11px] text-[var(--color-text-mute)]">
        Setelah upload, admin akan memverifikasi dalam 1×24 jam.
      </p>
    </div>
  );
}
