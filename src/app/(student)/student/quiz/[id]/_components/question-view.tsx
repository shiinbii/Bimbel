"use client";

import { Box, ButtonBase, Stack, Typography } from "@mui/material";

import NiCheck from "@/icons/nexture/ni-check";
import type { Question } from "@/lib/types";

interface Props {
  question: Question;
  selected?: "A" | "B" | "C" | "D";
  onSelect: (k: "A" | "B" | "C" | "D") => void;
  number: number;
}

export default function QuestionView({ question, selected, onSelect, number }: Props) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.light",
            color: "primary.main",
            fontWeight: 600,
          }}
        >
          {number}
        </Box>
        <Typography variant="overline" color="text.secondary">
          Soal #{number}
        </Typography>
      </Stack>

      <Typography variant="h6" sx={{ lineHeight: 1.5 }}>
        {question.text}
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {question.options.map((o) => {
          const isSelected = selected === o.key;
          return (
            <ButtonBase
              key={o.key}
              onClick={() => onSelect(o.key)}
              sx={{
                justifyContent: "flex-start",
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: isSelected ? "primary.main" : "divider",
                bgcolor: isSelected ? "primary.light" : "background.paper",
                textAlign: "left",
                transition: "all 0.15s",
                "&:hover": {
                  borderColor: "primary.main",
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    bgcolor: isSelected ? "primary.main" : "action.hover",
                    color: isSelected ? "primary.contrastText" : "text.primary",
                    fontWeight: 600,
                  }}
                >
                  {o.key}
                </Box>
                <Typography variant="body1" sx={{ flex: 1 }}>
                  {o.text}
                </Typography>
                {isSelected && <NiCheck size={16} />}
              </Stack>
            </ButtonBase>
          );
        })}
      </Stack>
    </Box>
  );
}
