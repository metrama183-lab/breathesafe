export const COLORS = {
  bg: "#0A0E1A",
  card: "#141927",
  cardBorder: "#1E2540",
  accent: "#00E5A0",
  accentDim: "#00E5A033",
  danger: "#FF4D6A",
  dangerDim: "#FF4D6A22",
  warning: "#FFB84D",
  warningDim: "#FFB84D22",
  text: "#FFFFFF",
  textSecondary: "#8B93A7",
  textMuted: "#4A5268",
  who: "#00B4D8",
  cigarette: "#FF6B35",
  cigaretteDim: "#FF6B3522",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT = {
  regular: { fontWeight: "400" as const },
  medium: { fontWeight: "500" as const },
  semibold: { fontWeight: "600" as const },
  bold: { fontWeight: "700" as const },
  heavy: { fontWeight: "800" as const },
};
