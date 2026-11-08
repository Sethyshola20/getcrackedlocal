import { api } from "../../shared/api/client";
type Credentials = {
  email: string;
  password: string;
  name?: string;
  timezone?: string;
};
export const authApi = {
  authenticate: (mode: "login" | "register", input: Credentials) =>
    api("/auth/" + mode, { method: "POST", body: JSON.stringify(input) }),
  logout: () => api("/auth/logout", { method: "POST" }),
};
