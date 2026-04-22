"use client";

import { useState } from "react";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import NiCheck from "@/icons/nexture/ni-check";
import NiChevronDownSmall from "@/icons/nexture/ni-chevron-down-small";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiQuestionHexagon from "@/icons/nexture/ni-question-hexagon";
import NiTrophy from "@/icons/nexture/ni-trophy";
import type { Question, Test } from "@/lib/types";

interface Props {
  test: Test;
  answers: Record<string, "A" | "B" | "C" | "D" | undefined>;
  onRetry: () => void;
  onBack: () => void;
  /** When true, hide per-question explanations (restricted tier). */
  hideExplanations?: boolean;
}

export default function ScoreResult({ test, answers, onRetry, onBack, hideExplanations }: Props) {
  const correctCount = test.questions.filter((q) => answers[q.id] === q.correct).length;
  const wrongCount = test.questions.filter(
    (q) => answers[q.id] && answers[q.id] !== q.correct,
  ).length;
  const unanswered = test.questions.length - correctCount - wrongCount;
  const score = Math.round((correctCount / Math.max(1, test.questions.length)) * 100);
  const passed = score >= test.passingScore;

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <Card>
        <CardContent sx={{ textAlign: "center", py: 5 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: passed ? "success.main" : "error.main",
              color: "common.white",
              mb: 2,
            }}
          >
            <NiTrophy size={28} />
          </Box>
          <Box>
            <Chip
              label={passed ? "LULUS" : "BELUM LULUS"}
              color={passed ? "success" : "error"}
              sx={{ mb: 2 }}
            />
          </Box>
          <Typography variant="overline" color="text.secondary">
            Skor Akhir
          </Typography>
          <Typography variant="h1" component="p" sx={{ my: 1 }}>
            {score}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Batas lulus: {test.passingScore} · {test.title}
          </Typography>

          <Grid container spacing={2} sx={{ mt: 3, maxWidth: 480, mx: "auto" }}>
            <Grid size={4}>
              <Card variant="outlined" sx={{ bgcolor: "success.light" }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h5" color="success.dark">
                    {correctCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Benar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card variant="outlined" sx={{ bgcolor: "error.light" }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h5" color="error.dark">
                    {wrongCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Salah
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h5">{unanswered}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Kosong
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button variant="outlined" onClick={onBack}>
              Kembali ke Daftar
            </Button>
            <Button variant="contained" onClick={onRetry}>
              Ulangi Quiz
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ mt: 5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">Review Jawaban</Typography>
            <Typography variant="body2" color="text.secondary">
              {hideExplanations
                ? "Pembahasan belum tersedia untuk tier kamu — upgrade untuk akses penuh."
                : "Pembahasan muncul otomatis untuk setiap soal."}
            </Typography>
          </Box>
        </Stack>

        {hideExplanations && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tier gratis hanya menampilkan benar/salah. Naik tier untuk membuka
            pembahasan lengkap + alasan per opsi.
          </Alert>
        )}

        <Stack spacing={1}>
          {test.questions.map((q, i) => (
            <ReviewItem
              key={q.id}
              q={q}
              index={i}
              userAnswer={answers[q.id]}
              hideExplanation={hideExplanations}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function ReviewItem({
  q,
  index,
  userAnswer,
  hideExplanation,
}: {
  q: Question;
  index: number;
  userAnswer?: "A" | "B" | "C" | "D";
  hideExplanation?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isCorrect = userAnswer === q.correct;
  const isUnanswered = !userAnswer;

  const statusIcon = isCorrect ? (
    <NiCheck size={16} />
  ) : isUnanswered ? (
    <NiQuestionHexagon size={16} />
  ) : (
    <NiCrossSquare size={16} />
  );
  const statusColor: "success" | "error" | "default" = isCorrect
    ? "success"
    : isUnanswered
      ? "default"
      : "error";

  return (
    <Accordion
      expanded={open}
      onChange={() => setOpen((v) => !v)}
      disableGutters
      sx={{ borderRadius: 2, "&:before": { display: "none" } }}
    >
      <AccordionSummary expandIcon={<NiChevronDownSmall size={16} />}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
          <Chip
            icon={statusIcon}
            color={statusColor}
            size="small"
            label={`#${index + 1}`}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              title={q.text}
              color={isCorrect ? "text.primary" : "text.secondary"}
            >
              {q.text}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {userAnswer && (
              <Chip
                size="small"
                label={`Kamu: ${userAnswer}`}
                color={isCorrect ? "success" : "error"}
                variant="outlined"
              />
            )}
            <Chip
              size="small"
              label={`Benar: ${q.correct}`}
              color="success"
              variant="outlined"
            />
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {q.options.map((o) => {
            const isUser = userAnswer === o.key;
            const isRight = q.correct === o.key;
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={o.key}>
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: isRight ? "success.light" : isUser ? "error.light" : "background.default",
                    borderColor: isRight ? "success.main" : isUser ? "error.main" : "divider",
                  }}
                >
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Chip size="small" label={o.key} />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {o.text}
                      </Typography>
                      {isRight && <NiCheck size={14} />}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {hideExplanation ? (
          <Alert severity="warning">
            Pembahasan terkunci. Upgrade tier untuk melihat pembahasan lengkap.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {userAnswer && !isCorrect && q.optionExplanations?.[userAnswer] && (
              <Alert severity="error">
                <Typography variant="overline" display="block">
                  Kenapa {userAnswer} bukan jawaban yang tepat
                </Typography>
                <Typography variant="body2">
                  {q.optionExplanations[userAnswer]}
                </Typography>
              </Alert>
            )}
            <Alert severity="info">
              <Typography variant="overline" display="block">
                Pembahasan jawaban benar ({q.correct})
              </Typography>
              <Typography variant="body2">{q.explanation}</Typography>
            </Alert>
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
