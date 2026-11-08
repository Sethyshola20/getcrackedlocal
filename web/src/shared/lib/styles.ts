import type { CSSProperties } from "react";

export const cx = (...v: (string | false | null | undefined)[]) =>
  v.filter(Boolean).join(" ");
export const color = (value: string) =>
  ({ "--accent": value }) as CSSProperties;
