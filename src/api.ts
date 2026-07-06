import type { Item, Claim, Message, User, DashboardData, ItemFilters, Notification } from "./types";

const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("cr_token");
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: headers(options?.headers as Record<string, string>),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (name: string, email: string, password: string) =>
      request<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>("/me"),
  },

  // ── Items ──────────────────────────────────────────────────────────────────
  items: {
    list: (filters?: Partial<ItemFilters>) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v && v.trim()) params.set(k, v.trim());
        });
      }
      const qs = params.toString();
      return request<Item[]>(`/items${qs ? `?${qs}` : ""}`);
    },
    get: (id: number) => request<Item>(`/items/${id}`),
    create: (data: Partial<Item> & { verification_questions?: any[]; verification_answers?: string[] }) =>
      request<{ id: number }>("/items", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Item>) =>
      request<{ success: boolean }>(`/items/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/items/${id}`, { method: "DELETE" }),
    getClaims: (itemId: number) =>
      request<{ claims: Claim[]; verification_answers: string[] }>(`/items/${itemId}/claims`),
    submitClaim: (itemId: number, submitted_answers: string[], claimant_contact: string) =>
      request<{ id: number }>(`/items/${itemId}/claims`, {
        method: "POST",
        body: JSON.stringify({ submitted_answers, claimant_contact }),
      }),
  },

  // ── Claims ─────────────────────────────────────────────────────────────────
  claims: {
    updateStatus: (claimId: number, status: "approved" | "rejected") =>
      request<{ success: boolean }>(`/claims/${claimId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  // ── Messages ───────────────────────────────────────────────────────────────
  messages: {
    list: (claimId: number) =>
      request<{ messages: Message[]; contact_info: string; item_title: string }>(`/messages/${claimId}`),
    send: (claimId: number, content: string) =>
      request<{ id: number }>(`/messages/${claimId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: {
    get: () => request<DashboardData>("/dashboard"),
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    list: () => request<Notification[]>("/notifications"),
    markAllRead: () => request<{ success: boolean }>("/notifications/read-all", { method: "PATCH" }),
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    items: () => request<Item[]>("/admin/items"),
    users: () => request<User[]>("/admin/users"),
    stats: () =>
      request<{
        totalItems: number;
        activeItems: number;
        resolvedItems: number;
        totalUsers: number;
        totalClaims: number;
        pendingClaims: number;
      }>("/admin/stats"),
    deleteItem: (id: number) =>
      request<{ success: boolean }>(`/admin/items/${id}`, { method: "DELETE" }),
    setRole: (userId: number, role: "user" | "admin") =>
      request<{ success: boolean }>(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
  },
};

export { getToken };
