import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cx } from "../lib/styles";

export function Modal({
  close,
  children,
  className = "",
}: {
  close: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    const items = () =>
      el?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]',
      );
    items()?.[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = items();
      if (!all?.length) return;
      const first = all[0],
        last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el?.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = old;
      el?.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={cx("modal", className)}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Workspace dialog"
      >
        <button
          className="modal-close icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={19} />
        </button>
        {children}
      </div>
    </div>
  );
}
