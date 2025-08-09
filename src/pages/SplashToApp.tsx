import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import "./Splash.css";

const SplashToApp = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate("/app", { replace: true });
    }, 1200);
    return () => clearTimeout(t);
  }, [navigate]);

  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main className="splash-root">
      <Helmet>
        <title>Loading Doctor Dashboard</title>
        <meta name="description" content="Loading your doctor dashboard." />
        {canonical ? <link rel="canonical" href={canonical} /> : null}
      </Helmet>
      <h1 className="sr-only">Loading Doctor Dashboard</h1>
      <div className="splash-loader" role="status" aria-live="polite" aria-label="Loading">
        <div className="splash-inner one" aria-hidden="true"></div>
        <div className="splash-inner two" aria-hidden="true"></div>
        <div className="splash-inner three" aria-hidden="true"></div>
      </div>
    </main>
  );
};

export default SplashToApp;
