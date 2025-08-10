import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import SignatureEffect from "@/components/SignatureEffect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { TowerLoader } from "@/components/TowerLoader";
import { useMedicalSession } from "@/hooks/useMedicalSession";
import { toast } from "sonner";
import { getHttpBase, getWsBase } from "@/config/api";
import RecorderControls from "@/components/RecorderControls";

type SchemaInfo = {
  id: string;
  name: string;
  fields?: string[];
  created_at?: string;
};

type SessionInfo = {
  id: string;
  name: string;
  created_at?: string;
};

type SessionDetails = {
  id: string;
  name?: string;
  created_at?: string;
  data?: any;
  fields?: any;
};

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showTransitionLoader, setShowTransitionLoader] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [doctorName] = useState<string | undefined>("Dr. John Smith");
  const [httpStatus, setHttpStatus] = useState<'idle' | 'ok' | 'fail'>("idle");
  const [pinging, setPinging] = useState(false);

  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [schemaId, setSchemaId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [apiBase, setApiBase] = useState(getHttpBase());
  const [schemas, setSchemas] = useState<SchemaInfo[]>([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [creating, setCreating] = useState(false);
  const [schemaDetails, setSchemaDetails] = useState<SchemaInfo | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  const { sessionId, transcript, fields, error, wsStatus } = useMedicalSession();
  const passiveWsRef = useRef<WebSocket | null>(null);
  const lastPassiveSessionIdRef = useRef<string | null>(null);
  const [transcriptionText, setTranscriptionText] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [transcript.length]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    const id = localStorage.getItem('SCHEMA_ID');
    if (id) {
      setSchemaId(id);
      setSelectedSchemaId(id);
    }
    const sid = localStorage.getItem('SESSION_ID');
    if (sid) setSelectedSessionId(sid);
  }, []);

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

  const saveApiBase = async () => {
    const val = apiBase.trim();
    if (!val) { toast.error('Enter a valid API base URL'); return; }
    try {
      localStorage.setItem('API_BASE_URL', val);
      (window as any).BASE_URL = val;
      setHttpStatus('idle');
      toast.success('API base saved');
      await pingApi();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save API base');
    }
  };
  
  const fetchSchemas = async () => {
    setLoadingSchemas(true);
    try {
      const base = getHttpBase();
      const res = await fetch(`${base}/api/schemas/list`, {
        headers: { "ngrok-skip-browser-warning": "1" },
      });
      if (!res.ok) throw new Error(`List failed (${res.status})`);
      const data: SchemaInfo[] = await res.json();
      setSchemas(Array.isArray(data) ? data : []);
      if (!selectedSchemaId && data?.length) {
        setSelectedSchemaId(data[0].id);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load schemas');
    } finally {
      setLoadingSchemas(false);
    }
  };

  useEffect(() => {
    // initial load of schemas
    fetchSchemas().catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSchemaId) {
      setSchemaDetails(null);
      return;
    }
    setLoadingDetails(true);
    const base = getHttpBase();
    fetch(`${base}/api/schemas/${encodeURIComponent(selectedSchemaId)}`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Details failed (${res.status})`);
        const data: SchemaInfo = await res.json();
        setSchemaDetails(data);
      })
      .catch((e: any) => toast.error(e?.message || 'Failed to load schema details'))
      .finally(() => setLoadingDetails(false));
  }, [selectedSchemaId, apiBase]);
  
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const base = getHttpBase();
      const res = await fetch(`${base}/api/sessions/list`, {
        headers: { "ngrok-skip-browser-warning": "1" },
      });
      if (!res.ok) throw new Error(`List sessions failed (${res.status})`);
      const data: SessionInfo[] = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions().catch(() => {});
  }, []);

  const fetchSessionDetails = async (id: string) => {
    setLoadingSession(true);
    try {
      const base = getHttpBase();
      const res = await fetch(`${base}/api/sessions/${encodeURIComponent(id)}`, {
        headers: { "ngrok-skip-browser-warning": "1" },
      });
      if (!res.ok) throw new Error(`Get session failed (${res.status})`);
      const data: SessionDetails = await res.json();
      setSessionDetails(data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load session');
      setSessionDetails(null);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    if (selectedSessionId) fetchSessionDetails(selectedSessionId);
  }, [selectedSessionId, apiBase]);

  // Passive WebSocket to receive field updates when not recording
  useEffect(() => {
    if (!selectedSessionId) {
      if (passiveWsRef.current) { try { passiveWsRef.current.close(); } catch {} passiveWsRef.current = null; }
      lastPassiveSessionIdRef.current = null;
      return;
    }

    // If live recording WS is connected, avoid duplicate passive connection
    if (wsStatus === 'connected') {
      if (passiveWsRef.current) { try { passiveWsRef.current.close(); } catch {} passiveWsRef.current = null; }
      lastPassiveSessionIdRef.current = selectedSessionId;
      return;
    }

    // Avoid reconnecting if we already have an open connection for this session
    if (
      lastPassiveSessionIdRef.current === selectedSessionId &&
      passiveWsRef.current &&
      (passiveWsRef.current.readyState === WebSocket.OPEN || passiveWsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsBase = getWsBase();
    const url = `${wsBase}/ws/session/${encodeURIComponent(selectedSessionId)}?ngrok-skip-browser-warning=1`;
    const ws = new WebSocket(url);
    passiveWsRef.current = ws;
    lastPassiveSessionIdRef.current = selectedSessionId;

    ws.onmessage = (ev) => {
      try {
        const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : {};
        setSessionDetails((prev) => {
          const prevFields = (prev?.fields || {}) as any;
          let next = { ...prevFields } as any;
          if (data && typeof data.field === 'string' && typeof data.value === 'string') {
            const f = data.field.toLowerCase();
            if (f.includes('symptom')) next.symptoms = data.value;
            else if (f.includes('drug') || f.includes('medication') || f.includes('medicine')) next.medications = data.value;
            else if (f.includes('conclusion') || f.includes('instruction') || f.includes('note')) next.conclusion = data.value;
          } else {
            next = {
              symptoms: data.symptoms ?? data.symptom ?? next.symptoms,
              medications: data.medications ?? data.drugs ?? data.medication ?? next.medications,
              conclusion: data.conclusion ?? data.instructions ?? next.conclusion,
            };
          }
          return { ...(prev || { id: selectedSessionId }), fields: next } as SessionDetails;
        });
      } catch {}
    };

    ws.onclose = () => { if (passiveWsRef.current === ws) passiveWsRef.current = null; };
    ws.onerror = () => {};

    return () => {
      try { ws.close(); } catch {}
    };
  }, [selectedSessionId, wsStatus, apiBase]);

  const uploadSchema = async () => {
    if (!schemaFile) {
      toast.error("Please select a schema file first.");
      return;
    }
    setUploading(true);
    try {
      const base = getHttpBase();
      const fd = new FormData();
      fd.append('file', schemaFile);
      const res = await fetch(`${base}/api/schemas/upload`, {
        method: 'POST',
        headers: { "ngrok-skip-browser-warning": "1" },
        body: fd,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();
      if (data?.id) {
        localStorage.setItem('SCHEMA_ID', data.id);
        (window as any).schema_id = data.id;
        setSchemaId(data.id);
        setSelectedSchemaId(data.id);
      }
      toast.success(`Schema uploaded${data?.name ? `: ${data.name}` : ''}`);
      await fetchSchemas(); // Refresh the list
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  const createSessionWithSelected = async () => {
    if (!selectedSchemaId) {
      toast.error("Please select a schema.");
      return;
    }
    if (!patientName) {
      toast.error("Please enter a patient name first.");
      return;
    }
    setCreating(true);
    try {
      const base = getHttpBase();
      const res = await fetch(`${base}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({
          schema_id: selectedSchemaId,
          name: patientName,
        }),
      });
      if (!res.ok) throw new Error(`Create session failed (${res.status})`);
      const created = await res.json();
      if (created?.id) {
        localStorage.setItem('SESSION_ID', created.id);
        (window as any).session_id = created.id;
        setSelectedSessionId(created.id);
      }
      toast.success(`Session created${created?.id ? `: ${created.id}` : ''}`);
      localStorage.setItem('SCHEMA_ID', selectedSchemaId);
      (window as any).schema_id = selectedSchemaId;
      setSchemaId(selectedSchemaId);
      await fetchSessions(); // Refresh the sessions list
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const exportCsvUrl = useMemo(() => {
    const sid = selectedSessionId || sessionId || (typeof window !== 'undefined' ? localStorage.getItem('SESSION_ID') : null);
    return sid ? `${getHttpBase()}/api/export/${encodeURIComponent(sid)}/csv` : null;
  }, [selectedSessionId, sessionId, apiBase]);

  const displayFields = useMemo(() => {
    const f = (sessionDetails?.fields || {}) as any;
    return {
      symptoms: f.symptoms ?? f.symptom ?? fields.symptoms,
      medications: f.medications ?? f.medication ?? f.drugs ?? fields.medications,
      conclusion: f.conclusion ?? f.instructions ?? fields.conclusion,
    };
  }, [sessionDetails, fields]);

  const effectiveSessionId = useMemo(() => (
    selectedSessionId || sessionId || (typeof window !== 'undefined' ? localStorage.getItem('SESSION_ID') : null)
  ), [selectedSessionId, sessionId]);

  const handleFieldUpdate = useCallback((field: string, value: string) => {
    setSessionDetails((prev) => {
      const prevFields = (prev?.fields || {}) as any;
      const f = (field || '').toLowerCase();
      const next = { ...prevFields } as any;
      if (f.includes('symptom')) next.symptoms = value;
      else if (f.includes('drug') || f.includes('medication') || f.includes('medicine')) next.medications = value;
      else if (f.includes('conclusion') || f.includes('instruction') || f.includes('note')) next.conclusion = value;
      return { ...(prev || { id: effectiveSessionId || '' }), fields: next } as SessionDetails;
    });
  }, [effectiveSessionId]);

  return (
    <>
      <SEO title="I-Fill-Forms – Automated Speech-to-Form EMR" description="Real-time speech-to-form medical records. Start recording, watch fields fill themselves, export to CSV." />
      <Navbar doctorName={doctorName} wsStatus={wsStatus} />
      <main className="container py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Automated Speech-to-Form Medical Records</h1>
          <SignatureEffect />
        </header>

        {/* Step Progress Indicator */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step 
                    ? 'bg-primary text-primary-foreground' 
                    : currentStep > step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 5 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Schema Upload */}
        {currentStep === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 1: Upload & Select Schema</h2>
              <p className="text-muted-foreground">Upload a CSV template or select an existing schema</p>
            </div>

            <section className="grid gap-2">
              <Label htmlFor="schemaFile">Upload CSV template</Label>
              <div className="flex items-center gap-3">
                <Input id="schemaFile" type="file" accept=".csv,.json,.yaml,.yml,.txt" onChange={(e) => setSchemaFile(e.target.files?.[0] || null)} />
                <Button size="sm" onClick={uploadSchema} disabled={!schemaFile || uploading} aria-label="Upload schema only">
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </section>

            <div className="text-center my-4">
              <span className="text-sm text-muted-foreground">OR</span>
            </div>

            <section className="grid gap-2">
              <Label htmlFor="schemaSelect">Select existing schema</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedSchemaId || undefined}
                  onValueChange={(val) => {
                    setSelectedSchemaId(val);
                    localStorage.setItem('SCHEMA_ID', val);
                    (window as any).schema_id = val;
                    setSchemaId(val);
                  }}
                >
                  <SelectTrigger id="schemaSelect" className="w-full md:w-80">
                    <SelectValue placeholder={loadingSchemas ? 'Loading…' : (schemas.length ? 'Choose a schema' : 'No schemas found')} />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {schemas.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={fetchSchemas} disabled={loadingSchemas}>
                  {loadingSchemas ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
            </section>

            <section className="grid gap-2">
              <Label>Schema fields preview</Label>
              <div className="rounded-md border bg-muted/20 p-3">
                {!selectedSchemaId ? (
                  <p className="text-sm text-muted-foreground">Select a schema to preview its fields.</p>
                ) : loadingDetails ? (
                  <p className="text-sm text-muted-foreground">Loading fields…</p>
                ) : schemaDetails?.fields?.length ? (
                  <ul className="list-disc pl-5 text-sm">
                    {schemaDetails.fields.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No fields found for this schema.</p>
                )}
              </div>
            </section>

            <div className="flex justify-end pt-6">
              <Button 
                onClick={() => setCurrentStep(2)} 
                className="min-w-24"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Session Creation */}
        {currentStep === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 2: Create Session</h2>
              <p className="text-muted-foreground">Enter patient name and create a new session</p>
            </div>

            <section className="grid gap-2">
              <Label htmlFor="patientNameInput">Patient name</Label>
              <Input 
                id="patientNameInput" 
                placeholder="e.g., Jane Doe" 
                value={patientName} 
                onChange={(e) => setPatientName(e.target.value)} 
                className="max-w-md"
              />
              {schemaId && <p className="text-xs text-muted-foreground">Current schema_id: {schemaId}</p>}
            </section>

            <section className="grid gap-2">
              <Label>Past Sessions</Label>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Recent sessions</p>
                <Button size="sm" variant="outline" onClick={fetchSessions} disabled={loadingSessions}>
                  {loadingSessions ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 overflow-x-auto max-h-64">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((s) => (
                        <TableRow key={s.id} onClick={() => setSelectedSessionId(s.id)} className="cursor-pointer">
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.created_at ? new Date(s.created_at).toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </section>

            <div className="flex items-center justify-center">
              <Button 
                onClick={createSessionWithSelected} 
                disabled={!selectedSchemaId || !patientName || creating}
                className="min-w-32"
              >
                {creating ? 'Creating…' : 'Create Session'}
              </Button>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                ← Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)} 
                className="min-w-24"
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Recording */}
        {currentStep === 3 && (
          <div className="animate-fade-in space-y-6 relative">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 3: Voice Recording</h2>
              <p className="text-muted-foreground">Start recording to capture voice and transcription</p>
            </div>

            <section className="grid gap-3">
              <Label>Voice Recorder</Label>
              <RecorderControls
                sessionId={effectiveSessionId}
                onFieldUpdate={handleFieldUpdate}
                onTranscription={(txt) => setTranscriptionText(txt)}
              />
              {!effectiveSessionId && (
                <p className="text-xs text-muted-foreground">Create or select a session to enable recording.</p>
              )}
              <div className="grid gap-2">
                <Label htmlFor="customTranscription">Transcription (live)</Label>
                <Textarea id="customTranscription" value={transcriptionText} readOnly className="min-h-24" placeholder="Live transcription will appear here..." />
              </div>
            </section>

            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                ← Back
              </Button>
              <Button onClick={() => {
                setShowTransitionLoader(true);
                setTimeout(() => {
                  setShowTransitionLoader(false);
                  setCurrentStep(4);
                }, 3000);
              }} className="min-w-24">
                Next →
              </Button>
            </div>

            {/* Tower Loader Overlay */}
            {showTransitionLoader && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                <TowerLoader />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Live Transcription & Auto-filled Records */}
        {currentStep === 4 && !showTransitionLoader && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 4: Live Transcription & Auto-filled Records</h2>
              <p className="text-muted-foreground">View live transcription and auto-filled medical fields</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <section className="rounded-lg border p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-medium">Live Transcription</h3>
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
                <h3 className="mb-3 text-lg font-medium">Auto-filled Medical Record</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Symptoms</Label>
                    <Textarea id="symptoms" value={displayFields.symptoms} readOnly className="min-h-24" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Drug / Medication to Consume</Label>
                    <Input id="medication" value={displayFields.medications} readOnly />
                  </div>
                  <div className="grid gap-2">
                    <Label>Doctor's Conclusion & Instructions</Label>
                    <Textarea id="conclusion" value={displayFields.conclusion} readOnly className="min-h-24" />
                  </div>
                </div>
              </section>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                ← Back
              </Button>
              <Button onClick={() => setCurrentStep(5)} className="min-w-24">
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Export */}
        {currentStep === 5 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 5: Review & Export</h2>
              <p className="text-muted-foreground">Review the captured data and export to CSV</p>
            </div>

            <section className="grid gap-2">
              <Label>Session details</Label>
              <div className="rounded-md border bg-muted/20 p-3">
                {!selectedSessionId ? (
                  <p className="text-sm text-muted-foreground">No session selected.</p>
                ) : loadingSession ? (
                  <p className="text-sm text-muted-foreground">Loading session…</p>
                ) : sessionDetails ? (
                  sessionDetails.data && Array.isArray(sessionDetails.data) ? (
                    <ul className="list-disc pl-5 text-sm">
                      {sessionDetails.data.map((d: any, idx: number) => (
                        <li key={idx}>{typeof d === 'string' ? d : JSON.stringify(d)}</li>
                      ))}
                    </ul>
                  ) : sessionDetails.fields ? (
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(sessionDetails.fields, null, 2)}</pre>
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(sessionDetails, null, 2)}</pre>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">No details available.</p>
                )}
              </div>
            </section>

            <section className="rounded-lg border p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-medium">Final Medical Record</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Symptoms</Label>
                  <Textarea value={displayFields.symptoms} readOnly className="min-h-24" />
                </div>
                <div className="grid gap-2">
                  <Label>Drug / Medication to Consume</Label>
                  <Input value={displayFields.medications} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>Doctor's Conclusion & Instructions</Label>
                  <Textarea value={displayFields.conclusion} readOnly className="min-h-24" />
                </div>
              </div>
            </section>

            <div className="flex justify-center">
              {exportCsvUrl && (
                <Button id="downloadBtn" variant="default" asChild aria-label="Download CSV" className="min-w-32">
                  <a href={exportCsvUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2" /> Export CSV
                  </a>
                </Button>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setCurrentStep(4)}>
                ← Back
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Start Over
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Index;