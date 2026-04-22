import { Box, Typography } from "@mui/material";

export default function EduDocLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const fontSize = size === "lg" ? "2.5rem" : size === "sm" ? "1.25rem" : "1.75rem";
  return (
    <Box className="flex items-center gap-2">
      <Box
        className="flex items-center justify-center rounded-xl"
        sx={{
          width: size === "lg" ? 48 : size === "sm" ? 28 : 36,
          height: size === "lg" ? 48 : size === "sm" ? 28 : 36,
          background:
            "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent-3)) 100%)",
          color: "hsl(var(--text-contrast))",
          fontWeight: 700,
          fontSize: size === "lg" ? "1.5rem" : "1rem",
        }}
      >
        E
      </Box>
      <Typography
        component="span"
        sx={{
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "hsl(var(--text-primary))",
        }}
      >
        EduDoc
      </Typography>
    </Box>
  );
}
