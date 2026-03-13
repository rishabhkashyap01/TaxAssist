"use client";

// SSE via fetch + ReadableStream (supports POST with body)
export async function streamPost(
  url: string,
  body: object,
  onToken: (token: string) => void,
  onDone: (data: Record<string, unknown>) => void,
  onError: (msg: string) => void,
  signal?: AbortSignal
) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if ((e as Error).name !== "AbortError") onError(String(e));
    return;
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const b = await res.json(); detail = b.detail ?? detail; } catch {}
    onError(detail);
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(part.slice(6));
          if (event.token) onToken(event.token);
          if (event.done) onDone(event);
          if (event.error) onError(event.error);
        } catch {}
      }
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") onError(String(e));
  }
}

// SSE via EventSource (GET only — used for Q&A)
export function streamGet(
  url: string,
  onToken: (token: string) => void,
  onDone: (data: Record<string, unknown>) => void,
  onError: (msg: string) => void
): () => void {
  const es = new EventSource(url, { withCredentials: true });

  es.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data);
      if (event.token) onToken(event.token);
      if (event.done) { onDone(event); es.close(); }
      if (event.error) { onError(event.error); es.close(); }
    } catch {}
  };

  es.onerror = () => { onError("Connection error"); es.close(); };

  return () => es.close();
}
