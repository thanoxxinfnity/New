export default function MagicCircleLoader({ label = "Manifesting…" }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6" role="status" aria-live="polite">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange animate-spinslow" />
        <div className="absolute inset-2 rounded-full border border-line animate-spinreverse" />
        <div className="absolute inset-[18px] rounded-full bg-orange" />
      </div>
      <span className="font-mono text-xs tracking-wider text-inksoft">{label}</span>
    </div>
  );
}
