import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SEO from "@/components/SEO";

const Login = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        window.location.href = "/";
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created. Please check your email if confirmation is required.");
      }
    } catch (err: any) {
      toast.error(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Login – I-Fill-Forms" description="Secure login for doctors to start automated speech-to-form records." />
      <main className="min-h-screen grid place-items-center bg-background">
        <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-semibold">I-Fill-Forms</h1>
          <div className="mb-4 flex items-center justify-center gap-2 text-sm">
            <button
              className={`px-3 py-1 rounded-md ${mode === 'login' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent'}`}
              onClick={() => setMode('login')}
            >Login</button>
            <button
              className={`px-3 py-1 rounded-md ${mode === 'signup' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent'}`}
              onClick={() => setMode('signup')}
            >Sign up</button>
          </div>
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
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </section>
      </main>
    </>
  );
};

export default Login;
