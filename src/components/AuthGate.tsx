import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSession, onAuthChange } from "@/lib/demoAuth";

const AuthGate = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = () => {
      const sess = getSession();
      if (!mounted) return;
      setAuthed(!!sess);
      setLoading(false);
    };
    init();
    const unsubscribe = onAuthChange((sess) => {
      setAuthed(!!sess);
    });
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  if (loading) return null;
  if (!authed) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default AuthGate;
