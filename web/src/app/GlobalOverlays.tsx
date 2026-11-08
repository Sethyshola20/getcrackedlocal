import { Check, X } from "lucide-react";
import { AuthModal } from "../features/auth/AuthModal";
import { SearchModal } from "../features/search/SearchModal";
import { SessionModal } from "../features/sessions/SessionModal";
import { useOverlays } from "../shared/state/OverlayProvider";

export function GlobalOverlays() {
  const { dialog, closeDialog, message, dismissToast } = useOverlays();
  return (
    <>
      {dialog?.kind === "auth" && <AuthModal close={closeDialog} />}
      {dialog?.kind === "search" && <SearchModal close={closeDialog} />}
      {dialog?.kind === "session" && (
        <SessionModal initialTopic={dialog.topic} close={closeDialog} />
      )}
      {message && (
        <div role="status" className="toast">
          <Check size={16} />
          {message}
          <button aria-label="Dismiss notification" onClick={dismissToast}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
