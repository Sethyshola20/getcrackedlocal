import type { Course } from "../../entities/curriculum/model";
import { api } from "../../shared/api/client";
export const coursesApi = {
  course: (id: string, signal?: AbortSignal) =>
    api<Course>("/courses/" + encodeURIComponent(id), { signal }),
  complete: (id: string, completed: boolean) =>
    api("/lessons/" + encodeURIComponent(id) + "/progress", {
      method: "PUT",
      body: JSON.stringify({ completed }),
    }),
};
