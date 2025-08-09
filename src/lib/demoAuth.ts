export const DEMO_USER = {
  email: "doctor@demo.com",
  password: "demo123",
  name: "Dr. Demo",
};

const KEY = "DEMO_SESSION";

type DemoSession = {
  email: string;
  name: string;
  ts: number;
};

export function getSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string) {
  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    const session: DemoSession = {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      ts: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(session));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("demo-auth-change"));
    }
    return;
  }
  throw new Error("Invalid credentials. Use doctor@demo.com / demo123");
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("demo-auth-change"));
}

export function onAuthChange(
  handler: (session: DemoSession | null) => void
) {
  if (typeof window === "undefined") return () => {};
  const storageHandler = (e: StorageEvent) => {
    if (e.key === KEY) handler(getSession());
  };
  const customHandler = () => handler(getSession());
  window.addEventListener("storage", storageHandler);
  window.addEventListener("demo-auth-change", customHandler as EventListener);
  return () => {
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener(
      "demo-auth-change",
      customHandler as EventListener
    );
  };
}
