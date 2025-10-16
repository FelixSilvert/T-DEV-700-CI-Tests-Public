const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export const routes = {
  auth: {
    login: `${API_BASE}/auth/login`,
  },
};