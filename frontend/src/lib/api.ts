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
