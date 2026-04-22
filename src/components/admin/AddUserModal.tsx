"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  BookOpen, Briefcase, Crown, GraduationCap, Lock, Mail, Phone, Save,
  Shield, UserRound, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import AvatarUpload from "@/components/ui/AvatarUpload";
import Badge from "@/components/ui/Badge";
import { useUsersStore, type ManagedUser } from "@/lib/users-store";
import { TIER_MAP, type Tier } from "@/lib/tiers";
import { sleep } from "@/lib/utils";
import type { Role } from "@/lib/types";

const userSchema = z
  .object({
    role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
    tier: z.enum(["STARTER", "BASIC", "POPULAR", "PREMIUM"]).optional(),
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Format email tidak valid"),
    phone: z
      .string()
      .min(8, "Nomor HP terlalu pendek")
      .regex(/^[0-9+\-\s]+$/, "Hanya angka, +, spasi, dan strip"),
    subject: z.string().optional(),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirm: z.string().min(6, "Konfirmasi minimal 6 karakter"),
    initialPoints: z.number().int().min(0).max(100000).optional(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Password tidak cocok",
    path: ["confirm"],
  })
  .refine(
    (d) => (d.role === "TEACHER" ? !!d.subject && d.subject.length >= 2 : true),
    { message: "Mata pelajaran wajib untuk guru", path: ["subject"] }
  )
  .refine((d) => (d.role === "STUDENT" ? !!d.tier : true), {
    message: "Pilih paket untuk siswa",
    path: ["tier"],
  });

type UserFormData = z.infer<typeof userSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Super admin can add ADMIN role; admin can only add STUDENT/TEACHER */
  allowAdminRole?: boolean;
}

