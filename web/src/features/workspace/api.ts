import { api } from "../../shared/api/client";
import type { Bootstrap } from "./model";
export const workspaceApi = { load: () => api<Bootstrap>("/bootstrap") };
