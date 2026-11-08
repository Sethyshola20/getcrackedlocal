import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
type Dialog =
  | { kind: "auth" }
  | { kind: "search" }
  | { kind: "session"; topic: string }
  | null;
type Overlays = {
  dialog: Dialog;
  message: string;
  auth: () => void;
  openSearch: () => void;
  session: (topic?: string) => void;
  toast: (message: string) => void;
  closeDialog: () => void;
  dismissToast: () => void;
};
const Context = createContext<Overlays | null>(null);
export function useOverlays() {
  const value = useContext(Context);
  if (!value) throw new Error("useOverlays requires OverlayProvider");
  return value;
}
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<Dialog>(null),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setDialog((current) =>
          current?.kind === "search" ? null : { kind: "search" },
        );
      }
      if (e.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <Context.Provider
      value={{
        dialog,
        message,
        auth: () => setDialog({ kind: "auth" }),
        openSearch: () => setDialog({ kind: "search" }),
        session: (topic = "") => setDialog({ kind: "session", topic }),
        toast: setMessage,
        closeDialog: () => setDialog(null),
        dismissToast: () => setMessage(""),
      }}
    >
      {children}
    </Context.Provider>
  );
}
