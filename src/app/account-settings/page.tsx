"use client";

import { useSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import NiBell from "@/icons/nexture/ni-bell";
import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiCheck from "@/icons/nexture/ni-check";
import NiEmail from "@/icons/nexture/ni-email";
import NiLock from "@/icons/nexture/ni-lock";
import NiPhone from "@/icons/nexture/ni-phone";
import NiShield from "@/icons/nexture/ni-shield";
import NiUser from "@/icons/nexture/ni-user";
import NiWorld from "@/icons/nexture/ni-world";
import { useCurrentUser } from "@/lib/current-user";

const DEFAULT_PREFS = {
  emailNotif: true,
  smsNotif: false,
  pushNotif: true,
  newsletter: true,
  twoFactor: true,
  language: "Bahasa Indonesia",
  timezone: "Asia/Jakarta",
};

async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function resizeImage(dataUrl: string, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas tidak tersedia"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = dataUrl;
  });
}

function detectCurrentDevice(): string {
  if (typeof navigator === "undefined") return "Perangkat ini";
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";
  let os = "OS";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return `${browser} · ${os}`;
}

export default function AccountSettingsPage() {
  const { user, setUser, loaded } = useCurrentUser();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);
  const [profileSaving, setProfileSaving] = useState(false);

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefSaving, setPrefSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<string>("Perangkat ini");
  const avatarFileRef = useRef<HTMLInputElement | null>(null);

  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<string | undefined>(undefined);

  const openAvatarDialog = () => {
    setAvatarDraft(avatar);
    setAvatarDialogOpen(true);
  };

  const handleAvatarImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar("Ukuran file maks 5MB", { variant: "error" });
      return;
    }
    try {
      const raw = await readFileAsDataURL(file);
      const resized = await resizeImage(raw, 256);
      setAvatarDraft(resized);
    } catch {
      enqueueSnackbar("Gagal memproses gambar", { variant: "error" });
    }
  };

  const saveAvatarDialog = () => {
    setAvatar(avatarDraft);
    setAvatarDialogOpen(false);
  };

  useEffect(() => {
    setCurrentDevice(detectCurrentDevice());
  }, []);

  useEffect(() => {
    if (loaded) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
      setAvatar(user.avatar);
    }
  }, [loaded, user]);

  const saveProfile = async () => {
    setProfileSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setUser({ name, email, phone, avatar });
    setProfileSaving(false);
    enqueueSnackbar("Profil tersimpan", { variant: "success" });
  };

  const savePrefs = async () => {
    setPrefSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setPrefSaving(false);
    enqueueSnackbar("Pengaturan disimpan", { variant: "success" });
  };

  const togglePref = (k: keyof typeof prefs) => {
    setPrefs((p) => ({ ...p, [k]: !p[k] }));
  };

  const changePassword = async () => {
    if (!oldPw || !newPw || newPw !== confirmPw) {
      enqueueSnackbar("Periksa kembali form password", { variant: "error" });
      return;
    }
    setPwSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setPwSaving(false);
    enqueueSnackbar("Password berhasil diganti", { variant: "success" });
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    setPwOpen(false);
  };

  const deleteAccount = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    enqueueSnackbar("Permintaan penghapusan akun dikirim", { variant: "success" });
    setDeleteOpen(false);
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Pengaturan Akun
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Kelola profil, notifikasi, keamanan, dan preferensi akun kamu.
          </Typography>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            {/* Profile */}
            <Box>
              <Typography variant="h6" component="h6" className="mt-2 mb-3">
                Profil
              </Typography>
              <Card>
                <CardContent className="flex flex-col gap-2.5">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ color: "primary.main", display: "inline-flex" }}>
                      <NiUser size="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1">Data Diri</Typography>
                      <Typography variant="caption" className="text-text-secondary">
                        Edit nama lengkap, email, nomor HP, dan foto.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                    <Avatar src={avatar} sx={{ width: 64, height: 64 }}>
                      {(name || "U").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" className="text-text-secondary-dark" sx={{ mb: 1 }}>
                        Foto Profil
                      </Typography>
                      <Button size="small" variant="surface" color="grey" onClick={openAvatarDialog}>
                        Ganti Foto Profil
                      </Button>
                      <input
                        ref={avatarFileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        hidden
                        onChange={handleAvatarImport}
                      />
                    </Box>
                  </Stack>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Nama Lengkap"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Nomor HP" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </Grid>
                  </Grid>

                  <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      variant="paper"
                      color="grey"
                      onClick={() => {
                        setName(user.name ?? "");
                        setEmail(user.email ?? "");
                        setPhone(user.phone ?? "");
                        setAvatar(user.avatar);
                      }}
                    >
                      Batal
                    </Button>
                    <Button variant="contained" color="primary" onClick={saveProfile} disabled={profileSaving}>
                      {profileSaving ? "Menyimpan..." : "Simpan Profil"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Notifications */}
            <Box>
              <Typography variant="h6" component="h6" className="mt-2 mb-3">
                Notifikasi
              </Typography>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ color: "primary.main", display: "inline-flex" }}>
                      <NiBell size="small" />
                    </Box>
                    <Typography variant="caption" className="text-text-secondary">
                      Atur bagaimana EduDoc menghubungi kamu.
                    </Typography>
                  </Stack>
                  <ToggleRow
                    icon={<NiEmail size="small" />}
                    label="Email"
                    desc="Update pembayaran, pengingat sesi, dan digest mingguan."
                    active={prefs.emailNotif}
                    onChange={() => togglePref("emailNotif")}
                  />
                  <ToggleRow
                    icon={<NiPhone size="small" />}
                    label="SMS"
                    desc="Notifikasi penting saja — OTP dan keamanan akun."
                    active={prefs.smsNotif}
                    onChange={() => togglePref("smsNotif")}
                  />
                  <ToggleRow
                    icon={<NiBell size="small" />}
                    label="Push Notifikasi"
                    desc="Pengingat sesi zoom dan soal baru di platform."
                    active={prefs.pushNotif}
                    onChange={() => togglePref("pushNotif")}
                  />
                  <ToggleRow
                    icon={<NiEmail size="small" />}
                    label="Newsletter EduDoc"
                    desc="Tips belajar & artikel baru — dikirim setiap Senin."
                    active={prefs.newsletter}
                    onChange={() => togglePref("newsletter")}
                  />
                </CardContent>
              </Card>
            </Box>

            {/* Security */}
            <Box>
              <Typography variant="h6" component="h6" className="mt-2 mb-3">
                Keamanan
              </Typography>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ color: "warning.main", display: "inline-flex" }}>
                      <NiShield size="small" />
                    </Box>
                    <Typography variant="caption" className="text-text-secondary">
                      Kelola password dan autentikasi 2 langkah.
                    </Typography>
                  </Stack>
                  <ToggleRow
                    icon={<NiShield size="small" />}
                    label="Verifikasi 2 Langkah (2FA)"
                    desc="Butuh kode OTP tambahan setiap login."
                    active={prefs.twoFactor}
                    onChange={() => togglePref("twoFactor")}
                  />
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ color: "text.secondary", display: "inline-flex" }}>
                      <NiLock size="small" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Password</Typography>
                      <Typography variant="caption" className="text-text-secondary">
                        Terakhir diganti 2 bulan lalu
                      </Typography>
                    </Box>
                    <Button variant="surface" color="grey" size="tiny" onClick={() => setPwOpen(true)}>
                      Ganti Password
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Preferences */}
            <Box>
              <Typography variant="h6" component="h6" className="mt-2 mb-3">
                Preferensi
              </Typography>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ color: "success.main", display: "inline-flex" }}>
                      <NiWorld size="small" />
                    </Box>
                    <Typography variant="caption" className="text-text-secondary">
                      Bahasa dan zona waktu.
                    </Typography>
                  </Stack>
                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Bahasa"
                        value={prefs.language}
                        onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                      >
                        <MenuItem value="Bahasa Indonesia">Bahasa Indonesia</MenuItem>
                        <MenuItem value="English">English</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Zona Waktu"
                        value={prefs.timezone}
                        onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))}
                      >
                        <MenuItem value="Asia/Jakarta">Asia/Jakarta</MenuItem>
                        <MenuItem value="Asia/Makassar">Asia/Makassar</MenuItem>
                        <MenuItem value="Asia/Jayapura">Asia/Jayapura</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button variant="paper" color="grey" onClick={() => setPrefs(DEFAULT_PREFS)}>
                Reset Default
              </Button>
              <Button variant="contained" color="primary" onClick={savePrefs} disabled={prefSaving}>
                {prefSaving ? "Menyimpan..." : "Simpan Pengaturan"}
              </Button>
            </Stack>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" component="h6" className="mt-2 mb-3">
                Aktivitas Sesi
              </Typography>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <Typography variant="caption" className="text-text-secondary">
                    Perangkat yang sedang login.
                  </Typography>
                  <DeviceRow label={currentDevice} isCurrent />
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Typography variant="h6" component="h6" className="mt-2 mb-3" color="error">
                Zona Bahaya
              </Typography>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <Typography variant="caption" className="text-text-secondary">
                    Aksi di bawah ini tidak dapat dibatalkan.
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<NiBinEmpty size="small" />}
                    onClick={() => setDeleteOpen(true)}
                  >
                    Hapus Akun Saya
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Avatar dialog */}
      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ganti Foto Profil</DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center" sx={{ py: 1 }}>
            <Avatar src={avatarDraft} sx={{ width: 128, height: 128 }}>
              {(name || "U").charAt(0).toUpperCase()}
            </Avatar>
            <Stack direction="row" spacing={1}>
              <Button variant="surface" color="grey" onClick={() => avatarFileRef.current?.click()}>
                Pilih dari Perangkat
              </Button>
              {avatarDraft && (
                <Button variant="text" color="error" onClick={() => setAvatarDraft(undefined)}>
                  Hapus Foto
                </Button>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setAvatarDialogOpen(false)}>
            Batal
          </Button>
          <Button variant="contained" color="primary" onClick={saveAvatarDialog}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password dialog */}
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ganti Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Masukkan password lama dan password baru yang kuat.</DialogContentText>
          <Stack spacing={2}>
            <TextField
              label="Password Lama"
              type="password"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              fullWidth
            />
            <TextField
              label="Password Baru"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              fullWidth
            />
            <TextField
              label="Konfirmasi Password Baru"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setPwOpen(false)}>
            Batal
          </Button>
          <Button variant="contained" color="primary" onClick={changePassword} disabled={pwSaving}>
            {pwSaving ? "Mengganti..." : "Ganti Password"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Akun Permanen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Semua data akan dihapus dalam 30 hari. Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setDeleteOpen(false)}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={deleteAccount}>
            Ya, Hapus Akun
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

function ToggleRow({
  icon,
  label,
  desc,
  active,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  active: boolean;
  onChange: () => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      onClick={onChange}
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: active ? "primary.main" : "divider",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <Box
        sx={{
          color: active ? "primary.main" : "text.secondary",
          display: "inline-flex",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="caption" className="text-text-secondary">
          {desc}
        </Typography>
      </Box>
      <Switch checked={active} onChange={onChange} />
    </Stack>
  );
}

function DeviceRow({ label, ip, isCurrent }: { label: string; ip?: string; isCurrent?: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="space-between"
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Box>
        <Typography variant="body2">{label}</Typography>
        {ip && (
          <Typography variant="caption" className="text-text-secondary" sx={{ fontFamily: "monospace" }}>
            {ip}
          </Typography>
        )}
      </Box>
      {isCurrent ? (
        <Chip size="small" color="success" icon={<NiCheck size="small" />} label="Perangkat ini" />
      ) : (
        <Button size="tiny" variant="text" color="error">
          Keluarkan
        </Button>
      )}
    </Stack>
  );
}
