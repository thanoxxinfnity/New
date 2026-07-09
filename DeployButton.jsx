import { useState } from "react";
import { Check, Copy, Rocket } from "lucide-react";

export default function DeployButton({ url, onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — button still visually confirms nothing broke */
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleCopy}
        className="sweep-wrap group relative flex items-center gap-2 px-5 py-2.5 rounded-xl
                   bg-orange text-white font-body font-semibold text-sm
                   border-b-4 border-orange-deep
                   active:border-b-0 active:translate-y-1
                   transition-transform duration-100 shadow-ink"
      >
        {copied ? <Check size={16} /> : <Rocket size={16} />}
        {copied ? "Copied" : "Copy backend endpoint"}
        <span className="sweep-bar opacity-0 group-hover:opacity-100 group-hover:animate-sweep" />
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs text-inksoft hover:text-orange transition-colors font-mono"
      >
        <Copy size={12} /> {url}
      </button>
    </div>
  );
}
