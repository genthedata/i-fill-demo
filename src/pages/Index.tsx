import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import SignatureEffect from "@/components/SignatureEffect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Download } from "lucide-react";
import { useMedicalSession } from "@/hooks/useMedicalSession";
import { toast } from "sonner";
import { getHttpBase } from "@/config/api";

const Index = () => {
  const [patientName, setPatientName] = useState("");
  const [token] = useState<string | undefined>(undefined);
  const [doctorName] = useState<string | undefined>("Dr. John Smith");
  const [httpStatus, setHttpStatus] = useState<'idle' | 'ok' | 'fail'>("idle");
  const [pinging, setPinging] = useState(false);

  const { sessionId, isRecording, transcript, fields, error, wsStatus, start, stop } = useMedicalSession();

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [transcript.length]);


  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const canStart = useMemo(() => !!patientName && !isRecording, [patientName, isRecording]);

  const handleStart = async () => {
    if (!patientName) {
      toast.error("Please enter a patient name first.");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone permission is required.");
      return;
    }
    try {
      await start({ patientName, token, doctorName });
    } catch (e: any) {
      toast.error(e?.message || "Failed to start session");
    }
  };

  const handleStop = () => {
    stop();
  };

  const pingApi = async () => {
    setPinging(true);
    try {
      const base = getHttpBase();
      const res = await fetch(`${base}/api/export/__ping__/csv`, {
        headers: { "ngrok-skip-browser-warning": "1" },
      });
      if (res.ok || (res.status >= 200 && res.status < 500)) {
        setHttpStatus('ok');
        toast.success('API reachable');
      } else {
        setHttpStatus('fail');
        toast.error(`API responded with ${res.status}`);
      }
    } catch {
      setHttpStatus('fail');
      toast.error('API unreachable');
    } finally {
      setPinging(false);
    }
  };

  const downloadCsv = async () => {
    if (!sessionId) return;
    try {
      const base = getHttpBase();
      const res = await fetch(`${base}/api/export/${encodeURIComponent(sessionId)}/csv`, {
        headers: { "ngrok-skip-browser-warning": "1" },
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${patientName || 'record'}-${sessionId}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('CSV downloaded');
    } catch (e: any) {
      toast.error(e?.message || 'Export failed');
    }
  };

  return (
    <>
      <SEO title="I-Fill-Forms – Automated Speech-to-Form EMR" description="Real-time speech-to-form medical records. Start recording, watch fields fill themselves, export to CSV." />
      <Navbar doctorName={doctorName} />
      <main className="container py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Automated Speech-to-Form Medical Records</h1>
          <SignatureEffect />
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={httpStatus === 'ok' ? 'default' : httpStatus === 'fail' ? 'destructive' : 'secondary'}>
            API: {httpStatus === 'ok' ? 'Reachable' : httpStatus === 'fail' ? 'Unreachable' : 'Idle'}
          </Badge>
          <Badge variant={wsStatus === 'connected' ? 'default' : wsStatus === 'connecting' ? 'secondary' : 'destructive'}>
            WS: {wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
          </Badge>
          <Button size="sm" variant="outline" onClick={pingApi} disabled={pinging}>
            Ping API
          </Button>
        </div>

        <section className="mb-6 grid gap-2">
          <Label htmlFor="patientName">Patient Name</Label>
          <Input id="patientName" placeholder="e.g., Jane Doe" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
        </section>

        <section className="mb-8 flex items-center gap-4">
          {!isRecording ? (
            <Button id="startStopBtn" variant="record" size="xl" onClick={handleStart} disabled={!canStart} aria-label="Start recording">
              <Mic /> Start Recording
            </Button>
          ) : (
            <Button id="startStopBtn" variant="recording" size="xl" onClick={handleStop} aria-label="Stop recording">
              <Square /> Stop Recording
            </Button>
          )}
          {sessionId && (
            <Button id="downloadBtn" variant="outline" onClick={downloadCsv} aria-label="Download CSV">
              <Download className="mr-2" /> Download CSV
            </Button>
          )}
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="rounded-lg border p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-medium">Live Transcription</h2>
            <ScrollArea className="h-72 rounded-md border bg-muted/20">
              <div ref={listRef} id="transcription" className="h-72 overflow-y-auto p-3">
                {transcript.length === 0 && (
                  <p className="text-sm text-muted-foreground">Waiting for audio…</p>
                )}
                {transcript.map((t) => (
                  <p key={t.id} className="text-sm leading-6">
                    {t.text}
                  </p>
                ))}
              </div>
            </ScrollArea>
            {sessionId && (
              <p className="mt-2 text-xs text-muted-foreground">Session: {sessionId}</p>
            )}
          </section>

          <section className="rounded-lg border p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-medium">Auto-filled Medical Record</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Symptoms</Label>
                <Textarea id="symptoms" value={fields.symptoms} readOnly className="min-h-24" />
              </div>
              <div className="grid gap-2">
                <Label>Drug / Medication to Consume</Label>
                <Input id="medication" value={fields.medications} readOnly />
              </div>
              <div className="grid gap-2">
                <Label>Doctor’s Conclusion & Instructions</Label>
                <Textarea id="conclusion" value={fields.conclusion} readOnly className="min-h-24" />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default Index;
