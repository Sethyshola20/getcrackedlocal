import { ArrowUpRight, Layers3, Menu, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useWorkspace } from "../../features/workspace/WorkspaceProvider";
import { useOverlays } from "../../shared/state/OverlayProvider";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { data } = useWorkspace();
  const { auth, openSearch } = useOverlays();
  const location = useLocation();
  const currentTitle = location.pathname.startsWith("/courses")
    ? "Courses"
    : location.pathname === "/session/complete"
      ? "Session complete"
      : location.pathname.startsWith("/questions/")
        ? "Question workspace"
        : location.pathname === "/questions"
          ? "Question library"
          : location.pathname.startsWith("/paths")
            ? "Learning paths"
            : location.pathname === "/review"
              ? "Review queue"
              : location.pathname === "/saved"
                ? "Saved questions"
                : location.pathname === "/progress"
                  ? "Your progress"
                  : location.pathname === "/settings"
                    ? "Settings"
                    : "Overview";
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          className="icon-button mobile-menu"
          aria-label="Open navigation"
          onClick={() => onMenu()}
        >
          <Menu size={20} />
        </button>
        <Layers3 size={15} />
        <span>Workspace</span>
        <span className="slash">/</span>
        <strong>{currentTitle}</strong>
      </div>
      <div className="top-actions">
        <button
          className="search-trigger"
          onClick={() => openSearch()}
          aria-label="Search questions"
        >
          <Search size={15} />
          <span>Search anything...</span>
          <kbd>⌘ K</kbd>
        </button>
        <span className="top-divider" />
        {data.user ? (
          <Link
            to="/settings"
            className="user-avatar"
            aria-label="Account settings"
          >
            {data.user.name[0].toUpperCase()}
          </Link>
        ) : (
          <button className="sign-in" onClick={() => auth()}>
            Sign in <ArrowUpRight size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
