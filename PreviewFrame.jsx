import { useEffect, useMemo, useState } from "react";
import { Smartphone, Tablet, Monitor, RotateCw, Code2, Eye } from "lucide-react";

const DEVICES = {
  mobile: { w: 375, h: 667, icon: Smartphone },
  tablet: { w: 768, h: 1024, icon: Tablet },
  desktop: { w: "100%", h: 520, icon: Monitor }
};

function assembleHtml(files) {
  const html = files.find((f) => f.name.endsWith(".html"));
  const css = files.filter((f) => f.name.endsWith(".css")).map((f) => f.content).join("\n");
  const js = files.filter((f) => f.name.endsWith(".js")).map((f) => f.content).join("\n");

  if (!html) {
    return `<!doctype html><html><head><style>${css}</style></head><body>${js ? `<script>${js}<\/script>` : ""}</body></html>`;
  }

  let doc = html.content;
  if (!/<style[\s>]/.test(doc) && css) {
    doc = doc.replace("</head>", `<style>${css}</style></head>`);
  }
  if (!/app\.js|<script/.test(doc) && js) {
    doc = doc.replace("</body>", `<script>${js}<\/script></body>`);
  }
  return doc;
}

export default function PreviewFrame({ files, activeFile }) {
  const [device, setDevice] = useState("desktop");
  const [landscape, setLandscape] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [logs, setLogs] = useState([]);

  const srcDoc = useMemo(() => (files?.length ? assembleHtml(files) : ""), [files]);

  useEffect(() => {
    setLogs([]);
  }, [srcDoc]);

  const handleFrameLoad = () => {
    setLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] preview reloaded`]);
  };

  const dims = DEVICES[device];
  const width = landscape && device !== "desktop" ? dims.h : dims.w;
  const height = landscape && device !== "desktop" ? dims.w : dims.h;

  if (!files?.length) {
    return (
      <div className="ink-border bg-card flex-1 flex items-center justify-center text-inksoft text-sm p-8 text-center">
        Ask VOID to build something — the live preview will render here.
      </div>
    );
  }

  return (
    <div className="ink-border bg-card flex-1 flex flex-col min-h-[320px]">
      <div className="flex flex-wrap items-center gap-2 p-2 border-b border-line/30">
        {Object.entries(DEVICES).map(([key, d]) => {
          const Icon = d.icon;
          return (
            <button
              key={key}
              onClick={() => setDevice(key)}
              className={`p-1.5 rounded-lg transition-colors ${
                device === key ? "bg-orange text-white" : "hover:bg-orange/10 text-inksoft"
              }`}
              aria-label={key}
            >
              <Icon size={15} />
            </button>
          );
        })}
        {device !== "desktop" && (
          <button
            onClick={() => setLandscape((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-orange/10 text-inksoft"
            aria-label="rotate"
          >
            <RotateCw size={15} />
          </button>
        )}
        <button
          onClick={() => setShowSource((v) => !v)}
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono
                     hover:bg-orange/10 text-inksoft"
        >
          {showSource ? <Eye size={13} /> : <Code2 size={13} />}
          {showSource ? "Preview" : "Source"}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-paper/40 p-3 overflow-auto void-scroll">
        {showSource ? (
          <pre className="w-full h-full text-xs font-mono whitespace-pre-wrap p-3 text-ink void-scroll overflow-auto">
            {activeFile?.content || srcDoc}
          </pre>
        ) : (
          <iframe
            title="void-preview"
            srcDoc={srcDoc}
            onLoad={handleFrameLoad}
            style={{ width, height }}
            className="ink-border bg-white max-w-full"
            sandbox="allow-scripts"
          />
        )}
      </div>

      <div className="border-t border-line/30 bg-ink/90 dark:bg-black/40 px-3 py-2 font-mono text-[10px] text-orange/90 void-scroll overflow-y-auto max-h-16">
        {logs.length === 0 ? (
          <span className="text-inksoft/60">console idle</span>
        ) : (
          logs.map((l, i) => <div key={i}>{l}</div>)
        )}
      </div>
    </div>
  );
}
