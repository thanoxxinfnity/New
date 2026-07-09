// Hardcoded backend proxy — Tejas Singh's Replit endpoint.
// No key inputs exist anywhere in this app on purpose: all secrets live
// server-side inside the Replit environment, never in this frontend.
export const VOID_ENDPOINT =
  "https://8cc32098-c284-4b41-9ee0-3637c3e789e7-00-1gia523j9bn64.sisko.replit.dev/api/generate";

const FRIENDLY_ERRORS = {
  400: "VOID couldn't read that request. Try rephrasing the prompt.",
  401: "Backend rejected the connection. Check the Replit secrets are still set.",
  403: "Backend refused this request. It may be rate-limited or blocked.",
  404: "The /api/generate route wasn't found on the Replit backend. Confirm the deployment is awake.",
  429: "Too many requests — the backend is asking VOID to slow down.",
  500: "The backend hit an internal error while generating.",
  502: "The Replit server is asleep or restarting. Wake it and try again.",
  503: "Backend temporarily unavailable. Retry in a few seconds."
};

export function friendlyError(status) {
  return (
    FRIENDLY_ERRORS[status] ||
    `Unexpected response (status ${status}). Check the diagnostics drawer for details.`
  );
}

// Basic input sanitation before dispatch — trims, collapses whitespace,
// strips control characters.
export function sanitizePrompt(raw) {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Strips accidental ```markdown fences from generated file contents so the
// preview iframe never renders literal backticks.
export function stripFences(text = "") {
  return text
    .replace(/^```[a-zA-Z]*\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();
}

// Sends the prompt to the hardcoded proxy. Returns a normalized shape:
// { mode: "chat", text } or { mode: "build", files: [{name, content}] }
export async function sendToVoid(prompt, { signal } = {}) {
  const res = await fetch(VOID_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal
  });

  if (!res.ok) {
    const err = new Error(friendlyError(res.status));
    err.status = res.status;
    throw err;
  }

  const data = await res.json().catch(() => {
    throw new Error("Backend returned a response VOID couldn't parse as JSON.");
  });

  return normalizeResponse(data);
}

// Auto-detects chat vs website-build responses so the UI can route into
// the right panel without the user picking a mode manually.
function normalizeResponse(data) {
  if (Array.isArray(data?.files) && data.files.length > 0) {
    return {
      mode: "build",
      files: data.files.map((f) => ({
        name: f.name || f.filename || "untitled.txt",
        content: stripFences(f.content ?? f.code ?? "")
      })),
      note: data.note || data.message || ""
    };
  }

  const text =
    typeof data === "string"
      ? data
      : data?.text ?? data?.message ?? data?.reply ?? JSON.stringify(data);

  return { mode: "chat", text: String(text) };
}

// --- Local session helpers -------------------------------------------------

const HISTORY_KEY = "void-history-v1";
const COUNTER_KEY = "void-gen-count";

// Very lightweight obfuscation (NOT real encryption) so cached prompts
// aren't sitting in plain text if someone opens devtools on a shared device.
function obfuscate(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function deobfuscate(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return "";
  }
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(deobfuscate(raw));
  } catch {
    return [];
  }
}

export function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, obfuscate(JSON.stringify(entries)));
  } catch {
    /* storage full or blocked — fail silently, chat still works in-memory */
  }
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function bumpGenerationCount() {
  const n = Number(localStorage.getItem(COUNTER_KEY) || 0) + 1;
  localStorage.setItem(COUNTER_KEY, String(n));
  return n;
}

export function getGenerationCount() {
  return Number(localStorage.getItem(COUNTER_KEY) || 0);
}

// Offline sandbox mode — lets you test the UI without the Replit backend awake.
export function mockResponse(prompt) {
  const wantsSite = /build|website|site|landing|page|app/i.test(prompt);
  if (wantsSite) {
    return {
      mode: "build",
      files: [
        {
          name: "index.html",
          content:
            "<!doctype html>\n<html>\n<head><title>Sandbox Preview</title></head>\n<body>\n<h1>Sandbox mode</h1>\n<p>This is a mock file — connect the real backend to generate for real.</p>\n</body>\n</html>"
        },
        { name: "styles.css", content: "body{font-family:sans-serif;padding:2rem;}" },
        { name: "app.js", content: "console.log('sandbox build — no live backend call made');" }
      ],
      note: "Sandbox mode: no request was sent to the backend."
    };
  }
  return {
    mode: "chat",
    text: `Sandbox reply (offline): I received "${prompt}". Turn off sandbox mode to talk to the real backend.`
  };
}
