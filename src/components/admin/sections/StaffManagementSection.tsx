"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Ban, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { mockTeachers } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export default function StaffManagementSection() {
  const [staffList, setStaffList] = useState(mockTeachers);
  const [staffModal, setStaffModal] = useState<"admin" | "teacher" | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleStaff = (id: string) => {
    setStaffList((list) =>
      list.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
          : s
      )
    );
    toast("Status user diperbarui", { icon: "🛠️" });
  };

  const addStaff = async () => {
    setSaving(true);
    await sleep(1200);
    setSaving(false);
    toast.success(`${staffModal === "admin" ? "Admin" : "Guru"} baru ditambahkan`);
    setStaffModal(null);
  };

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Manajemen Admin & Guru</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Tambah staff baru atau nonaktifkan akses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setStaffModal("admin")}
          >
            Tambah Admin
          </Button>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setStaffModal("teacher")}
          >
            Tambah Guru
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-[var(--color-text-soft)] border-b border-[var(--color-border-soft)]">
              <tr>
                <th className="px-5 py-4">Nama</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Mata Pelajaran</th>
                <th className="px-5 py-4">Sesi</th>
                <th className="px-5 py-4">Rating</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-[var(--color-border)]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.name} size={32} />
                      <span className="text-[var(--color-text)]">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)]">{t.email}</td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)]">{t.subject}</td>
                  <td className="px-5 py-4 text-[var(--color-text)]">{t.sessions}</td>
                  <td className="px-5 py-4 text-amber-300">⭐ {t.rating}</td>
                  <td className="px-5 py-4">
                    <Badge tone={t.status === "ACTIVE" ? "success" : "neutral"}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant={t.status === "ACTIVE" ? "outline" : "primary"}
                      size="sm"
                      leftIcon={<Ban className="w-3.5 h-3.5" />}
                      onClick={() => toggleStaff(t.id)}
                    >
                      {t.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!staffModal}
        onClose={() => setStaffModal(null)}
        title={staffModal === "admin" ? "Tambah Admin Baru" : "Tambah Guru Baru"}
        size="md"
      >
        <div className="space-y-4">
          <Input label="Nama Lengkap" placeholder="Nama" />
          <Input label="Email" type="email" placeholder="user@edudoc.id" />
          {staffModal === "teacher" && (
            <Input label="Mata Pelajaran" placeholder="Matematika" />
          )}
          <Input label="Password Awal" type="password" placeholder="••••••••" />
          <p className="text-xs text-[var(--color-text-mute)]">
            User akan diminta ganti password saat login pertama.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStaffModal(null)}>
              Batal
            </Button>
            <Button onClick={addStaff} loading={saving}>
              Tambahkan
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
