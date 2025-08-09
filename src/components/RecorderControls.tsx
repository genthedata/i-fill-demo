import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mic, Square } from "lucide-react";
import WebSocketRecorder from "@/lib/WebSocketRecorder";

interface Props {
  sessionId: string | null;
  onFieldUpdate: (field: string, value: string) => void;
}

export default function RecorderControls({ sessionId, onFieldUpdate }: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const wsRecRef = useRef<ReturnType<typeof WebSocketRecorder> | null>(null);

  const [recording, setRecording] = useState(false);

  const startRecording = useCallback(async () => {
    if (!sessionId) return;

    // Setup WS
    wsRecRef.current = WebSocketRecorder({ sessionId, onFieldUpdate });
    wsRecRef.current.connectWS();

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
        wsRecRef.current?.sendAudio(blob);
      } catch (e) {
        console.error("Failed sending audio blob", e);
      } finally {
        // cleanup mic
        try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setRecording(false);
      }
    };

    recorder.start();
    setRecording(true);
  }, [sessionId, onFieldUpdate]);

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
