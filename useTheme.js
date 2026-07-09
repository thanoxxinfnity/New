import { useCallback, useEffect, useState } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      // Only follow the OS automatically if the user hasn't overridden it.
      if (!localStorage.getItem("void-theme")) {
        setIsDark(e.matches);
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("void-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  const resetToSystem = useCallback(() => {
    localStorage.removeItem("void-theme");
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(system);
    document.documentElement.classList.toggle("dark", system);
  }, []);

  return { isDark, toggle, resetToSystem };
}
