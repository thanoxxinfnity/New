import { useEffect, useRef } from "react";

// Lightweight decorative petal/ash particles. Pure CSS-driven divs rather
// than a heavy canvas loop, so it costs almost nothing on low-end mobiles.
export default function AmbientCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const count = window.innerWidth < 640 ? 8 : 16;
    const particles = [];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      const size = 3 + Math.random() * 4;
      p.style.position = "absolute";
      p.style.left = Math.random() * 100 + "%";
      p.style.bottom = "-10px";
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.borderRadius = "2px";
      p.style.background = "var(--void-orange)";
      p.style.opacity = "0";
      p.style.animation = `floatpetal ${10 + Math.random() * 12}s linear infinite`;
      p.style.animationDelay = Math.random() * 10 + "s";
      el.appendChild(p);
      particles.push(p);
    }
    return () => particles.forEach((p) => p.remove());
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
    />
  );
}
