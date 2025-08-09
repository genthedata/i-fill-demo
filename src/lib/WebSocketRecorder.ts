

import { getWsBase } from "@/config/api";

let ws: WebSocket | undefined;

export default function WebSocketRecorder({
  sessionId,
  onFieldUpdate,
  onTranscription,
  onStatus,
}: {
  sessionId: string;
  onFieldUpdate: (field: string, value: string) => void;
  onTranscription?: (text: string) => void;
  onStatus?: (message: string) => void;
}) {
  const connectWS = () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return; // avoid duplicate connections
    }
    const wsBase = getWsBase();
    const url = `${wsBase}/ws/session/${encodeURIComponent(sessionId)}?ngrok-skip-browser-warning=1`;
    ws = new WebSocket(url);

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string);

        switch (message?.type) {
          case "transcription":
            onTranscription?.(String(message.text ?? ""));
            break;
          case "field_update":
            onFieldUpdate(String(message.field ?? ""), String(message.value ?? ""));
            break;
          case "status":
            onStatus?.(String(message.message ?? ""));
            break;
          default:
            // ignore unknown messages
            break;
        }
      } catch (e) {
        console.error("WebSocket message parse error", e);
      }
    };

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      ws = undefined;
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };
  };

  const sendAudio = (audioBlob: Blob) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WS not open; skipping audio send");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = (result?.split(",")[1]) || "";
      try {
        ws?.send(
          JSON.stringify({
            type: "audio_chunk",
            data: base64,
            format: "webm",
          })
        );
      } catch (e) {
        console.error("Failed to send audio chunk", e);
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  const disconnect = () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      try { ws.close(); } catch {}
    }
    ws = undefined;
  };

  return { connectWS, sendAudio, disconnect } as const;
}
