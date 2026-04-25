"use client";

import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

import NiCamera from "@/icons/nexture/ni-camera";
import NiDocumentCheck from "@/icons/nexture/ni-document-check";
import NiStar from "@/icons/nexture/ni-star";
import NiUsers from "@/icons/nexture/ni-users";
import { useCurrentUser } from "@/lib/current-user";
import { mockTests } from "@/lib/mock-data";

export default function TeacherDashboardPage() {
  const { user } = useCurrentUser();
  const firstName = (user.name || "Guru").split(" ")[0];

  const stats = [
    { icon: <NiUsers size="medium" />, label: "Total Siswa", value: "468", trend: "+24 minggu ini" },
    { icon: <NiCamera size="medium" />, label: "Total Sesi", value: "120", trend: "15 live" },
    { icon: <NiStar size="medium" />, label: "Rating Guru", value: "4.9", trend: "1.204 review" },
    {
      icon: <NiDocumentCheck size="medium" />,
      label: "Soal Dibuat",
      value: String(mockTests.length),
      trend: "+3 draft",
    },
  ];

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Siap Mengajar, {firstName}
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Ringkasan kelas, sesi privat, dan pendapatan — semua dalam satu dashboard.
          </Typography>
        </Grid>
      </Grid>

      <Grid size={12} container>
        <Typography variant="h6" component="h6" className="mt-2 mb-3 w-full">
          Ringkasan Performa
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
    </Grid>
  );
}
