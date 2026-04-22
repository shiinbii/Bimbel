"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useRole } from "@/lib/role-context";
import { useCurrentUser } from "@/lib/current-user";
import { sleep } from "@/lib/utils";

interface Props {
  variant?: "icon" | "link" | "full";
  onNavigate?: () => void;
}

export default function LogoutButton({ variant = "icon", onNavigate }: Props) {
  const router = useRouter();
  const { setRole } = useRole();
  const { clear } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const doLogout = async () => {
    setLoading(true);
    await clear(); // await — supaya session Supabase benar-benar hilang
    setRole("STUDENT");
    setLoading(false);
    setOpen(false);
    toast.success("Berhasil keluar dari EduDoc");
    onNavigate?.();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    } else {
      router.push("/login");
    }
  };

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Keluar"
        className="w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] flex items-center justify-center text-[var(--color-text-soft)] hover:text-red-300 hover:border-red-500/40 hover:bg-red-500/10 transition"
      >
        <LogOut className="w-4 h-4" />
      </button>
    ) : variant === "full" ? (
      <Button
        full
        variant="outline"
        onClick={() => setOpen(true)}
        leftIcon={<LogOut className="w-4 h-4" />}
      >
        Keluar
      </Button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-text-soft)] hover:text-red-300 transition"
      >
        <LogOut className="w-3.5 h-3.5" />
        Keluar
      </button>
    );

  return (
    <>
      {trigger}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Keluar dari EduDoc?"
        description="Sesi login kamu akan dihapus dari perangkat ini."
        size="sm"
      >
        <div className="flex items-center gap-2 pt-2">
          <Button full variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            full
            variant="danger"
            onClick={doLogout}
            loading={loading}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Ya, Keluar
          </Button>
        </div>
      </Modal>
    </>
  );
}
