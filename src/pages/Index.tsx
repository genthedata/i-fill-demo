import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import SignatureEffect from "@/components/SignatureEffect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Download } from "lucide-react";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { useUpdates } from "@/hooks/useUpdates";
import { toast } from "sonner";
import { getHttpBase } from "@/config/api";


const Index = () => {
  const [patientName, setPatientName] = useState("");
  const [token] = useState<string | undefined>(undefined);
  const [doctorName] = useState<string | undefined>("Dr. Demo");

  const { sessionId, isRecording, transcript, error, start, stop } = useVoiceSession();
  const fields = useUpdates(sessionId, token);

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
    await start({ patientName, token, doctorName });
  };

  const handleStop = () => {
    stop();
  };

  const downloadCsv = async () => {
    if (!sessionId) return;
    const base = getHttpBase();
    const url = `${base}/api/export/${encodeURIComponent(sessionId)}/csv`;
    try {
      const res = await fetch(url, { headers: { 'ngrok-skip-browser-warning': '1' } });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${patientName || 'record'}-${sessionId}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("CSV downloaded");
    } catch (e: any) {
      toast.error(e?.message || 'Export failed');
    }
  };

  return (
    <>
      <SEO title="I-Fill-Forms – Automated Speech-to-Form EMR" description="Real-time speech-to-form medical records. Start recording, watch fields fill themselves, export to CSV." />
      <Navbar />
      <main className="container py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Automated Speech-to-Form Medical Records</h1>
          <SignatureEffect />
        </header>

        <section className="mb-6 grid gap-2">
          <Label htmlFor="patient">Patient Name</Label>
          <Input id="patient" placeholder="e.g., Jane Doe" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
        </section>

        <section className="mb-8 flex items-center gap-4">
          {!isRecording ? (
            <Button variant="record" size="xl" onClick={handleStart} disabled={!canStart} aria-label="Start recording">
              <Mic /> Start Recording
            </Button>
          ) : (
            <Button variant="recording" size="xl" onClick={handleStop} aria-label="Stop recording">
              <Square /> Stop Recording
            </Button>
          )}
          {sessionId && (
            <Button variant="outline" onClick={downloadCsv} aria-label="Download CSV">
              <Download className="mr-2" /> Export CSV
            </Button>
          )}
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="rounded-lg border p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-medium">Live Transcription</h2>
            <ScrollArea className="h-72 rounded-md border bg-muted/20">
              <div ref={listRef} className="h-72 overflow-y-auto p-3">
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
                <Textarea value={fields.symptoms} readOnly className="min-h-24" />
              </div>
              <div className="grid gap-2">
                <Label>Drug / Medication to Consume</Label>
                <Textarea value={fields.medications} readOnly className="min-h-24" />
              </div>
              <div className="grid gap-2">
                <Label>Doctor’s Conclusion & Instructions</Label>
                <Textarea value={fields.conclusion} readOnly className="min-h-24" />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default Index;
