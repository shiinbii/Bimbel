"use client";

import { motion } from "framer-motion";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { mockTransactions } from "@/lib/mock-data";
import { formatIDR } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

function toCSV(rows: Transaction[]): string {
  const header = ["ID", "User", "Paket", "Nilai", "Poin", "Metode", "Status", "Waktu"];
  const escape = (v: string | number) => {
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [header.join(",")];
  for (const t of rows) {
    lines.push(
      [t.id, t.user, t.package, t.amount, t.points, t.method, t.status, t.createdAt]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\n");
}

function download(filename: string, content: string | Blob, mime?: string) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Create a printable HTML page for PDF export via browser print dialog. */
function buildPrintablePDF(rows: Transaction[]): string {
  const now = new Date().toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const totalAmount = rows.reduce((acc, r) => acc + r.amount, 0);
  const tableRows = rows
    .map(
      (t) => `
    <tr>
      <td>${t.id}</td>
      <td>${t.user}</td>
      <td>${t.package}</td>
      <td style="text-align:right">${formatIDR(t.amount)}</td>
      <td style="text-align:right">${t.points}</td>
      <td>${t.method}</td>
      <td><span class="badge ${t.status.toLowerCase()}">${t.status}</span></td>
      <td>${t.createdAt}</td>
    </tr>
  `
    )
    .join("");
  return `<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>Laporan Transaksi EduDoc — ${now}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif; color: #0f172a; padding: 32px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { margin: 0 0 4px; font-size: 22px; color: #4f46e5; }
  .sub { color: #64748b; font-size: 12px; }
  .meta { text-align: right; font-size: 11px; color: #64748b; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
  .card .value { font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead tr { background: #4f46e5; color: white; }
  th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
  th { font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
  tbody tr:nth-child(even) td { background: #fafbfe; }
  .badge { padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
  .badge.success { background: #dcfce7; color: #166534; }
  .badge.pending { background: #fef3c7; color: #92400e; }
  .badge.failed { background: #fee2e2; color: #991b1b; }
  footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } header { page-break-after: avoid; } tr { page-break-inside: avoid; } }
</style>
</head><body>
<header>
  <div>
    <h1>Laporan Transaksi EduDoc</h1>
    <div class="sub">Generated ${now}</div>
  </div>
  <div class="meta">
    EduDoc — Bimbel Online Premium<br/>
    edudoc.id
  </div>
</header>
<div class="summary">
  <div class="card"><div class="label">Total Transaksi</div><div class="value">${rows.length}</div></div>
  <div class="card"><div class="label">Total Nilai</div><div class="value">${formatIDR(totalAmount)}</div></div>
  <div class="card"><div class="label">Sukses / Pending / Gagal</div><div class="value">${rows.filter((r) => r.status === "SUCCESS").length} / ${rows.filter((r) => r.status === "PENDING").length} / ${rows.filter((r) => r.status === "FAILED").length}</div></div>
</div>
<table>
  <thead>
    <tr>
      <th>ID</th><th>User</th><th>Paket</th><th>Nilai</th><th>Poin</th><th>Metode</th><th>Status</th><th>Waktu</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>
<footer>Laporan otomatis — EduDoc © 2026. Cetak halaman ini ke PDF via browser (Ctrl/Cmd+P).</footer>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));</script>
</body></html>`;
}

export default function TransactionsSection() {
  const [exporting, setExporting] = useState<null | "excel" | "pdf">(null);

  const exportExcel = () => {
    setExporting("excel");
    try {
      // CSV is natively openable in Excel/Sheets. Add BOM for UTF-8 friendliness.
      const csv = "﻿" + toCSV(mockTransactions);
      const date = new Date().toISOString().slice(0, 10);
      download(
        `transaksi-edudoc-${date}.csv`,
        csv,
        "text/csv;charset=utf-8"
      );
      toast.success(`${mockTransactions.length} transaksi diekspor ke Excel/CSV`);
    } catch {
      toast.error("Gagal export Excel");
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = () => {
    setExporting("pdf");
    try {
      const html = buildPrintablePDF(mockTransactions);
      const w = window.open("", "_blank", "width=900,height=800");
      if (!w) {
        toast.error("Popup diblokir browser — izinkan popup untuk export PDF");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      toast.success(
        "Jendela cetak terbuka — pilih 'Save as PDF' di dialog print"
      );
    } catch {
      toast.error("Gagal export PDF");
    } finally {
      setExporting(null);
    }
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Transaksi</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Riwayat pembayaran paket poin dari seluruh user.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportExcel}
            loading={exporting === "excel"}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
          >
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={exportPDF}
            loading={exporting === "pdf"}
            leftIcon={<FileText className="w-4 h-4 text-red-400" />}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-3 text-xs text-[var(--color-text-soft)] flex items-start gap-2">
        <Download className="w-3.5 h-3.5 text-indigo-300 mt-0.5 shrink-0" />
        <span>
          <strong className="text-[var(--color-text)]">Excel</strong>: download file{" "}
          <span className="font-mono">.csv</span> (bisa dibuka di Microsoft
          Excel / Google Sheets / LibreOffice).{" "}
          <strong className="text-[var(--color-text)]">PDF</strong>: membuka jendela cetak
          baru — pilih &ldquo;Save as PDF&rdquo; sebagai destinasi.
        </span>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-[var(--color-text-soft)] border-b border-[var(--color-border-soft)]">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Paket</th>
                <th className="px-5 py-4">Nilai</th>
                <th className="px-5 py-4">Metode</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--color-border)]"
                >
                  <td className="px-5 py-4 font-mono text-[var(--color-text-soft)] text-xs">
                    {t.id}
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text)]">{t.user}</td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)]">{t.package}</td>
                  <td className="px-5 py-4 text-[var(--color-text)]">{formatIDR(t.amount)}</td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)]">{t.method}</td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={
                        t.status === "SUCCESS"
                          ? "success"
                          : t.status === "PENDING"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--color-text-soft)]">
                    {t.createdAt}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
