"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  CalendarClock, Check, Coins, Gift, Mail, Phone, Save, Search, Settings,
  User as UserIcon, Users, X,
} from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CountUp from "@/components/ui/CountUp";
import Input from "@/components/ui/Input";
import { mockStudents, mockTeachers } from "@/lib/mock-data";
import { useWallet, daysUntil } from "@/lib/points-store";
import { sleep } from "@/lib/utils";

interface SearchableUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  points?: number;
  role: "STUDENT" | "TEACHER";
}

const allUsers: SearchableUser[] = [
  ...mockStudents.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    points: s.points,
    role: "STUDENT" as const,
  })),
  ...mockTeachers.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    phone: "—",
    role: "TEACHER" as const,
  })),
];

export default function PointsManager() {
  const { balance, grants, history, settings, grant, updateSettings } = useWallet();

  const [selected, setSelected] = useState<SearchableUser | null>(null);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  const [amount, setAmount] = useState(100);
  const [validity, setValidity] = useState<number | "">(
    settings.defaultValidityDays
  );
  const [note, setNote] = useState("Bonus dari admin");
  const [granting, setGranting] = useState(false);

  const [settingsDays, setSettingsDays] = useState(settings.defaultValidityDays);
  const [warningDays, setWarningDays] = useState(settings.warningDays);
  const [savingSettings, setSavingSettings] = useState(false);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allUsers
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [search]);

  const doGrant = async () => {
    if (!selected) {
      toast.error("Pilih user terlebih dahulu");
      return;
    }
    if (amount <= 0) {
      toast.error("Jumlah poin harus > 0");
      return;
    }
    setGranting(true);
    await sleep(800);
    grant(
      amount,
      validity === "" ? undefined : validity,
      "ADMIN_GRANT",
      `${note || "Hadiah dari admin"} · untuk ${selected.name}`
    );
    setGranting(false);
    toast.success(
      `+${amount} poin diberikan ke ${selected.name} (expired ${validity || settings.defaultValidityDays} hari)`
    );
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    await sleep(600);
    updateSettings({
      defaultValidityDays: Math.max(1, settingsDays || 1),
      warningDays: Math.max(1, warningDays || 1),
    });
    setSavingSettings(false);
    toast.success("Pengaturan poin disimpan");
  };

  const activeGrants = grants.filter((g) => g.remaining > 0);

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-serif text-2xl text-[var(--color-text)]">Grant Poin Manual</h3>
            <p className="text-sm text-[var(--color-text-soft)] mt-1">
              Cari user berdasarkan nama, email, atau nomor HP, lalu berikan poin
              dengan masa berlaku custom.
            </p>
          </div>
          <div className="rounded-2xl px-4 py-2 border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-transparent">
            <p className="text-[10px] uppercase tracking-widest text-amber-300">
              Saldo Demo
            </p>
            <p className="font-serif text-2xl text-gradient-gold leading-none mt-0.5">
              <CountUp to={balance} />
            </p>
          </div>
        </div>

        {/* USER SEARCH */}
        <div className="relative">
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            1. Pilih User
          </label>

          {selected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-1.5 flex items-center gap-3 p-3 rounded-xl border border-indigo-500/50 bg-gradient-to-br from-indigo-500/15 to-transparent"
            >
              <Avatar name={selected.name} size={40} ring />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[var(--color-text)] truncate">
                    {selected.name}
                  </p>
                  <Badge tone={selected.role === "TEACHER" ? "gold" : "primary"}>
                    {selected.role}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-text-soft)] truncate">
                  {selected.email} · {selected.phone}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  setSearch("");
                }}
                className="w-8 h-8 rounded-lg bg-[var(--color-bg-soft)] hover:bg-red-500/15 text-[var(--color-text-soft)] hover:text-red-300 transition flex items-center justify-center"
                title="Ganti user"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <div className="mt-1.5 relative">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 h-12 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 transition">
                <Search className="w-4 h-4 text-[var(--color-text-soft)]" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Cari nama, email, atau nomor HP..."
                  className="flex-1 h-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-mute)]"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showResults && search && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur-xl shadow-2xl max-h-80 overflow-y-auto"
                >
                  {results.length === 0 ? (
                    <p className="p-4 text-center text-sm text-[var(--color-text-soft)]">
                      Tidak ada user yang cocok untuk &ldquo;{search}&rdquo;
                    </p>
                  ) : (
                    results.map((u) => (
                      <button
                        key={`${u.role}_${u.id}`}
                        onClick={() => {
                          setSelected(u);
                          setShowResults(false);
                          setSearch("");
                        }}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--color-bg-soft)] transition border-b border-[var(--color-border)] last:border-b-0"
                      >
                        <Avatar name={u.name} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-[var(--color-text)] truncate">
                              {u.name}
                            </p>
                            <Badge
                              tone={u.role === "TEACHER" ? "gold" : "primary"}
                              className="text-[9px]"
                            >
                              {u.role}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-[10px] text-[var(--color-text-soft)]">
                            <span className="flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" /> {u.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" /> {u.phone}
                            </span>
                          </div>
                        </div>
                        {typeof u.points === "number" && (
                          <span className="text-xs text-amber-300 font-semibold">
                            {u.points} pts
                          </span>
                        )}
                        <Check className="w-4 h-4 text-indigo-300 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* GRANT FORM */}
        <div
          className={`mt-5 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-transparent p-4 transition ${
            !selected ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="flex items-center gap-2 text-indigo-200 mb-3">
            <Gift className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">
              2. Detail Poin
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Input
              label="Jumlah Poin"
              type="number"
              icon={<Coins className="w-4 h-4" />}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            />
            <Input
              label="Masa Berlaku (hari)"
              type="number"
              icon={<CalendarClock className="w-4 h-4" />}
              value={validity}
              onChange={(e) =>
                setValidity(e.target.value === "" ? "" : Number(e.target.value))
              }
              hint={`Kosongkan untuk default (${settings.defaultValidityDays} hari)`}
            />
            <Input
              label="Catatan"
              placeholder="Misal: Reward juara quiz"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={doGrant}
              loading={granting}
              disabled={!selected}
              leftIcon={<Gift className="w-4 h-4" />}
            >
              Kirim ke {selected?.name ?? "User"}
            </Button>
          </div>
        </div>

        {/* ACTIVE GRANTS */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-soft)]">
              Batch Poin Aktif
            </p>
            <span className="text-xs text-[var(--color-text-soft)]">
              {activeGrants.length} batch
            </span>
          </div>
          <div className="space-y-2">
            {activeGrants.length === 0 && (
              <p className="text-sm text-[var(--color-text-soft)] py-2">
                Tidak ada batch aktif.
              </p>
            )}
            {activeGrants.map((g, i) => {
              const d = daysUntil(g.expiresAt);
              const near = d <= settings.warningDays;
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    near
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-[var(--color-border)] bg-[var(--color-bg-soft)]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-300 flex items-center justify-center border border-amber-500/20">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-[var(--color-text)] font-medium">
                        +{g.remaining}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-mute)]">
                        dari {g.points}
                      </span>
                      <Badge
                        tone={
                          g.source === "ADMIN_GRANT"
                            ? "gold"
                            : g.source === "PURCHASE"
                            ? "success"
                            : "neutral"
                        }
                        className="text-[9px]"
                      >
                        {g.source.replace("_", " ")}
                      </Badge>
                    </div>
                    {g.note && (
                      <p className="text-xs text-[var(--color-text-soft)] truncate">
                        {g.note}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xs font-medium ${
                        near ? "text-red-300" : "text-[var(--color-text-soft)]"
                      }`}
                    >
                      {d === 0 ? "Hari ini" : `${d} hari lagi`}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-mute)]">
                      {new Date(g.expiresAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <p className="font-serif text-lg text-[var(--color-text)]">Pengaturan Masa Berlaku</p>
              <p className="text-xs text-[var(--color-text-soft)]">
                Default <span className="text-[var(--color-text)]">60 hari (2 bulan)</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Default Masa Berlaku (hari)"
              type="number"
              icon={<CalendarClock className="w-4 h-4" />}
              value={settingsDays}
              onChange={(e) => setSettingsDays(Number(e.target.value) || 1)}
              hint="Untuk pembelian paket & grant tanpa tanggal custom"
            />
            <Input
              label="Peringatan Dini (hari)"
              type="number"
              value={warningDays}
              onChange={(e) => setWarningDays(Number(e.target.value) || 1)}
              hint="Tampilkan peringatan kuning saat poin akan expired"
            />
            <Button
              full
              onClick={saveSettings}
              loading={savingSettings}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Simpan Pengaturan
            </Button>

            <div className="grid grid-cols-3 gap-1.5 pt-2">
              {[30, 60, 90, 120, 180, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => setSettingsDays(d)}
                  className={`h-9 rounded-lg border text-xs transition ${
                    settingsDays === d
                      ? "border-indigo-500/60 bg-indigo-500/15 text-[var(--color-text)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {d} hari
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="font-serif text-lg text-[var(--color-text)]">Aktivitas Terbaru</p>
              <p className="text-xs text-[var(--color-text-soft)]">
                10 transaksi terakhir
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            {history.slice(0, 10).map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-2 text-xs p-2 rounded-lg bg-[var(--color-bg-soft)] border border-[var(--color-border)]"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    h.kind === "SPEND"
                      ? "bg-red-400"
                      : h.kind === "EXPIRE"
                      ? "bg-orange-400"
                      : "bg-emerald-400"
                  }`}
                />
                <span className="flex-1 text-[var(--color-text)] truncate">{h.note}</span>
                <span
                  className={`font-semibold ${
                    h.kind === "GRANT" ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {h.kind === "GRANT" ? "+" : "-"}
                  {h.points}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-xs text-[var(--color-text-soft)] py-2">
                Belum ada aktivitas.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
