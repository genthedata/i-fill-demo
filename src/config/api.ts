export const DEFAULT_HTTP_BASE = "https://e71d4db4b0ee.ngrok-free.app";

export function getHttpBase(): string {
  try {
    const w = typeof window !== 'undefined' ? (window as any) : undefined;
    return (w?.BASE_URL as string) || localStorage.getItem("API_BASE_URL") || DEFAULT_HTTP_BASE;
  } catch {
    const w = typeof window !== 'undefined' ? (window as any) : undefined;
    return (w?.BASE_URL as string) || DEFAULT_HTTP_BASE;
  }
}

export function getWsBase(): string {
  const http = getHttpBase();
  if (http.startsWith("https://")) return "wss://" + http.slice("https://".length);
  if (http.startsWith("http://")) return "ws://" + http.slice("http://".length);
  // if plain host provided
  return "wss://" + http.replace(/^\/*/, "");
}
