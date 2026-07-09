import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  WifiOff,
  Wifi,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
  Hash
} from "lucide-react";

export default function Sidebar({
  isDark,
  onToggleTheme,
  soundOn,
  onToggleSound,
  sandbox,
  onToggleSandbox,
  online,
  onClearSession,
  focusMode,
  onToggleFocus,
  genCount,
  onOpenDiagnostics
}) {
  if (focusMode) {
    return (
      <button
        onClick={onToggleFocus}
        className="fixed top-4 left-4 z-20 ink-border bg-card p-2 rounded-xl shadow-ink"
        aria-label="expand sidebar"
      >
        <PanelLeftOpen size={16} />
      </button>
    );
  }

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className="w-full sm:w-60 shrink-0 flex sm:flex-col gap-3 sm:gap-2 p-3 sm:h-full
                 sm:border-r border-line/30 overflow-x-auto sm:overflow-visible"
    >
      <div className="hidden sm:flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange animate-pulse" />
          <span className="font-display text-lg tracking-wide">VOID</span>
        </div>
        <button onClick={onToggleFocus} aria-label="collapse sidebar" className="text-inksoft hover:text-orange">
          <PanelLeftClose size={16} />
        </button>
      </div>

      <ControlButton
        icon={isDark ? <Sun size={14} /> : <Moon size={14} />}
        label={isDark ? "Light" : "Dark"}
        onClick={onToggleTheme}
      />
      <ControlButton
        icon={soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
        label="Sound"
        active={soundOn}
        onClick={onToggleSound}
      />
      <ControlButton
        icon={sandbox ? <WifiOff size={14} /> : <Wifi size={14} />}
        label={sandbox ? "Sandbox" : "Live"}
        active={sandbox}
        onClick={onToggleSandbox}
      />
      <ControlButton icon={<Trash2 size={14} />} label="Clear" onClick={onClearSession} />
      <ControlButton icon={<Wrench size={14} />} label="Diagnostics" onClick={onOpenDiagnostics} />

      <div className="hidden sm:flex items-center gap-1.5 mt-auto pt-3 border-t border-line/30 text-[11px] text-inksoft">
        <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-green-500" : "bg-red-500"}`} />
        {online ? "Backend link nominal" : "Offline"}
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[11px] text-inksoft">
        <Hash size={11} /> {genCount} generations this device
      </div>
      <div className="hidden sm:block text-[10px] text-inksoft/60 font-mono pt-1">
        Tejas Singh — Private Edition
      </div>
    </motion.aside>
  );
}

function ControlButton({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`screentone flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-medium
                  ink-border transition-colors ${
                    active ? "bg-orange text-white" : "bg-card hover:bg-orange/10"
                  }`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
