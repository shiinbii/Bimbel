"use client";

import { motion } from "framer-motion";
import {
  Ban, CalendarDays, CheckCircle2, Coins, GraduationCap, Mail, Phone,
  ShieldCheck, Star, Trash2, Unlock,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  DEACTIVATION_MESSAGES,
  type DeactivationReason,
  type ManagedUser,
} from "@/lib/users-store";
import { sleep } from "@/lib/utils";

interface Props {
  user: ManagedUser | null;
  onClose: () => void;
  /** If true, action buttons (toggle active / delete) are shown. */
  canManage?: boolean;
  onToggleActive?: (
    id: string,
    deactivated: boolean,
    reason?: DeactivationReason
  ) => void;
  onDelete?: (id: string) => void;
}

export default function UserDetailModal({
  user,
  onClose,
  canManage,
  onToggleActive,
  onDelete,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <Modal open={false} onClose={onClose}>
        <div />
      </Modal>
    );
  }

  const reasonInfo =
    user.deactivated && user.deactivationReason
      ? DEACTIVATION_MESSAGES[user.deactivationReason]
      : null;

  const toggle = async () => {
    if (!onToggleActive) return;
    setBusy(true);
    await sleep(500);
    onToggleActive(
      user.id,
      !user.deactivated,
      user.deactivated ? null : "ADMIN_ACTION"
    );
    setBusy(false);
    toast.success(
      user.deactivated ? "Akun diaktifkan kembali" : "Akun dinonaktifkan"
    );
  };

  const doDelete = async () => {
    if (!onDelete) return;
    setBusy(true);
    await sleep(500);
    onDelete(user.id);
    setBusy(false);
    setConfirmDelete(false);
    onClose();
    toast.success("User dihapus permanen");
  };

  return (
    <>
      <Modal
        open={!!user}
        onClose={onClose}
        title={user.name}
        description={user.email}
        size="md"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-[var(--color-border-soft)]">
            <Avatar name={user.name} src={user.avatar} size={72} ring />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  tone={
                    user.role === "SUPER_ADMIN"
                      ? "gold"
                      : user.role === "ADMIN"
                      ? "primary"
                      : user.role === "TEACHER"
                      ? "info"
                      : "neutral"
                  }
                >
                  {user.role.replace("_", " ")}
                </Badge>
                {user.deactivated ? (
                  <Badge tone="danger" dot>
                    Nonaktif
                  </Badge>
                ) : (
                  <Badge tone="success" dot>
                    Aktif
                  </Badge>
                )}
              </div>
              <p className="font-mono text-[10px] text-[var(--color-text-mute)] mt-1">
                ID: {user.id}
              </p>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-2">
            <InfoRow
              icon={<Mail className="w-3.5 h-3.5" />}
              label="Email"
              value={user.email}
            />
            <InfoRow
              icon={<Phone className="w-3.5 h-3.5" />}
              label="No. HP"
              value={user.phone || "—"}
            />
            <InfoRow
              icon={<CalendarDays className="w-3.5 h-3.5" />}
              label="Bergabung"
              value={user.joinedAt}
            />
            <InfoRow
              icon={<CalendarDays className="w-3.5 h-3.5" />}
              label="Login terakhir"
              value={new Date(user.lastLoginAt).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            />
            {user.role === "STUDENT" && (
              <>
                <InfoRow
                  icon={<Coins className="w-3.5 h-3.5" />}
                  label="Saldo poin"
                  value={`${user.points} pts`}
                />
                <InfoRow
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  label="Quiz selesai"
                  value={String(user.completedTests ?? 0)}
                />
              </>
            )}
            {user.role === "TEACHER" && (
              <>
                <InfoRow
                  icon={<GraduationCap className="w-3.5 h-3.5" />}
                  label="Mata pelajaran"
                  value={user.subject ?? "—"}
                />
                <InfoRow
                  icon={<Star className="w-3.5 h-3.5" />}
                  label="Rating"
                  value={user.rating ? `⭐ ${user.rating}` : "—"}
                />
                <InfoRow
                  icon={<CalendarDays className="w-3.5 h-3.5" />}
                  label="Total sesi"
                  value={String(user.sessions ?? 0)}
                />
              </>
            )}
          </div>

          {/* Deactivation banner */}
          {user.deactivated && reasonInfo && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-500/30 bg-red-500/5 p-3"
            >
              <p className="text-xs uppercase tracking-widest text-red-300">
                Alasan Nonaktif
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                {reasonInfo.title}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                {reasonInfo.body}
              </p>
              {user.deactivatedAt && (
                <p className="mt-2 text-[10px] text-[var(--color-text-mute)]">
                  Dinonaktifkan pada{" "}
                  {new Date(user.deactivatedAt).toLocaleString("id-ID")}
                </p>
              )}
            </motion.div>
          )}

          {/* Actions */}
          {canManage ? (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border-soft)]">
              <Button
                variant={user.deactivated ? "primary" : "outline"}
                onClick={toggle}
                loading={busy}
                leftIcon={
                  user.deactivated ? (
                    <Unlock className="w-4 h-4" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )
                }
              >
                {user.deactivated ? "Aktifkan Kembali" : "Nonaktifkan Akun"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(true)}
                className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Hapus Permanen
              </Button>
              <Button variant="ghost" className="ml-auto" onClick={onClose}>
                Tutup
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-soft)]">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-soft)]">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Admin dapat melihat detail saja — aksi akun dikunci untuk Super
                Admin.
              </div>
              <Button variant="ghost" onClick={onClose}>
                Tutup
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Hapus User Permanen?"
        description={`Semua data ${user.name} akan dihapus. Aksi tidak dapat dibatalkan.`}
        size="sm"
        align="center"
        icon={<Trash2 className="w-6 h-6" />}
      >
        <div className="flex items-center gap-2 pt-2">
          <Button full variant="ghost" onClick={() => setConfirmDelete(false)}>
            Batal
          </Button>
          <Button
            full
            variant="danger"
            onClick={doDelete}
            loading={busy}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Ya, Hapus
          </Button>
        </div>
      </Modal>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-bg-soft)]">
      <span className="w-7 h-7 rounded-md bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
          {label}
        </p>
        <p className="text-sm text-[var(--color-text)] truncate">{value}</p>
      </div>
    </div>
  );
}
