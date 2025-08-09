import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHttpBase } from "@/config/api";
import { toast } from "sonner";

type Props = {
  wsStatus?: string;
};

export default function SettingsSheet({ wsStatus = "disconnected" }: Props) {
  const [apiBase, setApiBase] = useState(getHttpBase());
  const [httpStatus, setHttpStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [pinging, setPinging] = useState(false);

  const pingApi = async () => {
    setPinging(true);
    try {
      const base = getHttpBase();
      const res = await fetch(`${base}/api/export/__ping__/csv`, {
        headers: { "ngrok-skip-browser-warning": "1" },
      });
      if (res.ok || (res.status >= 200 && res.status < 500)) {
        setHttpStatus("ok");
        toast.success("API reachable");
      } else {
        setHttpStatus("fail");
        toast.error(`API responded with ${res.status}`);
      }
    } catch {
      setHttpStatus("fail");
      toast.error("API unreachable");
    } finally {
      setPinging(false);
    }
  };

  const saveApiBase = async () => {
    const val = apiBase.trim();
    if (!val) {
      toast.error("Enter a valid API base URL");
      return;
    }
    try {
      localStorage.setItem("API_BASE_URL", val);
      (window as any).BASE_URL = val;
      setHttpStatus("idle");
      toast.success("API base saved");
      await pingApi();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save API base");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" aria-label="Open settings">Settings</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={httpStatus === "ok" ? "default" : httpStatus === "fail" ? "destructive" : "secondary"}>
              API: {httpStatus === "ok" ? "Reachable" : httpStatus === "fail" ? "Unreachable" : "Idle"}
            </Badge>
            <Badge variant={wsStatus === "connected" ? "default" : wsStatus === "connecting" ? "secondary" : "destructive"}>
              WS: {wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
            </Badge>
            <Button size="sm" variant="outline" onClick={pingApi} disabled={pinging}>
              Ping API
            </Button>
          </div>

          <section className="grid gap-2">
            <Label htmlFor="apiBaseInput">API Base URL</Label>
            <div className="flex items-center gap-3">
              <Input
                id="apiBaseInput"
                placeholder="https://your-api.example.com"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
              />
              <Button size="sm" variant="secondary" onClick={saveApiBase} aria-label="Save API base" disabled={pinging}>
                Save & Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Current: {getHttpBase()}</p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
