

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
    ws = new WebSocket(`wss://8fc0c45bcfa3.ngrok-free.app/ws/session/${encodeURIComponent(sessionId)}`);

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
