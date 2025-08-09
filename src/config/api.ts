export const DEFAULT_HTTP_BASE = "https://8fc0c45bcfa3.ngrok-free.app";

export function getHttpBase(): string {
  try {
    return localStorage.getItem("API_BASE_URL") || DEFAULT_HTTP_BASE;
  } catch {
    return DEFAULT_HTTP_BASE;
  }
}

export function getWsBase(): string {
  const http = getHttpBase();
  if (http.startsWith("https://")) return "wss://" + http.slice("https://".length);
  if (http.startsWith("http://")) return "ws://" + http.slice("http://".length);
  // if plain host provided
  return "wss://" + http.replace(/^\/*/, "");
}
