import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { login, DEMO_USER } from "@/lib/demoAuth";

const Login = () => {
  const [email, setEmail] = useState(DEMO_USER.email);
  const [password, setPassword] = useState(DEMO_USER.password);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome, doctor");
      window.location.href = "/splash-app";
    } catch (err: any) {
      toast.error(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Login – I-Fill-Forms" description="Demo login for doctors to start automated speech-to-form records." />
      <main className="min-h-screen grid place-items-center bg-background">
        <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-semibold">I-Fill-Forms</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Use demo credentials: {DEMO_USER.email} / {DEMO_USER.password}
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading} variant="success">
              {loading ? "Please wait…" : "Sign in"}
            </Button>
          </form>
        </section>
      </main>
    </>
  );
};

export default Login;
