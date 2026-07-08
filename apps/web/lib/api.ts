import type { ImportProgressEvent } from "@groweasy/shared";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const sampleUrl = `${API_BASE}/api/sample`;

/**
 * POST the file and consume the backend's Server-Sent Events stream, yielding
 * one typed progress event at a time (parsed -> mapping -> batch... -> done).
 */
export async function* streamImport(
  file: File
): AsyncGenerator<ImportProgressEvent> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/import?stream=1`, {
    method: "POST",
    headers: { Accept: "text/event-stream" },
    body: form,
  });

  if (!res.ok) {
    let message = `Import failed (HTTP ${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  if (!res.body) throw new Error("The server did not return a stream.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const payload = dataLine.slice(5).trim();
      if (payload) yield JSON.parse(payload) as ImportProgressEvent;
    }
  }
}
