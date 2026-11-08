import { ArrowLeft, ArrowRight, BookOpen, Check, Clock } from "lucide-react";
import Markdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import type { Course } from "../../entities/curriculum/model";
import { useWorkspace } from "../workspace/WorkspaceProvider";
import { useCourse } from "./useCourse";

const lessonUrl = (course: Course, lessonId: string) =>
  `/courses/${encodeURIComponent(course.id)}?lesson=${encodeURIComponent(lessonId)}`;
const duration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}m` : ""}` : `${rest}m`;
};

function CourseProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  return (
    <div className="course-progress">
      <span>
        {completed} of {total} lessons complete
      </span>
      <progress aria-label="Course completion" value={completed} max={total} />
    </div>
  );
}

export function Courses() {
  const { data } = useWorkspace();
  const { id } = useParams();
  const { course, index, error, lesson, lessonId, complete, saving } =
    useCourse(id);
  const isComplete = (lessonId: string) =>
    Boolean(data.lessonProgress[lessonId]?.completed);
  if (!id)
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">FOUNDATION TO EXPERT</div>
            <h1>Build the mental model.</h1>
            <p>
              Structured courses with worked examples, practical exercises, and
              a capstone for every topic.
            </p>
          </div>
        </div>
        <div className="all-topic-grid">
          {data.courses.map((c) => {
            const completed = c.lessons.filter((l) => isComplete(l.id)).length;
            return (
              <Link
                className="topic-card curriculum-card"
                to={`/courses/${c.id}`}
                key={c.id}
              >
                <BookOpen size={24} />
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <div className="course-card-meta">
                  <span>
                    {c.modules.length} modules · {c.lessons.length} lessons
                  </span>
                  <span>
                    <Clock size={12} />{" "}
                    {duration(c.lessons.reduce((sum, l) => sum + l.minutes, 0))}{" "}
                    estimated study
                  </span>
                </div>
                <CourseProgress
                  completed={completed}
                  total={c.lessons.length}
                />
                <div className="topic-card-foot">
                  <span>
                    {completed === c.lessons.length
                      ? "Revisit curriculum"
                      : completed
                        ? "Continue learning"
                        : "Explore curriculum"}
                  </span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </>
    );
  if (!course)
    return (
      <div className="course-load-state">
        <Link className="back-link" to="/courses">
          ← All courses
        </Link>
        <p role={error ? "alert" : "status"}>
          {error || "Opening the course…"}
        </p>
      </div>
    );
  const completed = course.lessons.filter((l) => isComplete(l.id)).length;
  const next =
    course.lessons.find((l) => !isComplete(l.id)) ?? course.lessons[0];
  const overviewUrl = `/courses/${encodeURIComponent(course.id)}`;
  if (lessonId && !lesson)
    return (
      <div className="course-load-state">
        <Link className="back-link" to={overviewUrl}>
          ← Course overview
        </Link>
        <p role="alert">
          This lesson isn’t in this course. Choose a lesson from the curriculum.
        </p>
      </div>
    );
  if (!lesson)
    return (
      <>
        <Link className="back-link" to="/courses">
          ← All courses
        </Link>
        <div className="page-heading course-heading">
          <div>
            <div className="eyebrow">
              {course.modules.length} STAGES · FOUNDATION TO EXPERT
            </div>
            <h1>{course.title}</h1>
            <p>{course.description}</p>
            <div className="course-overview-meta">
              <span>{course.lessons.length} lessons</span>
              <span>
                {duration(
                  course.lessons.reduce((sum, l) => sum + l.minutes, 0),
                )}{" "}
                estimated study, including exercises
              </span>
              <span>Self-paced · capstone project</span>
            </div>
          </div>
        </div>
        <div className="course-start">
          <CourseProgress completed={completed} total={course.lessons.length} />
          <Link className="button" to={lessonUrl(course, next.id)}>
            {completed === course.lessons.length
              ? "Revisit first lesson"
              : completed
                ? "Continue learning"
                : "Start course"}{" "}
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="course-foundations">
          <section>
            <h2>Before you begin</h2>
            <ul>
              {course.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            {!data.user && (
              <p>Explore every lesson freely. Sign in to save completion.</p>
            )}
          </section>
          <section>
            <h2>What you’ll be able to do</h2>
            <ul>
              {course.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>
        </div>
        <div className="course-syllabus">
          <h2>Your curriculum</h2>
          <p>
            Work through the stages in order, or revisit any lesson. Complete
            exercises locally and use the review criteria before marking a
            lesson complete.
          </p>
          {course.modules.map((m, mi) => {
            const lessons = course.lessons.filter((l) => l.moduleId === m.id);
            const done = lessons.filter((l) => isComplete(l.id)).length;
            return (
              <section className="course-module" key={m.id}>
                <div className="course-module-header">
                  <div>
                    <div className="eyebrow">
                      STAGE {mi + 1} · {m.level.toUpperCase()}
                    </div>
                    <h3>{m.title}</h3>
                    <p>{m.description}</p>
                  </div>
                  <span>
                    {done}/{lessons.length} complete
                  </span>
                </div>
                <ol className="course-lesson-list">
                  {lessons.map((l) => (
                    <li key={l.id}>
                      <Link to={lessonUrl(course, l.id)}>
                        <span
                          className="course-lesson-number"
                          aria-label={
                            isComplete(l.id) ? "Completed" : undefined
                          }
                        >
                          {isComplete(l.id) ? (
                            <Check size={16} />
                          ) : (
                            String(course.lessons.indexOf(l) + 1).padStart(
                              2,
                              "0",
                            )
                          )}
                        </span>
                        <span className="course-lesson-description">
                          <strong>{l.title}</strong>
                          <span>{l.summary}</span>
                        </span>
                        <span className="course-lesson-meta">
                          {l.kind} · {l.minutes} min
                        </span>
                        <ArrowRight size={14} />
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
        <Link className="text-link" to={`/questions?topic=${course.topic}`}>
          Browse topic practice <ArrowRight size={14} />
        </Link>
      </>
    );
  const module = course.modules.find((m) => m.id === lesson.moduleId);
  return (
    <>
      <Link className="back-link" to={overviewUrl}>
        ← Course overview
      </Link>
      <div className="page-heading course-heading">
        <div>
          <div className="eyebrow">
            {module?.level.toUpperCase()} · {lesson.kind.toUpperCase()}
          </div>
          <h1>{lesson.title}</h1>
          <p>
            Lesson {index + 1} of {course.lessons.length} · {lesson.minutes} min
            estimated study
          </p>
        </div>
      </div>
      <div className="course-layout">
        <nav className="course-chapters" aria-label="Course curriculum">
          <Link className="course-nav-overview" to={overviewUrl}>
            {course.title}
          </Link>
          <CourseProgress completed={completed} total={course.lessons.length} />
          {course.modules.map((m, mi) => (
            <div className="course-nav-module" key={m.id}>
              <h2>
                {mi + 1}. {m.title}
                <span>{m.level}</span>
              </h2>
              {course.lessons
                .filter((l) => l.moduleId === m.id)
                .map((l) => (
                  <Link
                    key={l.id}
                    to={lessonUrl(course, l.id)}
                    aria-current={l.id === lesson.id ? "page" : undefined}
                  >
                    <span
                      className="course-nav-number"
                      aria-label={isComplete(l.id) ? "Completed" : undefined}
                    >
                      {isComplete(l.id) ? (
                        <Check size={13} />
                      ) : (
                        String(course.lessons.indexOf(l) + 1).padStart(2, "0")
                      )}
                    </span>
                    {l.title}
                  </Link>
                ))}
            </div>
          ))}
        </nav>
        <article className="course-article">
          <section className="course-objectives" aria-label="Lesson objectives">
            <h2>In this lesson</h2>
            <ul>
              {lesson.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>
          <div className="markdown course-reading">
            <Markdown>{lesson.body}</Markdown>
          </div>
          {lesson.questionIds.length > 0 && (
            <section className="course-practice">
              <h2>Put it into practice</h2>
              <p>
                Use these questions to check the concepts and explore related
                cases.
              </p>
              {lesson.questionIds.map((qid) => (
                <Link
                  className="text-link"
                  key={qid}
                  to={`/questions/${encodeURIComponent(qid)}`}
                >
                  {data.questions.find((q) => q.id === qid)?.title ??
                    "Open practice question"}{" "}
                  <ArrowRight size={14} />
                </Link>
              ))}
            </section>
          )}
          <div className="course-actions">
            <button
              className="button secondary"
              onClick={complete}
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : isComplete(lesson.id)
                  ? "Mark incomplete"
                  : "Mark lesson complete"}
            </button>
            {isComplete(lesson.id) && (
              <span className="course-completed">
                <Check size={15} /> Completed
              </span>
            )}
          </div>
          <p className="course-assessment-note">
            Completion is your own reflection on the lesson and exercise.
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="course-pagination">
            {index > 0 && (
              <Link
                className="text-link"
                to={lessonUrl(course, course.lessons[index - 1].id)}
              >
                <ArrowLeft size={14} /> Previous lesson
              </Link>
            )}
            {index < course.lessons.length - 1 ? (
              <Link
                className="text-link"
                to={lessonUrl(course, course.lessons[index + 1].id)}
              >
                Next lesson <ArrowRight size={14} />
              </Link>
            ) : (
              <Link className="text-link" to={overviewUrl}>
                Review course progress <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </article>
      </div>
    </>
  );
}
