"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import NiArrowLeft from "@/icons/nexture/ni-arrow-left";
import NiArrowRight from "@/icons/nexture/ni-arrow-right";
import NiClock from "@/icons/nexture/ni-clock";
import NiCoin from "@/icons/nexture/ni-coin";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiDocumentVideo from "@/icons/nexture/ni-document-video";
import NiPause from "@/icons/nexture/ni-pause";
import NiPlay from "@/icons/nexture/ni-play";
import NiRefresh from "@/icons/nexture/ni-refresh";
import NiShieldCross from "@/icons/nexture/ni-shield-cross";
import { useCurrentUser } from "@/lib/current-user";
import { useWallet } from "@/lib/points-store";
import { buildAttemptQuestions } from "@/lib/quiz-shuffle";
import { recordAttempt } from "@/lib/quiz-history-store";
import { useTestsStore, type ManagedTest } from "@/lib/tests-store";
import { computeTier, useTierConfigs } from "@/lib/tier-config-store";
import type { Question } from "@/lib/types";

import QuestionView from "./_components/question-view";
import ScoreResult from "./_components/score-result";

type Stage = "intro" | "video" | "quiz" | "result";
type OptionKey = "A" | "B" | "C" | "D";

const CHEAT_WARN_THRESHOLD = 3;
const CHEAT_FLAG_THRESHOLD = 5;

interface SavedAttempt {
  stage: Stage;
  idx: number;
  answers: Record<string, OptionKey | undefined>;
  timeLeft: number;
  attemptQs: Question[];
  tabSwitches: number;
  startedAt: string;
  pausedAt: string;
}

const attemptKey = (testId: string) => `edudoc.quiz_attempt:${testId}`;

