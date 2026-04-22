"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { mockAuditLogs } from "@/lib/mock-data";

export default function AuditLogSection() {
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Audit Log</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Jejak aktivitas admin dan super admin.
          </p>
        </div>
        <Badge tone="info" className="gap-1">
          <Activity className="w-3 h-3" /> realtime mock
        </Badge>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-[var(--color-text-soft)] border-b border-[var(--color-border-soft)]">
              <tr>
                <th className="px-5 py-4">Aksi</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Target</th>
                <th className="px-5 py-4">IP</th>
                <th className="px-5 py-4">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {mockAuditLogs.map((l, i) => (
                <motion.tr
                  key={l.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-soft)]"
                >
                  <td className="px-5 py-4">
                    <code className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-200 border border-indigo-500/25">
                      {l.action}
                    </code>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text)]">{l.user}</td>
                  <td className="px-5 py-4">
                    <Badge tone={l.role === "SUPER_ADMIN" ? "gold" : "primary"}>
                      {l.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)] font-mono text-xs">
                    {l.target}
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)] font-mono text-xs">
                    {l.ip}
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)] text-xs">{l.time}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
