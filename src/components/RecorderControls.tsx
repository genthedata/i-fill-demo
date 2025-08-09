import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mic, Square } from "lucide-react";
import { getHttpBase } from "@/config/api";

interface Props {
  sessionId: string | null;
  onFieldUpdate: (field: string, value: string) => void;
  onTranscription?: (text: string) => void;
}

export default function RecorderControls({ sessionId, onFieldUpdate, onTranscription }: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  

  const [recording, setRecording] = useState(false);

  const startRecording = useCallback(async () => {
    if (!sessionId) return;

    // Using HTTP POST to /api/audio/chunk after recording stops (no WebSocket)

    // Request mic access and start MediaRecorder
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const preferredTypes = [
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "audio/webm",
      "audio/ogg",
    ];
    let mimeType = "";
    for (const m of preferredTypes) {
      if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(m)) { mimeType = m; break; }
    }

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    chunksRef.current = [];
    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      try {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const result = reader.result as string;
          const base64 = (result?.split(",")[1]) || "";
          try {
            const res = await fetch(`${getHttpBase()}/api/audio/chunk`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': '1',
              },
              body: JSON.stringify({
                session_id: sessionId,
                audio_data: base64,
              }),
            });
            const json = await res.json().catch(() => ({}));
            if (json && typeof json.transcription === 'string') {
              onTranscription?.(json.transcription);
            }
            if (json && json.extracted_fields && typeof json.extracted_fields === 'object') {
              try {
                Object.entries(json.extracted_fields).forEach(([k, v]) => {
                  onFieldUpdate(String(k), String(v ?? ''));
                });
              } catch {}
            }
          } catch (e) {
            console.error('POST /api/audio/chunk failed', e);
          } finally {
            try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
            mediaStreamRef.current = null;
            mediaRecorderRef.current = null;
            chunksRef.current = [];
            setRecording(false);
          }
        };
        reader.readAsDataURL(blob);
        return;
      } catch (e) {
        console.error('Failed preparing audio blob', e);
      }
      // Fallback cleanup
      try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      setRecording(false);
    };

    recorder.start();
    setRecording(true);
  }, [sessionId, onFieldUpdate, onTranscription]);

  const stopRecording = useCallback(() => {
    try { mediaRecorderRef.current?.stop(); } catch {}
  }, []);

  const disabled = !sessionId;

  return (
    <div className="flex items-center gap-3">
      <Button onClick={startRecording} disabled={disabled || recording} aria-label="Start recording (custom)">
        <Mic className="mr-2" /> Start Recording
      </Button>
      <Button variant="destructive" onClick={stopRecording} disabled={!recording} aria-label="Stop recording (custom)">
        <Square className="mr-2" /> Stop Recording
      </Button>
    </div>
  );
}
