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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mic, Square, Download } from "lucide-react";
import { useMedicalSession } from "@/hooks/useMedicalSession";
import { toast } from "sonner";
import { getHttpBase } from "@/config/api";

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
  const [patientName, setPatientName] = useState("");
  const [token] = useState<string | undefined>(undefined);
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

  useEffect(() => {
    const id = localStorage.getItem('SCHEMA_ID');
    if (id) {
      setSchemaId(id);
      setSelectedSchemaId(id);
    }
    const sid = localStorage.getItem('SESSION_ID');
    if (sid) setSelectedSessionId(sid);
  }, []);

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
      }
      toast.success(`Schema uploaded${data?.name ? `: ${data.name}` : ''}`);
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  const uploadAndCreate = async () => {
    if (!schemaFile) {
      toast.error("Please select a schema file first.");
      return;
    }
    if (!patientName) {
      toast.error("Please enter a patient name first.");
      return;
    }
    setUploading(true);
    try {
      const base = getHttpBase();
      const fd = new FormData();
      fd.append('file', schemaFile);
      const uploadRes = await fetch(`${base}/api/schemas/upload`, {
        method: 'POST',
        headers: { "ngrok-skip-browser-warning": "1" },
        body: fd,
      });
      if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);
      const uploaded = await uploadRes.json();
      const id = uploaded?.id as string | undefined;
      if (!id) throw new Error('Upload succeeded but no schema id returned');
      localStorage.setItem('SCHEMA_ID', id);
      (window as any).schema_id = id;
      setSchemaId(id);

      const createRes = await fetch(`${base}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({
          schema_id: id,
          name: patientName,
          patient_name: patientName,
          doctor_name: doctorName,
        }),
      });
      if (!createRes.ok) throw new Error(`Create session failed (${createRes.status})`);
      const created = await createRes.json();
      toast.success(`Session created${created?.id ? `: ${created.id}` : ''}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to upload and create session');
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
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create session');
    } finally {
      setCreating(false);
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

        <section className="mb-4 grid gap-2">
          <Label htmlFor="apiBaseInput">API Base URL</Label>
          <div className="flex items-center gap-3">
            <Input id="apiBaseInput" placeholder="https://your-api.example.com" value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
            <Button size="sm" variant="secondary" onClick={saveApiBase} aria-label="Save API base" disabled={pinging}>Save & Test</Button>
          </div>
          <p className="text-xs text-muted-foreground">Current: {getHttpBase()}</p>
        </section>

        <section className="mb-6 grid gap-2">
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
            <Button size="sm" variant="default" onClick={createSessionWithSelected} disabled={!selectedSchemaId || !patientName || creating}>
              {creating ? 'Creating…' : 'Create Session'}
            </Button>
          </div>
        </section>

        <section className="mb-6 grid gap-2">
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

        <section className="mb-6 grid gap-2">
          <Label>Past Sessions</Label>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Recent sessions</p>
            <Button size="sm" variant="outline" onClick={fetchSessions} disabled={loadingSessions}>{loadingSessions ? 'Refreshing…' : 'Refresh'}</Button>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3 overflow-x-auto">
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

        <section className="mb-6 grid gap-2">
          <Label>Session details preview</Label>
          <div className="rounded-md border bg-muted/20 p-3">
            {!selectedSessionId ? (
              <p className="text-sm text-muted-foreground">Select a session to view details.</p>
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

        <section className="mb-6 grid gap-2">
          <Label htmlFor="schemaFile">Upload CSV template</Label>
          <div className="flex items-center gap-3">
            <Input id="schemaFile" type="file" accept=".csv,.json,.yaml,.yml,.txt" onChange={(e) => setSchemaFile(e.target.files?.[0] || null)} />
            <Button size="sm" onClick={uploadSchema} disabled={!schemaFile || uploading} aria-label="Upload schema only">
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button size="sm" variant="default" onClick={uploadAndCreate} disabled={!schemaFile || !patientName || uploading} aria-label="Upload schema and create session">
              {uploading ? 'Processing…' : 'Upload & Create Session'}
            </Button>
          </div>
          <Label htmlFor="patientNameInput">Patient name</Label>
          <Input id="patientNameInput" placeholder="e.g., Jane Doe" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          {schemaId && <p className="text-xs text-muted-foreground">Current schema_id: {schemaId}</p>}
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