export default function QuizAttemptPage() {
  const { balance, spend } = useWallet();
  const { list: tests } = useTestsStore();
  const { list: tiers } = useTierConfigs();
  const currentTier = computeTier(balance, tiers);
  const lowestTier = [...tiers].sort((a, b) => a.minPoints - b.minPoints)[0];
  const hideExplanations = currentTier.id === lowestTier?.id;
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const { enqueueSnackbar } = useSnackbar();
  const test = useMemo<ManagedTest | undefined>(
    () => tests.find((t) => t.id === params.id),
    [params.id, tests],
  );

  const [stage, setStage] = useState<Stage>("intro");
  const [videoProgress, setVideoProgress] = useState(0);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey | undefined>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptQs, setAttemptQs] = useState<Question[]>([]);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [savedAttempt, setSavedAttempt] = useState<SavedAttempt | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const startedAtRef = useRef<string>(new Date().toISOString());

  // Video progress simulation
  useEffect(() => {
    if (stage !== "video") return;
    const id = setInterval(() => {
      setVideoProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          return 100;
        }
        return p + 2.5;
      });
    }, 300);
    return () => clearInterval(id);
  }, [stage]);

  // Countdown timer — only when quiz stage, has duration, not paused
  useEffect(() => {
    if (stage !== "quiz" || !test || test.duration <= 0 || paused) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setStage("result");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, test, paused]);

  // Check for saved attempt on mount
  useEffect(() => {
    if (!test || typeof window === "undefined") return;
    const raw = localStorage.getItem(attemptKey(test.id));
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as SavedAttempt;
      if (saved && saved.stage === "quiz" && saved.attemptQs?.length > 0) {
        setSavedAttempt(saved);
        setResumeOpen(true);
      }
    } catch {
      // ignore corrupt payload
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test?.id]);

  // Auto-save attempt on state change
  useEffect(() => {
    if (!test || stage !== "quiz" || typeof window === "undefined") return;
    const payload: SavedAttempt = {
      stage,
      idx,
      answers,
      timeLeft,
      attemptQs,
      tabSwitches,
      startedAt: startedAtRef.current,
      pausedAt: new Date().toISOString(),
    };
    localStorage.setItem(attemptKey(test.id), JSON.stringify(payload));
  }, [stage, idx, answers, timeLeft, attemptQs, tabSwitches, test]);

  // Clear saved attempt when result
  useEffect(() => {
    if (stage === "result" && test && typeof window !== "undefined") {
      localStorage.removeItem(attemptKey(test.id));
    }
  }, [stage, test]);

  // Anti-cheat — pause on tab hide, count switches, warn + flag thresholds
  useEffect(() => {
    if (stage !== "quiz") return;
    const onVis = () => {
      if (document.hidden) {
        setPaused(true);
      } else {
        setPaused(false);
        setTabSwitches((n) => {
          const next = n + 1;
          if (next === CHEAT_WARN_THRESHOLD) {
            enqueueSnackbar(
              `Peringatan: kamu sudah berpindah tab ${next}× — aksi ini terdeteksi.`,
              { variant: "warning" },
            );
          } else if (next >= CHEAT_FLAG_THRESHOLD) {
            enqueueSnackbar(
              `Test ditandai mencurigakan (${next}× pindah tab). Hasil akan ditinjau admin.`,
              { variant: "error" },
            );
          }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [stage, enqueueSnackbar]);

  const activeQs = attemptQs.length > 0 ? attemptQs : (test?.questions ?? []);
  const currentQ = activeQs[idx];
  const progress = activeQs.length > 0 ? ((idx + 1) / activeQs.length) * 100 : 0;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  const start = useCallback(async () => {
    if (!test) return;
    if (!isPreview) {
      if (test.cost > balance) {
        enqueueSnackbar(
          `Poin tidak cukup. Butuh ${test.cost} pts, saldo ${balance} pts.`,
          { variant: "error" },
        );
        return;
      }
      if (test.cost > 0) {
        const ok = spend(test.cost, `Mulai quiz: ${test.title}`);
        if (!ok) {
          enqueueSnackbar("Gagal memotong poin. Silakan coba lagi.", { variant: "error" });
          return;
        }
        enqueueSnackbar(`${test.cost} poin dipotong`, { variant: "success" });
      }
    }
    setAttemptQs(
      buildAttemptQuestions({
        bank: test.questions,
        questionsPerAttempt: test.questionsPerAttempt,
        shuffleQuestions: test.shuffleQuestions,
        shuffleOptions: test.shuffleOptions,
      }),
    );
    setIdx(0);
    setAnswers({});
    setTabSwitches(0);
    setPaused(false);
    setTimeLeft(test.duration > 0 ? test.duration * 60 : 0);
    startedAtRef.current = new Date().toISOString();
    if (test.requireVideo) {
      setVideoProgress(0);
      setStage("video");
    } else {
      setStage("quiz");
    }
  }, [test, balance, spend, enqueueSnackbar]);

  const answer = (k: OptionKey) => {
    if (!currentQ) return;
    setAnswers((s) => ({ ...s, [currentQ.id]: k }));
  };

  const next = () => {
    if (idx < activeQs.length - 1) setIdx(idx + 1);
    else setStage("result");
  };

  const prev = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  if (!test) {
    return (
      <Stack spacing={3} sx={{ maxWidth: 640, mx: "auto" }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6">Quiz tidak ditemukan.</Typography>
            <Button component={Link} href="/student/quiz" sx={{ mt: 2 }}>
              Kembali ke daftar
            </Button>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {isPreview && (
        <Alert severity="info" icon={<NiDocumentVideo size="small" />}>
          Mode <strong>simulasi</strong> — poin tidak dipotong & hasil tidak dicatat ke riwayat.
        </Alert>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={1}>
        <Button
          component={Link}
          href="/student/quiz"
          startIcon={<NiArrowLeft size={16} />}
          size="small"
        >
          Daftar Quiz
        </Button>
        <Stack direction="row" spacing={1}>
          <Chip size="small" label={test.subject} />
          <Chip
            size="small"
            label={test.type.replace("_", " ")}
            color={test.type === "EXAM" ? "primary" : test.type === "VIDEO_QUIZ" ? "warning" : "info"}
          />
        </Stack>
      </Stack>

      {stage === "intro" && (
        <Box sx={{ maxWidth: 960, mx: "auto", width: "100%" }}>
          <Card>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Typography variant="h3" component="h1">
                {test.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 720 }}>
                {test.description}
              </Typography>

              <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                <IntroStat
                  label="Jumlah soal"
                  value={`${test.questionsPerAttempt}${
                    test.questions.length > test.questionsPerAttempt
                      ? ` dari ${test.questions.length}`
                      : ""
                  } soal`}
                />
                <IntroStat
                  label="Durasi"
                  value={test.duration > 0 ? `${test.duration} menit` : "Tanpa Timer"}
                  icon={<NiClock size={14} />}
                />
                <IntroStat
                  label="Biaya"
                  value={test.cost === 0 ? "Gratis" : `${test.cost} poin`}
                  icon={<NiCoin size={14} />}
                />
              </Box>

              <Card variant="outlined" sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Aturan pengerjaan
                  </Typography>
                  <Box component="ul" sx={{ pl: 2.5, mt: 1, "& li": { mb: 0.5 } }}>
                    <li>Kerjakan dengan tenang — timer akan berjalan otomatis.</li>
                    <li>Kamu bisa navigasi ke soal sebelumnya untuk merevisi jawaban.</li>
                    {test.requireVideo && <li>Tonton video materi terlebih dahulu sebelum mengerjakan.</li>}
                    <li>
                      Batas kelulusan: <strong>{test.passingScore}</strong>.
                    </li>
                    <li>
                      Berpindah tab ≥ {CHEAT_FLAG_THRESHOLD}× akan menandai hasil untuk review admin.
                    </li>
                  </Box>
                </CardContent>
              </Card>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                spacing={2}
                sx={{ mt: 4 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Saldo poin kamu: <strong>{balance} pts</strong>
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={start}
                  endIcon={<NiPlay size={16} />}
                >
                  {test.requireVideo ? "Tonton & Mulai" : "Mulai Sekarang"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {stage === "video" && (
        <Box sx={{ maxWidth: 960, mx: "auto", width: "100%" }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} color="primary.main">
                <NiDocumentVideo size={16} />
                <Typography variant="overline">Materi Video</Typography>
              </Stack>
              <Box
                sx={{
                  mt: 2,
                  aspectRatio: "16 / 9",
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "common.black",
                }}
              >
                <Box
                  component="iframe"
                  src={test.videoUrl}
                  title={test.title}
                  allowFullScreen
                  sx={{ width: "100%", height: "100%", border: 0 }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Progress tayangan (simulasi)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(videoProgress)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={videoProgress}
                  color="warning"
                  sx={{ mt: 1, height: 8, borderRadius: 1 }}
                />
              </Box>
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  disabled={videoProgress < 100}
                  onClick={() => setStage("quiz")}
                  endIcon={<NiArrowRight size={16} />}
                >
                  {videoProgress < 100 ? "Tonton video dulu..." : "Lanjut ke Soal"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {stage === "quiz" && currentQ && (
        <Box sx={{ maxWidth: 960, mx: "auto", width: "100%" }}>
          <Card sx={{ position: "sticky", top: 16, zIndex: 1, mb: 2 }}>
            <CardContent>
              {paused && (
                <Alert severity="warning" icon={<NiPause size={16} />} sx={{ mb: 1.5 }}>
                  Test dijeda karena tab tidak aktif. Kembali ke tab ini untuk melanjutkan.
                </Alert>
              )}
              {tabSwitches > 0 && (
                <Alert
                  icon={<NiShieldCross size={16} />}
                  severity={
                    tabSwitches >= CHEAT_FLAG_THRESHOLD
                      ? "error"
                      : tabSwitches >= CHEAT_WARN_THRESHOLD
                        ? "warning"
                        : "info"
                  }
                  sx={{ mb: 1.5 }}
                >
                  Deteksi pindah tab: <strong>{tabSwitches}×</strong>
                  {tabSwitches >= CHEAT_FLAG_THRESHOLD
                    ? " — Test ditandai mencurigakan."
                    : tabSwitches >= CHEAT_WARN_THRESHOLD
                      ? " — Jangan pindah tab lagi."
                      : ""}
                </Alert>
              )}
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Soal {idx + 1} dari {activeQs.length}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                  />
                </Box>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<NiCrossSquare size={14} />}
                  onClick={() => setExitOpen(true)}
                >
                  Keluar
                </Button>
                {test.duration > 0 ? (
                  <Chip
                    icon={<NiClock size={14} />}
                    label={`${mm}:${ss}`}
                    color={timeLeft < 60 ? "error" : "primary"}
                    sx={{ fontVariantNumeric: "tabular-nums", fontSize: "0.95rem", px: 1 }}
                  />
                ) : (
                  <Chip
                    icon={<NiClock size={14} />}
                    label="Tanpa Timer"
                    color="success"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 2, rowGap: 0.75 }}>
                {activeQs.map((q, i) => {
                  const filled = answers[q.id];
                  const active = idx === i;
                  return (
                    <ButtonBase
                      key={q.id}
                      onClick={() => setIdx(i)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: "1px solid",
                        borderColor: active ? "primary.main" : "divider",
                        bgcolor: active ? "primary.main" : filled ? "primary.light" : "background.paper",
                        color: active ? "primary.contrastText" : filled ? "primary.main" : "text.secondary",
                      }}
                    >
                      {i + 1}
                    </ButtonBase>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <QuestionView
                question={currentQ}
                number={idx + 1}
                selected={answers[currentQ.id]}
                onSelect={answer}
              />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider" }}
              >
                <Button
                  variant="outlined"
                  onClick={prev}
                  disabled={idx === 0}
                  startIcon={<NiArrowLeft size={16} />}
                >
                  Sebelumnya
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Terjawab: {Object.values(answers).filter(Boolean).length}/{activeQs.length}
                </Typography>
                {idx === activeQs.length - 1 ? (
                  <Button variant="contained" color="warning" onClick={next}>
                    Selesai & Lihat Hasil
                  </Button>
                ) : (
                  <Button variant="contained" onClick={next} endIcon={<NiArrowRight size={16} />}>
                    Berikutnya
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {stage === "result" && (
        <ResultWithHistory
          test={test}
          activeQs={activeQs}
          answers={answers}
          tabSwitches={tabSwitches}
          startedAtIso={startedAtRef.current}
          hideExplanations={hideExplanations}
          isPreview={isPreview}
          onRetry={() => {
            setAnswers({});
            setIdx(0);
            setAttemptQs([]);
            setTabSwitches(0);
            setPaused(false);
            setStage("intro");
          }}
          onBack={() => router.push("/student/quiz")}
        />
      )}

      <Dialog open={resumeOpen} onClose={() => setResumeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <NiRefresh size={18} />
            <span>Lanjutkan Test?</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ada test yang belum selesai. Timer akan melanjutkan dari posisi terakhir.
          </DialogContentText>
          {savedAttempt && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2">
                  Soal terakhir: <strong>#{savedAttempt.idx + 1}/{savedAttempt.attemptQs.length}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sisa waktu: {Math.floor(savedAttempt.timeLeft / 60)}m {savedAttempt.timeLeft % 60}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Terjawab:{" "}
                  {Object.values(savedAttempt.answers).filter(Boolean).length}/
                  {savedAttempt.attemptQs.length}
                </Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              if (test && typeof window !== "undefined") {
                localStorage.removeItem(attemptKey(test.id));
              }
              setSavedAttempt(null);
              setResumeOpen(false);
            }}
          >
            Mulai Baru
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<NiPlay size={16} />}
            onClick={() => {
              if (!savedAttempt) return;
              setAttemptQs(savedAttempt.attemptQs);
              setIdx(savedAttempt.idx);
              setAnswers(savedAttempt.answers);
              setTimeLeft(savedAttempt.timeLeft);
              setTabSwitches(savedAttempt.tabSwitches);
              startedAtRef.current = savedAttempt.startedAt;
              setPaused(true);
              setStage("quiz");
              setResumeOpen(false);
              setSavedAttempt(null);
              enqueueSnackbar("Test dilanjutkan — timer di-pause, klik halaman untuk resume.", {
                variant: "info",
              });
              setTimeout(() => setPaused(false), 500);
            }}
          >
            Lanjutkan
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={exitOpen} onClose={() => setExitOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Keluar dari Test?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hasil akan dihitung berdasarkan soal yang sudah dijawab. Soal yang belum
            dijawab dihitung kosong.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExitOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<NiCrossSquare size={16} />}
            onClick={() => {
              setExitOpen(false);
              setStage("result");
            }}
          >
            Ya, Keluar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function IntroStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={0.75} alignItems="center" color="text.secondary">
          {icon}
          <Typography variant="overline">{label}</Typography>
        </Stack>
        <Typography variant="h6" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ResultWithHistory(props: {
  test: ManagedTest;
  activeQs: Question[];
  answers: Record<string, OptionKey | undefined>;
  tabSwitches: number;
  startedAtIso: string;
  hideExplanations?: boolean;
  isPreview?: boolean;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { test, activeQs, answers, tabSwitches, startedAtIso, onRetry, onBack, hideExplanations, isPreview } = props;
  const recordedRef = useRef(false);
  const { user } = useCurrentUser();

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    if (isPreview) return;
    const correct = activeQs.filter((q) => answers[q.id] === q.correct).length;
    const wrong = activeQs.filter(
      (q) => answers[q.id] && answers[q.id] !== q.correct,
    ).length;
    const unanswered = activeQs.length - correct - wrong;
    const score = Math.round((correct / Math.max(1, activeQs.length)) * 100);
    const duration = Math.max(
      0,
      Math.round((Date.now() - new Date(startedAtIso).getTime()) / 1000),
    );
    recordAttempt({
      testId: test.id,
      testTitle: test.title,
      subject: test.subject,
      studentEmail: user.email ?? "guest@edudoc.id",
      answered: correct + wrong,
      correct,
      wrong,
      unanswered,
      totalQuestions: activeQs.length,
      score,
      passed: score >= test.passingScore,
      durationUsedSec: duration,
      tabSwitches,
      flagged: tabSwitches >= CHEAT_FLAG_THRESHOLD,
      completedAt: new Date().toISOString(),
      cancelled: unanswered === activeQs.length ? false : unanswered > 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScoreResult
      test={{ ...test, questions: activeQs }}
      answers={answers}
      onRetry={onRetry}
      onBack={onBack}
      hideExplanations={hideExplanations}
    />
  );
}
