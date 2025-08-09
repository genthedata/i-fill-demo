import { useCallback, useEffect, useRef, useState } from "react";
import { getWsBase } from "@/config/api";

export interface TranscriptItem {
  id: string;
  text: string;
  ts: number;
}

export function useVoiceSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const ensureSession = useCallback(() => {
    if (!sessionId) {
      const id = crypto.randomUUID();
      setSessionId(id);
      return id;
    }
    return sessionId;
  }, [sessionId]);

  const stop = useCallback(() => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    setIsRecording(false);
  }, []);

  const start = useCallback(
    async ({ patientName, token, doctorName }: { patientName: string; token?: string; doctorName?: string }) => {
      setError(null);
      const id = ensureSession();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const wsBase = getWsBase();
        const voiceUrl = `${wsBase}/api/conversation/voice-process?session_id=${encodeURIComponent(
          id
        )}&patient_name=${encodeURIComponent(patientName)}${doctorName ? `&doctor_name=${encodeURIComponent(doctorName)}` : ""}${
          token ? `&token=${encodeURIComponent(token)}` : ""
        }&ngrok-skip-browser-warning=1`;



        const ws = new WebSocket(voiceUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Setup recorder once socket is open
          const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/ogg;codecs=opus',
            'audio/webm',
            'audio/ogg',
          ];
          let mimeType = '';
          for (const m of mimeTypes) {
            if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(m)) {
              mimeType = m;
              break;
            }
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
        };

        ws.onmessage = (ev) => {
          try {
            const data = typeof ev.data === 'string' ? ev.data : '';
            if (data) {
              let text = data;
              try {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed.text === 'string') text = parsed.text;
                if (parsed && typeof parsed.transcript === 'string') text = parsed.transcript;
              } catch {}
              setTranscript((prev) => [
                ...prev,
                { id: crypto.randomUUID(), text, ts: Date.now() }
              ]);
            }
          } catch (err: any) {
            console.error('parse message error', err);
          }
        };

        ws.onerror = (e) => {
          console.error(e);
          setError('Connection error. Please ensure the backend URL is reachable.');
          stop();
        };
        ws.onclose = () => {
          setIsRecording(false);
        };
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Microphone or connection error');
        stop();
      }
    },
    [ensureSession, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { sessionId, isRecording, transcript, error, start, stop } as const;
}
