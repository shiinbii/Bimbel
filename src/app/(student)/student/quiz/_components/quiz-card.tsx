"use client";

import Link from "next/link";

import { Box, Card, CardContent, Chip, Typography } from "@mui/material";

import NiClock from "@/icons/nexture/ni-clock";
import NiDocumentFull from "@/icons/nexture/ni-document-full";
import NiDocumentVideo from "@/icons/nexture/ni-document-video";
import NiPlay from "@/icons/nexture/ni-play";
import type { Test } from "@/lib/types";

const TYPE_META: Record<
  Test["type"],
  { label: string; color: "primary" | "warning" | "info" }
> = {
  PRE_TEST: { label: "Pre-Test", color: "info" },
  EXAM: { label: "Ujian", color: "primary" },
  VIDEO_QUIZ: { label: "Video Quiz", color: "warning" },
};

export default function QuizCard({ test }: { test: Test }) {
  const meta = TYPE_META[test.type];
  return (
    <Card
      component={Link}
      href={`/student/quiz/${test.id}`}
      className="flex h-full flex-col transition-transform hover:scale-[1.02]"
    >
      <CardContent className="flex h-full flex-col gap-2.5">
        <Box className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <Box className="flex flex-wrap gap-1">
            <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
            {test.requireVideo && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                icon={<NiDocumentVideo size="small" />}
                label="Tonton Video"
              />
            )}
          </Box>
          {test.cost === 0 ? (
            <Chip size="small" label="Gratis" color="success" variant="outlined" />
          ) : (
            <Typography variant="body2" className="text-warning font-semibold">
              {test.cost} pts
            </Typography>
          )}
        </Box>

        <Typography variant="subtitle1" className="line-clamp-2 leading-tight">
          {test.title}
        </Typography>
        <Typography variant="body2" className="text-text-secondary-dark text-nowrap">
          {test.subject}
        </Typography>
        <Typography
          variant="body2"
          className="text-text-secondary line-clamp-2"
        >
          {test.description}
        </Typography>

        <Box className="flex-1" />

        <Box
          className="flex items-center justify-between pt-2.5"
          sx={{ borderTop: "1px solid", borderColor: "divider" }}
        >
          <Box className="flex items-center gap-3">
            <Box className="text-text-secondary flex items-center gap-1">
              <NiDocumentFull size="small" />
              <Typography variant="caption">{test.totalQuestions} soal</Typography>
            </Box>
            <Box className="text-text-secondary flex items-center gap-1">
              <NiClock size="small" />
              <Typography variant="caption">{test.duration} mnt</Typography>
            </Box>
          </Box>
          <Box className="text-primary flex items-center gap-1">
            <Typography variant="caption" className="font-semibold">
              Mulai
            </Typography>
            <NiPlay size="small" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
