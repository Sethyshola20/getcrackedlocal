import { ArrowRight, Search } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Empty } from "../shared/ui/Empty";
const Overview = lazy(() =>
  import("../features/overview/OverviewPage").then((module) => ({
    default: module.Overview,
  })),
);
const Library = lazy(() =>
  import("../features/library/LibraryPage").then((module) => ({
    default: module.Library,
  })),
);
const QuestionPage = lazy(() =>
  import("../features/practice/QuestionPage").then((module) => ({
    default: module.QuestionPage,
  })),
);
const Paths = lazy(() =>
  import("../features/paths/PathsPage").then((module) => ({
    default: module.Paths,
  })),
);
const PathDetail = lazy(() =>
  import("../features/paths/PathDetailPage").then((module) => ({
    default: module.PathDetail,
  })),
);
const ProgressPage = lazy(() =>
  import("../features/progress/ProgressPage").then((module) => ({
    default: module.ProgressPage,
  })),
);
const Courses = lazy(() =>
  import("../features/courses/CoursesPage").then((module) => ({
    default: module.Courses,
  })),
);
const SessionComplete = lazy(() =>
  import("../features/sessions/SessionCompletePage").then((module) => ({
    default: module.SessionComplete,
  })),
);
const SettingsPage = lazy(() =>
  import("../features/settings/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

export function AppRoutes() {
  const location = useLocation();
  return (
    <Suspense
      fallback={
        <div className="question-loading" role="status">
          Opening your workspace…
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/questions" element={<Library />} />
        <Route
          path="/questions/:id"
          element={<QuestionPage key={location.pathname + location.search} />}
        />
        <Route path="/paths" element={<Paths />} />
        <Route path="/paths/:id" element={<PathDetail />} />
        <Route path="/review" element={<Library mode="review" />} />
        <Route path="/saved" element={<Library mode="saved" />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<Courses />} />
        <Route path="/session/complete" element={<SessionComplete />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={
            <Empty
              icon={Search}
              title="Nothing at this address."
              description="Head back to your workspace and pick up something interesting."
              action={
                <Link className="button" to="/">
                  Back to overview <ArrowRight size={16} />
                </Link>
              }
            />
          }
        />
      </Routes>
    </Suspense>
  );
}
