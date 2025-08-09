import SEO from "@/components/SEO";

export default function SettingsInfo() {
  return (
    <>
      <SEO title="Settings – I-Fill-Forms" description="Configure backend URL for I-Fill-Forms" />
      <main className="container py-10">
        <h1 className="text-2xl font-semibold">Backend Connection</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This build is connected to the backend at <code>https://8fc0c45bcfa3.ngrok-free.app</code>.
          To override locally, open the browser console and run:
        </p>
        <pre className="mt-4 rounded-md border bg-muted/30 p-3 text-sm">
{`localStorage.setItem('API_BASE_URL', 'https://your-ngrok-or-domain');
location.reload();`}
        </pre>
      </main>
    </>
  );
}
