import { useEffect, useState } from "react";
import { getWsBase } from "@/config/api";

export interface RecordFields {
  symptoms: string;
  medications: string;
  conclusion: string;
}

const initial: RecordFields = { symptoms: "", medications: "", conclusion: "" };

export function useUpdates(sessionId: string | null, token?: string) {
  const [fields, setFields] = useState<RecordFields>(initial);

  useEffect(() => {
    if (!sessionId) return;
    const wsBase = getWsBase();
    const url = `${wsBase}/ws/updates/${encodeURIComponent(sessionId)}${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;
    const ws = new WebSocket(url);

    ws.onmessage = (ev) => {
      try {
        const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : {};
        const next: RecordFields = {
          symptoms: data.symptoms ?? fields.symptoms,
          medications: data.medications ?? data.drugs ?? fields.medications,
          conclusion: data.conclusion ?? data.instructions ?? fields.conclusion,
        };
        setFields(next);
      } catch (e) {
        // ignore
      }
    };
    ws.onerror = () => {
      // ignore connection errors for now
    };
    return () => ws.close();
  }, [sessionId, token]);

  return fields;
}
