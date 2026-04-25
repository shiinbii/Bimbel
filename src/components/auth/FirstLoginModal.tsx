"use client";

import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";

import NiShieldCheck from "@/icons/nexture/ni-shield-check";

interface Props {
  open: boolean;
  onContinue: () => void;
  userName?: string;
}

export default function FirstLoginModal({ open, onContinue, userName }: Props) {
  const [ack, setAck] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={(_e, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
      }}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle className="flex items-center gap-3">
        <Box
          className="flex items-center justify-center rounded-xl"
          sx={{
            width: 40,
            height: 40,
            background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent-3)) 100%)",
            color: "hsl(var(--text-contrast))",
          }}
        >
          <NiShieldCheck size="medium" />
        </Box>
        <Box>
          <Typography variant="h5" component="h2">
            Selamat Datang di EduDoc
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            {userName
              ? `Halo, ${userName}. Sebelum lanjut, baca kebijakan penting berikut.`
              : "Sebelum lanjut, baca kebijakan penting berikut."}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning" className="mb-4">
          <Typography variant="subtitle2" className="mb-1 font-semibold">
            Kebijakan Aktivitas Akun
          </Typography>
          <Typography variant="body2">
            Demi keamanan data, akun <strong>siswa</strong> dan <strong>guru</strong> akan dinonaktifkan otomatis jika
            tidak login selama <strong>3 bulan berturut-turut</strong>.
          </Typography>
          <Typography variant="caption" component="p" className="mt-2">
            Akun tidak hilang — kamu bisa menghubungi admin untuk mengaktifkan kembali. Data belajar, saldo poin, dan
            riwayat quiz tetap aman.
          </Typography>
        </Alert>

        <FormControlLabel
          control={<Checkbox checked={ack} onChange={(e) => setAck(e.target.checked)} />}
          label={
            <Typography variant="body2">
              Saya mengerti bahwa akun saya akan dinonaktifkan otomatis jika tidak login selama 3 bulan, dan setuju
              dengan kebijakan keamanan akun EduDoc.
            </Typography>
          }
        />
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onContinue} disabled={!ack} fullWidth>
          Saya Mengerti, Lanjutkan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
