import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Download, Sparkles } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import Sidebar from "./components/Sidebar";
import ChatStream from "./components/ChatStream";
import FileTree from "./components/FileTree";
import PreviewFrame from "./components/PreviewFrame";
import DeployButton from "./components/DeployButton";
import MagicCircleLoader from "./components/MagicCircleLoader";
import { Toast, DiagnosticsDrawer } from "./components/Overlays";
import AmbientCanvas from "./components/AmbientCanvas";

import { useTheme } from "./hooks/useTheme";
import { useSound } from "./hooks/useSound";
import {
  sendToVoid,
  mockResponse,
  sanitizePrompt,
  loadHistory,
  saveHistory,
  clearHistory,
  bumpGenerationCount,
  getGenerationCount,
  VOID_ENDPOINT
} from "./lib/api";

const PILLS = [
  "Build a landing page for a coffee brand",
  "Explain this like I'm five",
  "Make a pricing table component",
  "Summarize this idea in three lines"
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up, huh?";
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  if (h < 21) return "Good evening.";
  return "Working late in the VOID.";
}

let idCounter = 0;
const nextId = () => `${Date.now()}-${idCounter++}`;

export default function App() {
  const { isDark, toggle: toggleTheme } = useTheme();
  const sound = useSound();

  const [messages, setMessages] = useState(() => loadHistory());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [buildFiles, setBuildFiles] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [sandbox, setSandbox] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [focusMode, setFocusMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [lastPayload, setLastPayload] = useState(null);
  const [genCount, setGenCount] = useState(getGenerationCount());
  const abortRef = useRef(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const showToast = (text, type = "info") => {
    setToast({ text, type, key: nextId() });
    setTimeout(() => setToast(null), 2600);
  };

  const handleSend = async (promptOverride) => {
    const raw = promptOverride ?? input;
    const clean = sanitizePrompt(raw);
    if (!clean || busy) return;

    sound.playTick();
    const userMsg = { id: nextId(), role: "user", text: clean };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    setLastPayload({ url: VOID_ENDPOINT, method: "POST", body: { prompt: clean }, sandbox });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = sandbox
        ? await new Promise((res) => setTimeout(() => res(mockResponse(clean)), 700))
        : await sendToVoid(clean, { signal: controller.signal });

      const count = bumpGenerationCount();
      setGenCount(count);

      if (result.mode === "build") {
        setBuildFiles(result.files);
        setActiveFile(result.files[0]);
        sound.playSlash();
        const replyText =
          (result.note ? result.note + "\n\n" : "") +
          "Files are staged in the workspace panel. What shall we manifest in the VOID today?";
        const botMsg = { id: nextId(), role: "assistant", text: replyText };
        setMessages((m) => [...m, botMsg]);
        setStreamingId(botMsg.id);
        setTimeout(() => sound.playSuccess(), 250);
      } else {
        const botMsg = { id: nextId(), role: "assistant", text: result.text };
        setMessages((m) => [...m, botMsg]);
        setStreamingId(botMsg.id);
      }
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
      const botMsg = {
        id: nextId(),
        role: "assistant",
        text: `⚠️ ${err.message || "Request failed."}`
      };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    clearHistory();
    setMessages([]);
    setBuildFiles(null);
    setActiveFile(null);
    showToast("Session cleared.");
  };

  const handleDownloadZip = async () => {
    if (!buildFiles?.length) return;
    const zip = new JSZip();
    buildFiles.forEach((f) => zip.file(f.name, f.content));
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "void-project.zip");
    showToast("Project bundle downloaded.");
  };

  const wordCount = useMemo(
    () => (input.trim() ? input.trim().split(/\s+/).length : 0),
    [input]
  );

  return (
    <div className="relative min-h-screen flex flex-col sm:flex-row overflow-hidden">
      <AmbientCanvas />

      <Sidebar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        soundOn={sound.enabled}
        onToggleSound={sound.toggle}
        sandbox={sandbox}
        onToggleSandbox={() => setSandbox((s) => !s)}
        online={online}
        onClearSession={handleClear}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((f) => !f)}
        genCount={genCount}
        onOpenDiagnostics={() => setDiagOpen(true)}
      />

      <main className="relative z-10 flex-1 flex flex-col min-h-screen p-3 sm:p-5 gap-3 sm:gap-4">
        <motion.header
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 14 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-xl sm:text-2xl">{greeting()}</h1>
            <p className="text-xs text-inksoft">Ask, or ask to build. VOID figures out which.</p>
            <span
              key={busy ? "busy" : "idle"}
              className="block h-[2px] w-14 bg-orange origin-left animate-speedline"
            />
          </div>
          <Sparkles className="text-orange animate-pulse" size={20} />
        </motion.header>

        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Chat column */}
          <section className="flex flex-col flex-1 min-h-0 lg:max-w-[46%]">
            <ChatStream messages={messages} streamingId={streamingId} />

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {PILLS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="screentone ink-border bg-card px-3 py-1.5 rounded-full text-xs hover:bg-orange/10 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="ink-border bg-card p-2 flex items-end gap-2"
            >
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Talk to VOID, or ask it to build something…"
                  className="w-full resize-none bg-transparent outline-none text-sm py-1.5 max-h-28 void-scroll"
                  disabled={busy}
                />
                <div className="text-[10px] text-inksoft/70 font-mono px-0.5">
                  {wordCount} words
                </div>
              </div>
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="p-2.5 rounded-xl bg-orange text-white border-b-4 border-orange-deep
                           active:border-b-0 active:translate-y-1 disabled:opacity-40 disabled:active:translate-y-0
                           transition-transform"
                aria-label="send"
              >
                <Send size={16} />
              </button>
            </form>
          </section>

          {/* Workspace column */}
          <section className="flex-1 flex flex-col gap-3 min-h-0">
            <AnimatePresence mode="wait">
              {busy && !buildFiles ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ink-border bg-card flex-1 flex items-center justify-center"
                >
                  <MagicCircleLoader />
                </motion.div>
              ) : (
                <motion.div
                  key="workspace"
                  initial={{ opacity: 0, scaleX: 0.98 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.35 }}
                  className="flex-1 flex flex-col gap-3 min-h-0"
                >
                  {buildFiles && (
                    <>
                      <FileTree files={buildFiles} activeFile={activeFile} onSelect={setActiveFile} />
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <DeployButton url={VOID_ENDPOINT} onCopy={() => showToast("Copied.")} />
                        <button
                          onClick={handleDownloadZip}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl ink-border bg-card text-xs hover:bg-orange/10"
                        >
                          <Download size={13} /> Download .zip
                        </button>
                      </div>
                    </>
                  )}
                  <PreviewFrame files={buildFiles} activeFile={activeFile} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        <footer className="text-center text-[10px] text-inksoft/50 font-mono pt-1">
          VOID · Tejas Singh Private Edition · not affiliated with Anthropic
        </footer>
      </main>

      <Toast toast={toast} />
      <DiagnosticsDrawer open={diagOpen} onClose={() => setDiagOpen(false)} payload={lastPayload} />
    </div>
  );
}
