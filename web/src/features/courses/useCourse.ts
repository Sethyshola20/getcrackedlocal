import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Course } from "../../entities/curriculum/model";
import { useOverlays } from "../../shared/state/OverlayProvider";
import { useWorkspace } from "../workspace/WorkspaceProvider";
import { coursesApi } from "./api";

export function useCourse(id: string | undefined) {
  const { data, refresh } = useWorkspace();
  const { auth, toast } = useOverlays();
  const [params] = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const lessonId = params.get("lesson");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setError("");
    setCourse(null);
    if (id)
      coursesApi
        .course(id, controller.signal)
        .then((value) => {
          if (active) setCourse(value);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, lessonId]);
  // Ignore the previous course during route transitions, before the effect runs.
  const current = course?.id === id ? course : null;
  const index = current?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const lesson = current?.lessons[index];
  async function complete() {
    if (!data.user) {
      auth();
      return;
    }
    if (!lesson || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await coursesApi.complete(
        lesson.id,
        !data.lessonProgress[lesson.id]?.completed,
      );
      await refresh();
      toast("Lesson progress saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  return { course: current, index, error, lesson, lessonId, complete, saving };
}
