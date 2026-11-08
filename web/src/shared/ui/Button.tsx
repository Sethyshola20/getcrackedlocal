import type { ReactNode } from "react";
import { cx } from "../lib/styles";

export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx("button", secondary && "secondary", className)}
    >
      {children}
    </button>
  );
}
