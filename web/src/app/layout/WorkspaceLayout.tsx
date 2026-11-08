import { Layers3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppRoutes } from "../AppRoutes";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function WorkspaceLayout() {
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobile(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <Sidebar mobile={mobile} />
      <div className="workspace-main">
        <Topbar onMenu={() => setMobile(true)} />
        <main className="page">
          <AppRoutes />
        </main>
        <footer className="page-footer">
          <span>Built for understanding. Not just remembering.</span>
          <span>
            Go a level deeper <Layers3 size={13} />
          </span>
        </footer>
      </div>
    </div>
  );
}
