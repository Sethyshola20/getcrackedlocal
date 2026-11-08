import { api } from "../../shared/api/client";
export const settingsApi = {
  save: (preferences: { name: string; goal: number; timezone: string }) =>
    api("/settings", { method: "PATCH", body: JSON.stringify(preferences) }),
};
