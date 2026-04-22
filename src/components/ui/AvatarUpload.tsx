"use client";

import { useRef, useState } from "react";
import { Camera, Trash2, Upload, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "./Avatar";

interface Props {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  name?: string;
  size?: number;
  label?: string;
  description?: string;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export default function AvatarUpload({
  value,
  onChange,
  name = "Foto",
  size = 96,
  label = "Foto Profil",
  description = "Upload foto JPG/PNG (max 2MB). Foto ini akan tampil di profil dan testimoni.",
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const pick = () => ref.current?.click();

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG/PNG/WebP)");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Ukuran file maks 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(typeof reader.result === "string" ? reader.result : undefined);
      toast.success("Foto profil siap");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="mt-1.5 flex items-center gap-4">
        <div
          onClick={pick}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="relative cursor-pointer shrink-0"
        >
          <Avatar name={name} src={value} size={size} ring />
          <div
            className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm transition ${
              hover ? "opacity-100" : "opacity-0"
            }`}
            style={{ width: size, height: size }}
          >
            <Camera className="w-5 h-5 text-[var(--color-text)]" />
          </div>
          {!value && (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 border-2 border-[var(--color-bg)] flex items-center justify-center">
              <Upload className="w-3 h-3 text-[var(--color-text)]" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={pick}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-[var(--color-bg-soft)] border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:border-indigo-500/50 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              {value ? "Ganti Foto" : "Upload Foto"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  if (ref.current) ref.current.value = "";
                }}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-red-500/30 text-sm text-red-300 hover:bg-red-500/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            )}
          </div>
          {description && (
            <p className="mt-2 text-xs text-[var(--color-text-soft)]">
              {description}
            </p>
          )}
        </div>
      </div>

      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
