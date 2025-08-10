import { Helmet } from "react-helmet-async";

export default function SEO({
  title = "Noted, Doctor – Automated Speech-to-Form EMR",
  description = "Clean, automated medical record creation from live conversation. No typing—just talk.",
}: {
  title?: string;
  description?: string;
}) {
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
