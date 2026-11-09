import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  GitBranch,
  PanelTop,
  Plus,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { topicIcon } from "../../entities/curriculum/presentation";
import { useWorkspace } from "../../features/workspace/WorkspaceProvider";
import { cx } from "../../shared/lib/styles";
import { useOverlays } from "../../shared/state/OverlayProvider";
import { Logo } from "../../shared/ui/Logo";

export function Sidebar({ mobile }: { mobile: boolean }) {
  const { data } = useWorkspace();
  const { session } = useOverlays();
  const location = useLocation();
  return (
    <aside className={cx("sidebar", mobile && "mobile-open")}>
      <Logo />
      <div className="workspace-switch">
        <span className="workspace-avatar">
          {data.user ? data.user.name[0].toUpperCase() : "Y"}
        </span>
        <span>
          <strong>
            {data.user
              ? `${data.user.name.split(" ")[0]}'s workspace`
              : "Your workspace"}
          </strong>
          <small>Personal learning space</small>
        </span>
        <ChevronDown size={14} />
      </div>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        <NavLink end to="/">
          <PanelTop size={17} />
          Overview
        </NavLink>
        <NavLink to="/questions">
          <BookOpen size={17} />
          Question library
          <span className="nav-count">{data.questions.length}</span>
        </NavLink>
        <NavLink to="/paths">
          <GitBranch size={17} />
          Learning paths
        </NavLink>
        <NavLink to="/courses">
          <BookOpen size={17} />
          Courses
        </NavLink>
        <NavLink to="/review">
          <RotateCcw size={17} />
          Review queue
          {data.stats.due > 0 && (
            <span className="nav-count green">{data.stats.due}</span>
          )}
        </NavLink>
        <NavLink to="/saved">
          <Bookmark size={17} />
          Saved questions
        </NavLink>
        <NavLink to="/progress">
          <ChartNoAxesCombined size={17} />
          My progress
        </NavLink>
      </nav>
      <div className="nav-caption topics-caption">
        YOUR TOPICS
        <Link to="/questions" aria-label="Explore all topics">
          <Plus size={14} />
        </Link>
      </div>
      <nav className="topics-nav" aria-label="Topic navigation">
        {data.topics.slice(0, 7).map((t) => {
          const Icon = topicIcon[t.id];
          return (
            <Link
              key={t.id}
              to={`/questions?topic=${t.id}`}
              className={
                new URLSearchParams(location.search).get("topic") === t.id
                  ? "selected"
                  : ""
              }
            >
              <Icon size={15} style={{ color: t.color }} />
              <span>{t.name}</span>
              <span className="topic-nav-count"></span>
            </Link>
          );
        })}
        <Link to="/questions?view=topics" className="all-topics">
          View all 12 topics <ArrowRight size={13} />
        </Link>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="tiny-spark">✳</span>
          <strong>Understanding compounds.</strong>
          <p>A little practice. A deeper perspective.</p>
          <button onClick={() => session()}>
            Make time for a session <ArrowUpRight size={14} />
          </button>
        </div>
        <NavLink to="/settings" className="settings-link">
          <Settings2 size={16} />
          Settings<span className="version">v1.0</span>
        </NavLink>
        <div className="sidebar-foot">
          <span className="online-dot" />
          Your curiosity, no ceiling.
        </div>
      </div>
    </aside>
  );
}
