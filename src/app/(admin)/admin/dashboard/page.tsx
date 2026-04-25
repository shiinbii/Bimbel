"use client";

import { useMemo } from "react";

import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts";

import { ROLE_LABEL } from "@/config/roles";
import NiCamera from "@/icons/nexture/ni-camera";
import NiCoin from "@/icons/nexture/ni-coin";
import NiHeadset from "@/icons/nexture/ni-headset";
import NiUsers from "@/icons/nexture/ni-users";
import NiWallet from "@/icons/nexture/ni-wallet";
import { useCurrentUser } from "@/lib/current-user";
import { formatIDR } from "@/lib/format";
import { useHelpdeskSessions } from "@/lib/helpdesk-store";
import { useRole } from "@/lib/role-context";
import { useTransactions } from "@/lib/transactions-store";
import { useUsersStore } from "@/lib/users-store";
import { useZoomSessions } from "@/lib/zoom-sessions-store";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

function isSameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export default function AdminDashboardPage() {
  const { user } = useCurrentUser();
  const { role } = useRole();
  const { list: users } = useUsersStore();
  const { list: transactions } = useTransactions();
  const { list: zoomList } = useZoomSessions();
  const { sessions: helpdeskSessions } = useHelpdeskSessions();

  const firstName = (user.name || "Admin").split(" ")[0];

  const metrics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const joinedThisMonth = users.filter((u) => u.joinedAt && new Date(u.joinedAt) >= startOfMonth).length;

    const txToday = transactions.filter((t) => isSameDay(t.createdAt, now));
    const txTodaySuccess = txToday.filter((t) => t.status === "SUCCESS").length;
    const txTodayPending = txToday.filter((t) => t.status === "PENDING").length;

    const txMonth = transactions.filter((t) => t.status === "SUCCESS" && isSameMonth(t.createdAt, now));
    const revenueMonth = txMonth.reduce((acc, t) => acc + (t.amount || 0), 0);

    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const txPrevMonth = transactions.filter((t) => t.status === "SUCCESS" && isSameMonth(t.createdAt, prevMonth));
    const revenuePrevMonth = txPrevMonth.reduce((acc, t) => acc + (t.amount || 0), 0);
    const momPercent =
      revenuePrevMonth > 0 ? Math.round(((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100) : null;

    const liveCount = zoomList.filter((z) => z.status === "LIVE").length;
    const activeSessions = zoomList.filter((z) => z.status !== "ENDED").length;

    const pendingHelpdesk = helpdeskSessions.filter((s) => s.status !== "CLOSED").length;

    return {
      totalUsers: users.length,
      joinedThisMonth,
      txTodayCount: txToday.length,
      txTodaySuccess,
      txTodayPending,
      revenueMonth,
      momPercent,
      liveCount,
      activeSessions,
      pendingHelpdesk,
    };
  }, [users, transactions, zoomList, helpdeskSessions]);

  const revenueSeries = useMemo(() => {
    const now = new Date();
    const points: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const total = transactions
        .filter((t) => t.status === "SUCCESS" && isSameMonth(t.createdAt, d))
        .reduce((acc, t) => acc + (t.amount || 0), 0);
      points.push({
        label: MONTH_SHORT[d.getMonth()],
        value: Math.round(total / 1_000_000),
      });
    }
    return points;
  }, [transactions]);

  const stats = [
    {
      icon: <NiUsers size="medium" />,
      label: "Total User",
      value: metrics.totalUsers.toLocaleString("id-ID"),
      trend: metrics.joinedThisMonth > 0 ? `+${metrics.joinedThisMonth} bulan ini` : "Belum ada user baru bulan ini",
    },
    {
      icon: <NiCoin size="medium" />,
      label: "Transaksi Hari Ini",
      value: String(metrics.txTodayCount),
      trend:
        metrics.txTodayCount === 0
          ? "Belum ada transaksi"
          : `${metrics.txTodaySuccess} sukses · ${metrics.txTodayPending} pending`,
    },
    {
      icon: <NiWallet size="medium" />,
      label: "Revenue Bulan",
      value: formatIDR(metrics.revenueMonth),
      trend: metrics.momPercent === null ? "—" : `${metrics.momPercent >= 0 ? "+" : ""}${metrics.momPercent}% MoM`,
    },
    {
      icon: <NiCamera size="medium" />,
      label: "Sesi Aktif",
      value: String(metrics.activeSessions),
      trend: `${metrics.liveCount} live sekarang`,
    },
  ];

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Pantau Platform, {firstName}
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            {ROLE_LABEL[role]} — ringkasan user, transaksi, dan helpdesk real-time.
          </Typography>
        </Grid>
      </Grid>

      <Grid size={12} container>
        <Typography variant="h6" component="h6" className="mt-2 mb-3 w-full">
          Metrik Utama
        </Typography>
        <Grid size={12} container spacing={2.5}>
          {stats.map((s) => (
            <Grid size={{ lg: 3, md: 6, xs: 12 }} key={s.label}>
              <Card>
                <CardContent className="flex flex-col gap-5">
                  <Box className="flex flex-col">
                    <Box className="flex flex-row items-center justify-between">
                      <Typography variant="body2" className="text-text-secondary-dark text-nowrap">
                        {s.label}
                      </Typography>
                      <Box className="text-primary">{s.icon}</Box>
                    </Box>
                    <Box className="mt-1 flex flex-row items-center justify-start gap-2 lg:justify-between lg:gap-0">
                      <Typography variant="h5" className="text-text-primary">
                        {s.value}
                      </Typography>
                      <Typography variant="body2" className="text-text-secondary-light">
                        {s.trend}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Revenue 7 Bulan Terakhir
          </Typography>
          <Card>
            <CardContent>
              <LineChart
                height={300}
                series={[
                  {
                    data: revenueSeries.map((p) => p.value),
                    label: "Revenue (juta Rp)",
                    area: true,
                  },
                ]}
                xAxis={[{ scaleType: "band", data: revenueSeries.map((p) => p.label) }]}
                margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                grid={{ horizontal: true }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Antrian Helpdesk
          </Typography>
          <Card sx={{ height: "100%" }}>
            <CardContent className="flex flex-col gap-2">
              <Box className="text-warning flex items-center gap-2">
                <NiHeadset size="medium" />
                <Typography variant="overline">Perlu Respon</Typography>
              </Box>
              <Typography variant="h3" component="p">
                {metrics.pendingHelpdesk}
              </Typography>
              <Typography variant="body2" className="text-text-secondary">
                {metrics.pendingHelpdesk === 0
                  ? "Semua sesi beres — tidak ada antrian."
                  : `${metrics.pendingHelpdesk} sesi menunggu respon admin.`}
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" className="text-text-secondary-dark">
                  Total sesi bulan ini
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {
                    helpdeskSessions.filter((s) => {
                      const d = new Date(s.createdAt);
                      const now = new Date();
                      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                    }).length
                  }{" "}
                  sesi
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}
