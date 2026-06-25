// API service stubs — designed to be swapped for axios calls to FastAPI/MongoDB later.
// Each function returns a Promise so call sites already look like real network calls.
import type { LoanApplication, AppStatus, AuthUser } from "./store";

const delay = <T,>(d: T, ms = 350) => new Promise<T>((r) => setTimeout(() => r(d), ms));

export const authApi = {
  login: (email: string, _password: string, name?: string): Promise<AuthUser> =>
    delay({ name: name || email.split("@")[0], email }),
  register: (name: string, email: string, _password: string): Promise<AuthUser> =>
    delay({ name, email }),
};

export const applicationsApi = {
  list: (apps: LoanApplication[]) => delay(apps),
  create: (app: LoanApplication) => delay(app),
  updateStatus: (id: string, status: AppStatus) => delay({ id, status }),
};

// Example axios swap (commented for reference):
// import axios from "axios";
// export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL });
// export const authApi = { login: (email, password) => http.post("/auth/login", { email, password }).then(r => r.data) };
