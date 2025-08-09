import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setName("");
        return;
      }
      const display =
        (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name || user.email || "Doctor";
      if (isMounted) setName(display);
    };
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-14 items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">
          I-Fill-Forms
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{name}</span>
          <Button variant="outline" size="sm" onClick={signOut} aria-label="Sign out">
            <LogOut className="mr-2" /> Sign out
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
