const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cashier";
}

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "Login failed");
    return json.data as { token: string; user: AuthUser };
  },

  saveToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      // Cookie bhi set karo — middleware isko read karta hai
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  },

  removeToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      // Cookie bhi clear karo
      document.cookie = "token=; path=/; max-age=0";
    }
  },
};
