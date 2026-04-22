"use client";

import { ExternalLink, Video } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export default function OpenZoomConfirm({ open, onClose, title, url }: Props) {
  const go = () => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Akses sesi Zoom?`}
      description={`Kamu akan dialihkan ke ruang Zoom untuk sesi "${title}".`}
      size="sm"
      align="center"
      icon={<Video className="w-6 h-6" />}
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3 text-left">
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
            URL Zoom
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--color-text)] break-all">{url}</p>
        </div>
        <p className="text-xs text-[var(--color-text-soft)]">
          Link akan dibuka di tab baru.
        </p>
        <div className="flex items-center gap-2 pt-2">
          <Button full variant="ghost" onClick={onClose}>
            Tidak
          </Button>
          <Button
            full
            variant="gold"
            onClick={go}
            leftIcon={<ExternalLink className="w-4 h-4" />}
          >
            Ya, Buka Zoom
          </Button>
        </div>
      </div>
    </Modal>
  );
}
