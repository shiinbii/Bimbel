"use client";

import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts";

import { ROLE_LABEL } from "@/config/roles";
import NiCamera from "@/icons/nexture/ni-camera";
import NiCoin from "@/icons/nexture/ni-coin";
import NiHeadset from "@/icons/nexture/ni-headset";
import NiUsers from "@/icons/nexture/ni-users";
import NiWallet from "@/icons/nexture/ni-wallet";
import { useAdminStats } from "@/lib/admin-stats";
import { useCurrentUser } from "@/lib/current-user";
import { formatIDR } from "@/lib/format";
import { useRole } from "@/lib/role-context";

const REVENUE_MONTHS = ["Okt", "Nov", "Des", "Jan", "Feb", "Mar", "Apr"];
const REVENUE_DATA = [94, 112, 128, 142, 156, 178, 210];

export default function AdminDashboardPage() {
  const { user } = useCurrentUser();
  const { role } = useRole();
  const s = useAdminStats();
  const firstName = (user.name || "Admin").split(" ")[0];

  const userTrend =
    s.newUsersThisMonth > 0 ? `+${s.newUsersThisMonth} bulan ini` : s.loaded ? "Belum ada user baru" : "—";
  const txTrend =
    s.transactionsToday > 0
      ? `${s.transactionsTodaySuccess} sukses · ${s.transactionsTodayPending} pending`
      : s.loaded
        ? "Belum ada transaksi"
        : "—";
  const revenueTrend =
    s.revenueGrowthPct !== 0
      ? `${s.revenueGrowthPct > 0 ? "+" : ""}${s.revenueGrowthPct}% MoM`
      : s.loaded
        ? "Bandingan bulan lalu —"
        : "—";
  const sessionTrend =
    s.liveSessions > 0
      ? `${s.liveSessions} live sekarang`
      : s.scheduledSessions > 0
        ? `${s.scheduledSessions} terjadwal`
        : "Tidak ada sesi aktif";

  const stats = [
    {
      icon: <NiUsers size="medium" />,
      label: "Total User",
      value: s.totalUsers.toLocaleString("id-ID"),
      trend: userTrend,
    },
    {
      icon: <NiCoin size="medium" />,
      label: "Transaksi Hari Ini",
      value: String(s.transactionsToday),
      trend: txTrend,
    },
    {
      icon: <NiWallet size="medium" />,
      label: "Revenue Bulan",
      value: formatIDR(s.revenueThisMonth),
      trend: revenueTrend,
    },
    {
      icon: <NiCamera size="medium" />,
      label: "Sesi Aktif",
      value: String(s.liveSessions + s.scheduledSessions),
      trend: sessionTrend,
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
          {stats.map((stat) => (
            <Grid size={{ lg: 3, md: 6, xs: 12 }} key={stat.label}>
              <Card>
                <CardContent className="flex flex-col gap-5">
                  <Box className="flex flex-col">
                    <Box className="flex flex-row items-center justify-between">
                      <Typography variant="body2" className="text-text-secondary-dark text-nowrap">
                        {stat.label}
                      </Typography>
                      <Box className="text-primary">{stat.icon}</Box>
                    </Box>
                    <Box className="mt-1 flex flex-row items-center justify-start gap-2 lg:justify-between lg:gap-0">
                      <Typography variant="h5" className="text-text-primary">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" className="text-text-secondary-light">
                        {stat.trend}
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
                    data: REVENUE_DATA,
                    label: "Revenue (juta Rp)",
                    area: true,
                  },
                ]}
                xAxis={[{ scaleType: "band", data: REVENUE_MONTHS }]}
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
                7
              </Typography>
              <Typography variant="body2" className="text-text-secondary">
                Rata-rata response time: <strong>3 menit</strong>
              </Typography>
              <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" className="text-text-secondary-dark">
                  SLA bulan ini
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  96% request terjawab dalam &lt;5 menit
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}
