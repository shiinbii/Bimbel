"use client";

import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts";

import NiCamera from "@/icons/nexture/ni-camera";
import NiCoin from "@/icons/nexture/ni-coin";
import NiHeadset from "@/icons/nexture/ni-headset";
import NiUsers from "@/icons/nexture/ni-users";
import NiWallet from "@/icons/nexture/ni-wallet";
import { ROLE_LABEL } from "@/config/roles";
import { useCurrentUser } from "@/lib/current-user";
import { formatIDR } from "@/lib/format";
import { mockStudents, mockTeachers } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { useZoomSessions } from "@/lib/zoom-sessions-store";

const REVENUE_MONTHS = ["Okt", "Nov", "Des", "Jan", "Feb", "Mar", "Apr"];
const REVENUE_DATA = [94, 112, 128, 142, 156, 178, 210];

export default function AdminDashboardPage() {
  const { user } = useCurrentUser();
  const { role } = useRole();
  const { list: zoomList } = useZoomSessions();
  const firstName = (user.name || "Admin").split(" ")[0];
  const liveCount = zoomList.filter((z) => z.status === "LIVE").length;
  const totalUsers = mockStudents.length + mockTeachers.length + 1420;
  const totalMonth = 1250;

  const stats = [
    {
      icon: <NiUsers size="medium" />,
      label: "Total User",
      value: totalUsers.toLocaleString("id-ID"),
      trend: "+248 bulan ini",
    },
    {
      icon: <NiCoin size="medium" />,
      label: "Transaksi Hari Ini",
      value: "42",
      trend: "24 sukses · 6 pending",
    },
    {
      icon: <NiWallet size="medium" />,
      label: "Revenue Bulan",
      value: formatIDR(totalMonth * 100_000),
      trend: "+18% MoM",
    },
    {
      icon: <NiCamera size="medium" />,
      label: "Sesi Aktif",
      value: String(liveCount + 12),
      trend: `${liveCount} live sekarang`,
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
                    <Box className="flex flex-row items-center justify-start gap-2 lg:justify-between lg:gap-0 mt-1">
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
              <Box className="flex items-center gap-2 text-warning">
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
