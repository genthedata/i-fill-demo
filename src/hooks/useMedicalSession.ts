import { useCallback, useEffect, useRef, useState } from "react";
import { getHttpBase, getWsBase } from "@/config/api";

export interface TranscriptItem {
  id: string;
  text: string;
  ts: number;
}

export interface RecordFields {
  symptoms: string;
  medications: string;
  conclusion: string;
}

const initialFields: RecordFields = { symptoms: "", medications: "", conclusion: "" };

export function useMedicalSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [fields, setFields] = useState<RecordFields>(initialFields);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const createSession = useCallback(async (patientName?: string, doctorName?: string) => {
    if (sessionId) return sessionId;
    const base = getHttpBase();
    try {
      const res = await fetch(`${base}/api/sessions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify({ patient_name: patientName, doctor_name: doctorName }),
      });
      if (!res.ok) throw new Error(`Create session failed (${res.status})`);
      const data = await res.json().catch(() => ({}));
      const id = data.session_id || data.id || crypto.randomUUID();
      setSessionId(id);
      return id as string;
    } catch (e: any) {
      setError(e?.message || "Failed to create session");
      throw e;
    }
  }, [sessionId]);

  const stop = useCallback(() => {
    try { mediaRecorderRef.current?.stop(); } catch {}
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    setIsRecording(false);
    // keep WebSocket open to continue receiving updates
  }, []);

  const start = useCallback(async ({ patientName, token, doctorName }: { patientName?: string; token?: string; doctorName?: string }) => {
    setError(null);
    const id = await createSession(patientName, doctorName);

    // Open WebSocket for bi-directional audio + updates
    const wsBase = getWsBase();
    const wsUrl = `${wsBase}/ws/session/${encodeURIComponent(id)}${token ? `?token=${encodeURIComponent(token)}` : ""}${token ? "&" : "?"}ngrok-skip-browser-warning=1`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const mimeTypes = [
          'audio/webm;codecs=opus',
          'audio/ogg;codecs=opus',
          'audio/webm',
          'audio/ogg',
        ];
        let mimeType = '';
        for (const m of mimeTypes) {
          if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(m)) { mimeType = m; break; }
        }
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.addEventListener('dataavailable', async (e) => {
          if (!e.data || e.data.size === 0) return;
          if (ws.readyState !== WebSocket.OPEN) return;
          try {
            const buf = await e.data.arrayBuffer();
            ws.send(buf);
          } catch {}
        });

        recorder.start(300);
        setIsRecording(true);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Microphone error');
      }
    };

    ws.onmessage = (ev) => {
      try {
        const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : {};
        if (typeof data.text === 'string') {
          setTranscript((prev) => [...prev, { id: crypto.randomUUID(), text: data.text, ts: Date.now() }]);
        }
        if (typeof data.transcript === 'string') {
          setTranscript((prev) => [...prev, { id: crypto.randomUUID(), text: data.transcript, ts: Date.now() }]);
        }
        if (data && typeof data.field === 'string' && typeof data.value === 'string') {
          const f = data.field.toLowerCase();
          setFields((prev) => {
            if (f.includes('symptom')) return { ...prev, symptoms: data.value };
            if (f.includes('drug') || f.includes('medication') || f.includes('medicine')) return { ...prev, medications: data.value };
            if (f.includes('conclusion') || f.includes('instruction') || f.includes('note')) return { ...prev, conclusion: data.value };
            return prev;
          });
        } else {
          setFields((prev) => ({
            symptoms: data.symptoms ?? data.symptom ?? prev.symptoms,
            medications: data.medications ?? data.drugs ?? data.medication ?? prev.medications,
            conclusion: data.conclusion ?? data.instructions ?? prev.conclusion,
          }));
        }
      } catch {}
    };

    ws.onerror = (e) => {
      console.error(e);
      setError('Connection error. Please ensure the backend URL is reachable.');
    };

    ws.onclose = () => {
      setIsRecording(false);
    };
  }, [createSession]);

  useEffect(() => () => {
    try { mediaRecorderRef.current?.stop(); } catch {}
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
  }, []);

  return { sessionId, isRecording, transcript, fields, error, start, stop } as const;
}
