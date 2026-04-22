"use client";

import { motion } from "framer-motion";
import {
  Calendar, Check, ExternalLink, Link as LinkIcon, MessageCircle,
  Send, X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import OpenZoomConfirm from "@/components/zoom/OpenZoomConfirm";
import PrivateChatPanel from "./PrivateChatPanel";
import {
  usePrivateZoom,
  type PrivateZoomRequest,
  type PrivateZoomStatus,
} from "@/lib/private-zoom-store";
import { pushNotification } from "@/lib/notifications-store";
import { sleep } from "@/lib/utils";

const STATUS_TONE: Record<PrivateZoomStatus, "info" | "warning" | "success" | "danger" | "neutral" | "primary"> = {
  PENDING: "warning",
  SCHEDULED: "info",
  CONFIRMED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  DONE: "primary",
};

const STATUS_LABEL: Record<PrivateZoomStatus, string> = {
  PENDING: "Butuh Jadwal",
  SCHEDULED: "Menunggu Siswa",
  CONFIRMED: "Dikonfirmasi",
  REJECTED: "Perlu Re-schedule",
  CANCELLED: "Dibatalkan",
  DONE: "Selesai",
};

export default function TeacherRequestsList({
  teacherId,
  teacherName,
  teacherEmail,
}: {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
}) {
  const { list, update } = usePrivateZoom();
  const mine = list.filter((r) => r.teacherId === teacherId);

  const [scheduleFor, setScheduleFor] = useState<PrivateZoomRequest | null>(
    null
  );
  const [chatFor, setChatFor] = useState<PrivateZoomRequest | null>(null);
  const [zoomFor, setZoomFor] = useState<PrivateZoomRequest | null>(null);

  if (mine.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-serif text-lg text-[var(--color-text)]">
          Belum ada permintaan sesi privat
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
          Permintaan dari siswa Premium akan muncul di sini dengan notifikasi.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {mine
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="p-4">
              <div className="flex items-start gap-4">
                <Avatar name={r.studentName} size={44} ring />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-serif text-lg text-[var(--color-text)]">
                      {r.studentName}
                    </p>
                    <Badge tone="gold">Premium</Badge>
                    <Badge tone={STATUS_TONE[r.status]}>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-soft)] mt-0.5">
                    {r.studentEmail} · diminta{" "}
                    {new Date(r.createdAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-sm text-[var(--color-text)] mt-2">
                    <strong>Topik:</strong> {r.topic}
                  </p>
                  {r.notes && (
                    <p className="text-xs text-[var(--color-text-mute)] mt-0.5">
                      Catatan siswa: {r.notes}
                    </p>
                  )}

                  {r.scheduledAt && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-500/25 bg-indigo-500/5 px-3 py-2 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                      <span className="text-[var(--color-text)]">
                        {new Date(r.scheduledAt).toLocaleString("id-ID", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </span>
                      {r.durationMinutes && (
                        <span className="text-[var(--color-text-soft)]">
                          · {r.durationMinutes} menit
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(r.status === "PENDING" || r.status === "REJECTED") && (
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => setScheduleFor(r)}
                        leftIcon={<Calendar className="w-3.5 h-3.5" />}
                      >
                        {r.status === "REJECTED" ? "Re-schedule" : "Tentukan Jadwal"}
                      </Button>
                    )}
                    {r.status === "SCHEDULED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScheduleFor(r)}
                        leftIcon={<Calendar className="w-3.5 h-3.5" />}
                      >
                        Ubah Jadwal
                      </Button>
                    )}
                    {r.status === "CONFIRMED" && r.meetingUrl && (
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => setZoomFor(r)}
                        leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Buka Zoom
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChatFor(r)}
                      leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                    >
                      Chat Siswa
                    </Button>
                    {r.status !== "CANCELLED" && r.status !== "DONE" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          update(r.id, { status: "CANCELLED" });
                          toast("Sesi dibatalkan", { icon: "🛑" });
                        }}
                        className="text-red-300 hover:bg-red-500/10"
                      >
                        Batalkan
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

      {/* SCHEDULE MODAL */}
      <ScheduleModal
        request={scheduleFor}
        onClose={() => setScheduleFor(null)}
        onSave={async (patch) => {
          if (!scheduleFor) return;
          await sleep(700);
          update(scheduleFor.id, { ...patch, status: "SCHEDULED" });
          pushNotification({
            kind: "PRIVATE_ZOOM_SCHEDULED",
            targetEmail: scheduleFor.studentEmail,
            title: "Jadwal Sesi Privat Tersedia",
            body: `${teacherName} menawarkan jadwal ${new Date(
              patch.scheduledAt!
            ).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })} — konfirmasi kehadiranmu.`,
            link: "/student/private-zoom",
          });
          toast.success(
            `Jadwal dikirim. Notifikasi WA + Email + Dashboard ke ${scheduleFor.studentName}`,
            { icon: "📨", duration: 4000 }
          );
          setScheduleFor(null);
        }}
      />

      <PrivateChatPanel
        open={!!chatFor}
        onClose={() => setChatFor(null)}
        request={chatFor}
        viewAs="teacher"
        selfName={teacherName}
        selfEmail={teacherEmail}
      />

      <OpenZoomConfirm
        open={!!zoomFor}
        onClose={() => setZoomFor(null)}
        title={zoomFor ? `Sesi Privat dengan ${zoomFor.studentName}` : ""}
        url={zoomFor?.meetingUrl ?? ""}
      />
    </div>
  );
}

function ScheduleModal({
  request,
  onClose,
  onSave,
}: {
  request: PrivateZoomRequest | null;
  onClose: () => void;
  onSave: (patch: Partial<PrivateZoomRequest>) => Promise<void>;
}) {
  const [dt, setDt] = useState("");
  const [duration, setDuration] = useState(60);
  const [url, setUrl] = useState("https://zoom.us/j/private-mock-edudoc");
  const [saving, setSaving] = useState(false);

  // Seed from existing when opening
  if (request && !dt && request.scheduledAt) {
    setDt(new Date(request.scheduledAt).toISOString().slice(0, 16));
  }

  const submit = async () => {
    if (!dt) {
      toast.error("Tentukan tanggal & waktu");
      return;
    }
    if (!url.trim()) {
      toast.error("URL Zoom wajib diisi");
      return;
    }
    setSaving(true);
    await onSave({
      scheduledAt: new Date(dt).toISOString(),
      durationMinutes: duration,
      meetingUrl: url.trim(),
    });
    setSaving(false);
    setDt("");
  };

  return (
    <Modal
      open={!!request}
      onClose={onClose}
      title={request ? `Jadwal untuk ${request.studentName}` : "Tentukan Jadwal"}
      description="Siswa akan mendapat notifikasi dashboard, WhatsApp, & email."
      size="md"
    >
      <div className="space-y-3">
        <Input
          label="Tanggal & Waktu"
          type="datetime-local"
          icon={<Calendar className="w-4 h-4" />}
          value={dt}
          onChange={(e) => setDt(e.target.value)}
        />
        <Input
          label="Durasi (menit)"
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value) || 60)}
        />
        <Input
          label="URL Zoom Meeting"
          placeholder="https://zoom.us/j/..."
          icon={<LinkIcon className="w-4 h-4" />}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          hint="Link akan dibuka siswa saat sesi live"
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-soft)]">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="gold"
            onClick={submit}
            loading={saving}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Kirim Jadwal ke Siswa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
