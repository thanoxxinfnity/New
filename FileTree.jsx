import { FileCode2, FileJson, FileText, Braces } from "lucide-react";

function iconFor(name) {
  if (name.endsWith(".html")) return <FileCode2 size={15} className="text-orange" />;
  if (name.endsWith(".css")) return <Braces size={15} className="text-orange" />;
  if (name.endsWith(".json")) return <FileJson size={15} className="text-orange" />;
  return <FileText size={15} className="text-orange" />;
}

function bytes(str) {
  return new Blob([str]).size;
}

export default function FileTree({ files, activeFile, onSelect }) {
  if (!files?.length) return null;
  const totalBytes = files.reduce((sum, f) => sum + bytes(f.content), 0);

  return (
    <div className="ink-border bg-card p-3 void-scroll overflow-y-auto max-h-56">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-inksoft">
          Project files
        </span>
        <span className="font-mono text-[11px] text-inksoft">{totalBytes} B</span>
      </div>
      <ul className="space-y-1">
        {files.map((f) => (
          <li key={f.name}>
            <button
              onClick={() => onSelect(f)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm font-mono
                          transition-colors ${
                            activeFile?.name === f.name
                              ? "bg-orange/15 text-orange"
                              : "hover:bg-orange/5 text-ink"
                          }`}
            >
              {iconFor(f.name)}
              {f.name}
              <span className="ml-auto text-[10px] text-inksoft">{bytes(f.content)}B</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
