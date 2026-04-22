"use client";

import { useMemo, useState } from "react";

import {
  Box,
  Grid,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import NiBook from "@/icons/nexture/ni-book";
import NiSearch from "@/icons/nexture/ni-search";
import { mockTests, subjectList } from "@/lib/mock-data";
import type { TestType } from "@/lib/types";

import QuizCard from "./_components/quiz-card";

type TypeFilter = "ALL" | TestType;

const TYPE_TABS: { key: TypeFilter; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "PRE_TEST", label: "Pre-Test" },
  { key: "EXAM", label: "Ujian" },
  { key: "VIDEO_QUIZ", label: "Video Quiz" },
];

export default function QuizListPage() {
  const [subject, setSubject] = useState<string>("Semua");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockTests.filter((t) => {
      const matchSubject = subject === "Semua" || t.subject === subject;
      const matchType = type === "ALL" || t.type === type;
      const matchSearch =
        !q || t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
      return matchSubject && matchType && matchSearch;
    });
  }, [subject, type, search]);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Soal & Quiz
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Pilih tipe soal sesuai kebutuhan — pre-test untuk pemetaan, video quiz untuk materi
            baru, atau ujian untuk simulasi tes.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Box className="text-primary flex items-center gap-2">
            <NiBook size="medium" />
            <Typography variant="body2" className="text-text-secondary-dark">
              Bank Soal EduDoc
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid size={12}>
        <Tabs
          value={type}
          onChange={(_, v) => setType(v as TypeFilter)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TYPE_TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <TextField
            fullWidth
            placeholder="Cari nama soal, mata pelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <NiSearch size="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <ToggleButtonGroup
            value={subject}
            exclusive
            onChange={(_, v) => v && setSubject(v)}
            size="small"
            sx={{ flexWrap: "wrap", rowGap: 1 }}
          >
            {subjectList.map((s) => (
              <ToggleButton key={s} value={s} sx={{ whiteSpace: "nowrap" }}>
                {s}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      <Grid size={12}>
        {filtered.length === 0 ? (
          <Box className="py-10 text-center">
            <Typography variant="body2" className="text-text-secondary">
              Tidak ada soal yang cocok dengan filter.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map((t) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={t.id}>
                <QuizCard test={t} />
              </Grid>
            ))}
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
