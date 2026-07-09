import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Toast({ toast }) {
  return (
    <div className="fixed top-4 right-4 z-30 space-y-2">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            exit={{ opacity: 0, y: -10 }}
            className={`ink-border px-3 py-2 text-xs font-mono shadow-ink ${
              toast.type === "error" ? "bg-orange text-white" : "bg-card"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DiagnosticsDrawer({ open, onClose, payload }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="fixed top-0 right-0 h-full w-full sm:w-80 bg-card ink-border z-40 p-4 void-scroll overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base">Diagnostics</h3>
            <button onClick={onClose} aria-label="close">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-inksoft mb-2">Last outbound request payload:</p>
          <pre className="text-[11px] font-mono bg-paper/60 p-3 rounded-xl whitespace-pre-wrap break-words">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
