"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AvatarUpload from "@/components/ui/AvatarUpload";
import { useTestimonials } from "@/lib/testimonials-store";
import { useCurrentUser } from "@/lib/current-user";
import { useRole } from "@/lib/role-context";
import { sleep } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SubmitTestimonialModal({ open, onClose }: Props) {
  const { add } = useTestimonials();
  const { user } = useCurrentUser();
  const { role } = useRole();

  const [name, setName] = useState(user.name ?? "");
  const [roleLabel, setRoleLabel] = useState<string>(() => {
    switch (role) {
      case "STUDENT":
        return "Siswa SMA";
      case "TEACHER":
        return "Guru";
      case "ADMIN":
        return "Staff Admin";
      case "SUPER_ADMIN":
        return "Tim EduDoc";
      default:
        return "Pengguna";
    }
  });
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length >= 2 && message.trim().length >= 10;

  const submit = async () => {
    if (!canSubmit) {
      toast.error("Nama minimal 2 karakter, pesan minimal 10 karakter");
      return;
    }
    setSubmitting(true);
    await sleep(1000);
    add({
      name: name.trim(),
      role: roleLabel,
      message: message.trim(),
      rating,
      avatar,
    });
    setSubmitting(false);
    toast.success("Testimoni berhasil dikirim. Terima kasih!");
    onClose();
    setMessage("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tulis Testimoni"
      description="Bagikan pengalamanmu belajar di EduDoc. Testimoni ditampilkan di landing page."
      size="lg"
    >
      <div className="space-y-4">
        <AvatarUpload
          value={avatar}
          onChange={setAvatar}
          name={name || "Pengguna"}
          label="Foto Profil (Opsional)"
          description="Foto ditampilkan di samping testimoni kamu. Maks 2MB."
        />

        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Nama Tampilan"
            placeholder="Nama depan + inisial"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Status / Peran"
            placeholder="Siswa SMA, Lulusan PTN, Orang Tua, dll."
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            Rating
          </label>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => {
              const active = i <= (hover || rating);
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`Rating ${i}`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      active
                        ? "fill-amber-400 text-amber-400"
                        : "text-[var(--color-text)]/20"
                    }`}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-sm text-[var(--color-text)]">{rating}.0</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            Pesan Testimoni
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={400}
            placeholder="Ceritakan pengalaman belajarmu di EduDoc..."
            className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition resize-none"
          />
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-widest">
            <span className="text-[var(--color-text-soft)]">
              Minimal 10 karakter
            </span>
            <span className="text-[var(--color-text-mute)]">
              {message.length}/400
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl p-3 border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-xs text-[var(--color-text-soft)]"
        >
          Testimoni yang melanggar pedoman komunitas dapat dihapus oleh admin.
        </motion.div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} loading={submitting} disabled={!canSubmit}>
            Kirim Testimoni
          </Button>
        </div>
      </div>
    </Modal>
  );
}
