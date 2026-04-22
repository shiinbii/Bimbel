"use client";

import { motion } from "framer-motion";
import { Ban, Lock, Plus, Search, Unlock } from "lucide-react";
import { useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import UserDetailModal from "@/components/admin/UserDetailModal";
import AddUserModal from "@/components/admin/AddUserModal";
import { useUsersStore, type ManagedUser } from "@/lib/users-store";
import type { Role } from "@/lib/types";

interface Props {
  /** When true, Super Admin can toggle activate/deactivate & delete.
   *  When false (Admin), view-only detail modal.
   */
  canManage?: boolean;
}

export default function UsersSection({ canManage = false }: Props) {
  const { list, setDeactivated, remove } = useUsersStore();
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const users = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !u.deactivated) ||
        (statusFilter === "INACTIVE" && u.deactivated);
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q);
      return matchRole && matchStatus && matchSearch;
    });
  }, [list, roleFilter, statusFilter, search]);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Kelola User</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            {canManage
              ? "Super Admin: tambah, aktifkan/nonaktifkan, atau hapus user."
              : "Admin: tambah siswa/guru & lihat detail (nonaktif/hapus hanya untuk Super Admin)."}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Button
            onClick={() => setAddOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah User
          </Button>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 h-10">
            <Search className="w-3.5 h-3.5 text-[var(--color-text-soft)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / email / HP"
              className="w-56 h-full bg-transparent outline-none text-sm"
            />
          </div>
          <FilterPill
            options={[
              { v: "ALL", label: "Semua Role" },
              { v: "STUDENT", label: "Siswa" },
              { v: "TEACHER", label: "Guru" },
              { v: "ADMIN", label: "Admin" },
              { v: "SUPER_ADMIN", label: "Super" },
            ]}
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as "ALL" | Role)}
          />
          <FilterPill
            options={[
              { v: "ALL", label: "Semua Status" },
              { v: "ACTIVE", label: "Aktif" },
              { v: "INACTIVE", label: "Nonaktif" },
            ]}
            value={statusFilter}
            onChange={(v) =>
              setStatusFilter(v as "ALL" | "ACTIVE" | "INACTIVE")
            }
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-[var(--color-text-soft)] border-b border-[var(--color-border-soft)]">
              <tr>
                <th className="px-5 py-4">Nama</th>
                <th className="px-5 py-4">Kontak</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Poin</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`border-b border-[var(--color-border-soft)] hover:bg-[var(--color-bg-soft)] transition cursor-pointer ${
                    u.deactivated ? "opacity-70" : ""
                  }`}
                  onClick={() => setSelected(u)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} src={u.avatar} size={32} />
                      <div className="min-w-0">
                        <p className="text-[var(--color-text)] truncate">{u.name}</p>
                        <p className="text-[10px] text-[var(--color-text-mute)] font-mono truncate">
                          {u.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)]">
                    <p className="text-xs truncate max-w-[220px]">{u.email}</p>
                    <p className="text-[10px] text-[var(--color-text-mute)] truncate max-w-[220px]">
                      {u.phone ?? "—"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={
                        u.role === "SUPER_ADMIN"
                          ? "gold"
                          : u.role === "ADMIN"
                          ? "primary"
                          : u.role === "TEACHER"
                          ? "info"
                          : "neutral"
                      }
                    >
                      {u.role.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-amber-300">
                    {u.role === "STUDENT" ? `${u.points}` : "—"}
                  </td>
                  <td className="px-5 py-4">
                    {u.deactivated ? (
                      <Badge tone="danger" dot>
                        Nonaktif
                      </Badge>
                    ) : (
                      <Badge tone="success" dot>
                        Aktif
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div
                      className="inline-flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(u)}
                      >
                        Detail
                      </Button>
                      {canManage ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setDeactivated(
                              u.id,
                              !u.deactivated,
                              u.deactivated ? null : "ADMIN_ACTION"
                            )
                          }
                          leftIcon={
                            u.deactivated ? (
                              <Unlock className="w-3.5 h-3.5" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )
                          }
                          className={
                            u.deactivated
                              ? ""
                              : "border-red-500/30 text-red-300 hover:bg-red-500/10"
                          }
                        >
                          {u.deactivated ? "Aktifkan" : "Nonaktifkan"}
                        </Button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 h-9 px-2.5 rounded-lg border border-[var(--color-border)] text-[10px] uppercase tracking-widest text-[var(--color-text-mute)]"
                          title="Aksi khusus Super Admin"
                        >
                          <Lock className="w-3 h-3" /> Kunci
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-[var(--color-text-soft)]"
                    colSpan={6}
                  >
                    Tidak ada user yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <UserDetailModal
        user={selected}
        canManage={canManage}
        onClose={() => setSelected(null)}
        onToggleActive={(id, deactivated, reason) =>
          setDeactivated(id, deactivated, reason)
        }
        onDelete={(id) => {
          remove(id);
          setSelected(null);
        }}
      />

      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        allowAdminRole={canManage}
      />
    </section>
  );
}

function FilterPill<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-1 h-10">
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`text-xs px-3 h-8 rounded-lg transition whitespace-nowrap ${
              active
                ? "bg-indigo-500/30 text-[var(--color-text)]"
                : "text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
