import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import "./Splash.css";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1500);
    return () => clearTimeout(t);
  }, [navigate]);

  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main className="splash-root">
      <Helmet>
        <title>Doctor Portal Login - Loading</title>
        <meta name="description" content="Loading doctor portal. Redirecting to doctor login." />
        {canonical ? <link rel="canonical" href={canonical} /> : null}
      </Helmet>
      <h1 className="sr-only">Loading Doctor Portal</h1>
      <div className="splash-loader" role="status" aria-live="polite" aria-label="Loading">
        <div className="splash-inner one" aria-hidden="true"></div>
        <div className="splash-inner two" aria-hidden="true"></div>
        <div className="splash-inner three" aria-hidden="true"></div>
      </div>
    </main>
  );
};

export default Splash;
