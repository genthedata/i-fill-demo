import { useCallback, useEffect, useRef, useState } from "react";
import { getHttpBase } from "@/config/api";

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
  const recognitionRef = useRef<any>(null);

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
      recognitionRef.current?.stop();
    } catch {}
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
        // Use browser SpeechRecognition and send text chunks to backend
        const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionImpl) {
          setError('Speech Recognition not supported in this browser.');
          return;
        }

        const recognition = new SpeechRecognitionImpl();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        const sendToBackend = async (text: string) => {
          if (!text) return;
          const httpBase = getHttpBase();
          try {
            await fetch(`${httpBase}/api/conversation/process`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': '1',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ session_id: id, text }),
            });
          } catch (e) {
            console.error('sendToBackend error', e);
          }
        };

        recognition.onresult = (e: any) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            const text: string = res[0]?.transcript ?? '';
            if (res.isFinal && text) {
              setTranscript((prev) => [
                ...prev,
                { id: crypto.randomUUID(), text, ts: Date.now() }
              ]);
              void sendToBackend(text);
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.error('recognition error', e);
          setError('Speech recognition error.');
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Microphone or recognition error');
        stop();
      }
    },
    [ensureSession, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { sessionId, isRecording, transcript, error, start, stop } as const;
}
