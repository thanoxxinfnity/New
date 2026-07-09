import { useCallback, useRef, useState } from "react";

// All sound effects are synthesized with the Web Audio API at runtime.
// This avoids bundling/loading external audio files that could 404 on deploy.
export function useSound() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem("void-sound");
    return saved === null ? true : saved === "true";
  });
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctxRef.current = new AudioCtx();
    }
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (freq, duration, type = "sine", gainStart = 0.08) => {
      if (!enabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainStart, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    [enabled, getCtx]
  );

  const playTick = useCallback(() => tone(720, 0.05, "square", 0.03), [tone]);
  const playSuccess = useCallback(() => {
    tone(392, 0.12, "sine", 0.06);
    setTimeout(() => tone(587, 0.18, "sine", 0.06), 90);
  }, [tone]);
  const playSlash = useCallback(() => {
    tone(1200, 0.06, "sawtooth", 0.05);
    setTimeout(() => tone(200, 0.12, "sawtooth", 0.04), 40);
  }, [tone]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      localStorage.setItem("void-sound", String(!prev));
      return !prev;
    });
  }, []);

  return { enabled, toggle, playTick, playSuccess, playSlash };
}
