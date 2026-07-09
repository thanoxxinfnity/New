import { useEffect, useRef, useState } from "react";
import { Copy, Check, User, Sparkles } from "lucide-react";

// Minimal, dependency-free markdown: bold, inline code, blockquote, lists.
function renderMarkdown(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("> ")) {
      return (
        <p key={i} className="void-quote my-1">
          {line.slice(2)}
        </p>
      );
    }
    if (/^[-*]\s/.test(line)) {
      return (
        <li key={i} className="ml-4 list-disc">
          {inline(line.replace(/^[-*]\s/, ""))}
        </li>
      );
    }
    if (!line.trim()) return <br key={i} />;
    return (
      <p key={i} className="my-0.5 leading-relaxed">
        {inline(line)}
      </p>
    );
  });
}

function inline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={i} className="px-1 py-0.5 rounded bg-orange/10 text-orange font-mono text-[0.85em]">
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
}

function Typewriter({ text, onDone }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const step = Math.max(1, Math.round(text.length / 140));
    const id = setInterval(() => {
      i += step;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, 12);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return <>{renderMarkdown(shown)}</>;
}

export default function ChatStream({ messages, streamingId }) {
  const [copiedId, setCopiedId] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingId]);

  const copy = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto void-scroll px-1 py-4 space-y-4">
      {messages.map((m) => (
        <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
          <div
            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ink-border ${
              m.role === "user" ? "bg-orange/10" : "bg-orange text-white"
            }`}
          >
            {m.role === "user" ? <User size={13} /> : <Sparkles size={13} />}
          </div>
          <div
            className={`group relative max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ink-border screentone ${
              m.role === "user" ? "bg-orange/10" : "bg-card"
            }`}
          >
            {m.id === streamingId ? <Typewriter text={m.text} /> : renderMarkdown(m.text)}
            <button
              onClick={() => copy(m.id, m.text)}
              className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity
                         bg-card ink-border rounded-full p-1 text-inksoft hover:text-orange"
              aria-label="copy message"
            >
              {copiedId === m.id ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
