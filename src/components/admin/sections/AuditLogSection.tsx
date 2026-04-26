"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useAuditLogs } from "@/lib/audit-store";

export default function AuditLogSection() {
  const { list, loaded, source } = useAuditLogs();

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Audit Log</h2>
          <p className="text-sm text-[var(--color-text-soft)]">Jejak aktivitas admin dan super admin.</p>
        </div>
        {loaded && (
          <Badge tone={source === "db" ? "success" : "warning"} className="gap-1">
            <Activity className="h-3 w-3" />
            {source === "db" ? "live data" : "data dummy"}
          </Badge>
        )}
      </div>

      {loaded && list.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[var(--color-text-soft)]">
          Belum ada audit log. Aktivitas admin akan muncul di sini.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border-soft)] text-left text-xs tracking-widest text-[var(--color-text-soft)] uppercase">
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
                {list.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-soft)]"
                  >
                    <td className="px-5 py-4">
                      <code className="rounded border border-indigo-500/25 bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-200">
                        {l.action}
                      </code>
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text)]">{l.user}</td>
                    <td className="px-5 py-4">
                      <Badge tone={l.role === "SUPER_ADMIN" ? "gold" : "primary"}>{l.role}</Badge>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[var(--color-text-soft)]">{l.target}</td>
                    <td className="px-5 py-4 font-mono text-xs text-[var(--color-text-soft)]">{l.ip}</td>
                    <td className="px-5 py-4 text-xs text-[var(--color-text-soft)]">{l.time}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}