export default function AddUserModal({ open, onClose, allowAdminRole }: Props) {
  const { upsert, list } = useUsersStore();
  const [avatar, setAvatar] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "STUDENT",
      tier: "STARTER",
      name: "",
      email: "",
      phone: "",
      subject: "",
      password: "",
      confirm: "",
      initialPoints: 0,
    },
  });

  const role = form.watch("role");
  const tier = form.watch("tier");

  const submit = form.handleSubmit(async (data) => {
    // Email unique check
    const emailExists = list.some(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (emailExists) {
      form.setError("email", {
        type: "manual",
        message: "Email sudah terdaftar",
      });
      return;
    }

    setSaving(true);
    await sleep(900);

    const prefix =
      data.role === "STUDENT" ? "u_stu_" : data.role === "TEACHER" ? "u_tea_" : "u_adm_";
    const newUser: ManagedUser = {
      id: `${prefix}${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role as Role,
      points: data.role === "STUDENT" ? data.initialPoints ?? 0 : 0,
      status: "ACTIVE",
      deactivated: false,
      deactivationReason: null,
      lastLoginAt: new Date().toISOString(),
      joinedAt: new Date().toISOString().slice(0, 10),
      avatar,
      subject: data.role === "TEACHER" ? data.subject : undefined,
      rating: data.role === "TEACHER" ? 4.8 : undefined,
      sessions: data.role === "TEACHER" ? 0 : undefined,
      completedTests: data.role === "STUDENT" ? 0 : undefined,
    };
    upsert(newUser);

    // For students, stash tier in localStorage (so their first login picks it up).
    // In real app, tier belongs to a subscription record.
    if (data.role === "STUDENT" && data.tier) {
      try {
        localStorage.setItem(
          `edudoc.user_tier:${data.email}`,
          data.tier
        );
      } catch {}
    }

    setSaving(false);
    toast.success(
      `${data.role === "STUDENT" ? "Siswa" : data.role === "TEACHER" ? "Guru" : "Admin"} ${data.name} berhasil ditambahkan`
    );
    form.reset();
    setAvatar(undefined);
    onClose();
  });

  const name = form.watch("name");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah User Baru"
      description="Buat akun untuk siswa, guru, atau admin. User langsung aktif."
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        {/* ROLE */}
        <div>
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            Peran User
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            <RoleOption
              role="STUDENT"
              icon={<GraduationCap className="w-4 h-4" />}
              label="Siswa"
              desc="Paket Starter/Basic/Popular/Premium"
              selected={role === "STUDENT"}
              onClick={() => form.setValue("role", "STUDENT")}
            />
            <RoleOption
              role="TEACHER"
              icon={<Briefcase className="w-4 h-4" />}
              label="Guru"
              desc="Mengajar & buat sesi zoom"
              selected={role === "TEACHER"}
              onClick={() => form.setValue("role", "TEACHER")}
            />
            <RoleOption
              role="ADMIN"
              icon={<Shield className="w-4 h-4" />}
              label="Admin"
              desc={
                allowAdminRole
                  ? "Kelola operasional"
                  : "Hanya Super Admin"
              }
              selected={role === "ADMIN"}
              onClick={() =>
                allowAdminRole
                  ? form.setValue("role", "ADMIN")
                  : toast.error(
                      "Tambah Admin baru hanya dapat dilakukan oleh Super Admin"
                    )
              }
              disabled={!allowAdminRole}
            />
          </div>
        </div>

        {/* TIER picker for STUDENT */}
        {role === "STUDENT" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
              Paket Siswa
            </label>
            <div className="mt-1.5 grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(TIER_MAP) as Tier[]).map((t) => {
                const cfg = TIER_MAP[t];
                const selected = tier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => form.setValue("tier", t)}
                    className={`text-left p-3 rounded-xl border transition ${
                      selected
                        ? "border-indigo-500/60 bg-indigo-500/10 ring-2 ring-indigo-500/25"
                        : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge tone={cfg.badgeTone} className="text-[9px]">
                        {cfg.label}
                      </Badge>
                      {t === "PREMIUM" && (
                        <Crown className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text)]">{cfg.description}</p>
                  </button>
                );
              })}
            </div>
            {form.formState.errors.tier && (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.tier.message}
              </p>
            )}
          </motion.div>
        )}

        {/* AVATAR */}
        <AvatarUpload
          value={avatar}
          onChange={setAvatar}
          name={name || "User"}
          label="Foto Profil (opsional)"
          description="Foto tampil di profil, navbar, testimoni. Maks 2MB."
        />

        {/* FIELDS */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Nama Lengkap"
            placeholder="Nama sesuai identitas"
            icon={<UserRound className="w-4 h-4" />}
            {...form.register("name")}
            error={form.formState.errors.name?.message}
          />
          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            icon={<Mail className="w-4 h-4" />}
            {...form.register("email")}
            error={form.formState.errors.email?.message}
          />
          <Input
            label="Nomor HP"
            placeholder="0812-3456-7890"
            icon={<Phone className="w-4 h-4" />}
            {...form.register("phone")}
            error={form.formState.errors.phone?.message}
          />
          {role === "TEACHER" && (
            <Input
              label="Mata Pelajaran"
              placeholder="Matematika / Fisika / dll"
              icon={<BookOpen className="w-4 h-4" />}
              {...form.register("subject")}
              error={form.formState.errors.subject?.message}
            />
          )}
          {role === "STUDENT" && (
            <Input
              label="Saldo Poin Awal (opsional)"
              type="number"
              placeholder="0"
              min={0}
              {...form.register("initialPoints", { valueAsNumber: true })}
              error={form.formState.errors.initialPoints?.message}
            />
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Password Awal"
            type="password"
            placeholder="Min. 6 karakter"
            icon={<Lock className="w-4 h-4" />}
            {...form.register("password")}
            error={form.formState.errors.password?.message}
          />
          <Input
            label="Konfirmasi Password"
            type="password"
            placeholder="Ulangi password"
            icon={<Lock className="w-4 h-4" />}
            {...form.register("confirm")}
            error={form.formState.errors.confirm?.message}
          />
        </div>

        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-3 text-xs text-[var(--color-text-soft)] flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 text-indigo-300 mt-0.5 shrink-0" />
          <span>
            User akan dibuat dengan status <strong className="text-[var(--color-text)]">Aktif</strong>.
            Password awal akan diminta diganti saat user pertama kali login.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-soft)]">
          <Button variant="ghost" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Tambahkan User
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RoleOption({
  role,
  icon,
  label,
  desc,
  selected,
  onClick,
  disabled,
}: {
  role: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-xl border text-left transition ${
        disabled
          ? "border-[var(--color-border)] bg-[var(--color-bg-soft)] opacity-50 cursor-not-allowed"
          : selected
          ? "border-indigo-500/60 bg-indigo-500/10 ring-2 ring-indigo-500/25"
          : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            selected
              ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)]"
              : "bg-[var(--color-bg-soft)] text-[var(--color-text-soft)]"
          }`}
        >
          {icon}
        </span>
        <span className="text-sm font-semibold text-[var(--color-text)]">{label}</span>
      </div>
      <p className="mt-1.5 text-[10px] text-[var(--color-text-soft)] leading-tight">
        {desc}
      </p>
    </button>
  );
}
