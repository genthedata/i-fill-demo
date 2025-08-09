import { getWsBase } from "@/config/api";

let ws: WebSocket | undefined;

export default function WebSocketRecorder({
  sessionId,
  onFieldUpdate,
}: {
  sessionId: string;
  onFieldUpdate: (field: string, value: string) => void;
}) {
  const connectWS = () => {
    const wsBase = getWsBase();
    ws = new WebSocket(`${wsBase}/ws/session/${encodeURIComponent(sessionId)}`);

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string);
        if (message?.type === "field_update") {
          onFieldUpdate(message.field as string, message.value as string);
        }
      } catch (e) {
        console.error("WebSocket message parse error", e);
      }
    };

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };
  };

  const sendAudio = (audioBlob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = (result?.split(",")[1]) || "";
      ws?.send(
        JSON.stringify({
          type: "audio_chunk",
          data: base64,
          format: "webm",
        })
      );
    };
    reader.readAsDataURL(audioBlob);
  };

  return { connectWS, sendAudio } as const;
}
