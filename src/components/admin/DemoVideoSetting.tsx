"use client";

import { motion } from "framer-motion";
import { Check, Eye, RotateCcw, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import VideoModal from "@/components/ui/VideoModal";
import { DEFAULT_DEMO_VIDEO_URL, getYoutubeEmbed, useDemoVideoUrl } from "@/lib/demo-video";
import { sleep } from "@/lib/utils";

export default function DemoVideoSetting() {
  const { url, setUrl, reset, loaded, embed } = useDemoVideoUrl();
  const [draft, setDraft] = useState(url);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loaded) setDraft(url);
  }, [loaded, url]);

  const draftEmbed = getYoutubeEmbed(draft);
  const isValid = !!draftEmbed;

  const save = async () => {
    if (!isValid) {
      toast.error("URL YouTube tidak valid");
      return;
    }
    setSaving(true);
    await sleep(800);
    setUrl(draft);
    setSaving(false);
    toast.success("URL video demo berhasil disimpan");
  };

  const onReset = () => {
    reset();
    setDraft(DEFAULT_DEMO_VIDEO_URL);
    toast.success("URL dikembalikan ke default");
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 flex items-center justify-center">
              <Youtube className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-xl text-[var(--color-text)]">Video Demo Landing</h3>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-soft)] max-w-lg">
            URL YouTube yang akan ditampilkan sebagai popup saat user atau guest
            menekan tombol &ldquo;Tonton Demo&rdquo; di halaman landing.
          </p>
        </div>
        <span
          className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${
            isValid
              ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
              : "text-red-300 border-red-500/30 bg-red-500/10"
          }`}
        >
          {isValid ? "Valid" : "Invalid"}
        </span>
      </div>

      <Input
        label="URL YouTube"
        placeholder="https://www.youtube.com/watch?v=xxxxxxxxxxx"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        icon={<Youtube className="w-4 h-4" />}
        hint="Mendukung format watch?v=, youtu.be, shorts/, embed/, atau video ID 11 karakter"
        error={!isValid && draft ? "URL tidak dikenali sebagai link YouTube" : undefined}
      />

      {isValid && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl overflow-hidden border border-[var(--color-border)] bg-black/30"
        >
          <div className="aspect-video">
            <iframe
              src={draftEmbed!.replace("autoplay=1", "autoplay=0")}
              title="Preview demo"
              className="w-full h-full"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--color-text-soft)] border-t border-[var(--color-border)]">
            Preview · tersimpan via localStorage browser
          </p>
        </motion.div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={save}
            loading={saving}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Simpan URL
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Default
          </Button>
        </div>
        <Button
          variant="ghost"
          leftIcon={<Eye className="w-4 h-4" />}
          onClick={() => setPreview(true)}
        >
          Lihat Popup (Tersimpan)
        </Button>
      </div>

      <p className="mt-3 text-[10px] text-[var(--color-text-mute)] uppercase tracking-widest">
        Demo · Data disimpan lokal di browser ini
      </p>

      <VideoModal
        open={preview}
        onClose={() => setPreview(false)}
        embedUrl={embed}
        title="Preview Video Demo"
      />
    </Card>
  );
}
