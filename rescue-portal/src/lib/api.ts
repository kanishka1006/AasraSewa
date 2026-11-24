/** API base for same-laptop or shared Summar LAN demos. */
export function apiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.hostname && window.location.hostname !== "localhost") {
    return `http://${window.location.hostname}:3001`;
  }
  return "http://127.0.0.1:3001";
}

export function apiUrl(path = ""): string {
  const p = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${apiBase()}${p}`;
}

export type SessionUser = {
  id?: string;
  fullName?: string;
  role?: string;
};

export function saveSession(data: {
  accessToken?: string;
  refreshToken?: string;
  user?: SessionUser;
}) {
  if (typeof window === "undefined") return;
  if (data.accessToken) localStorage.setItem("token", data.accessToken);
  if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers });
  if (response.status !== 401 || typeof window === "undefined") return response;

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return response;
  const refresh = await fetch(apiUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!refresh.ok) return response;
  const data = (await refresh.json()) as { accessToken?: string; refreshToken?: string; user?: SessionUser };
  if (!data.accessToken) return response;
  saveSession(data);
  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${data.accessToken}`);
  return fetch(input, { ...init, headers: retryHeaders });
}
