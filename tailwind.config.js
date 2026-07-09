/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--void-paper)",
        ink: "var(--void-ink)",
        inksoft: "var(--void-ink-soft)",
        line: "var(--void-line)",
        card: "var(--void-card)",
        orange: {
          DEFAULT: "var(--void-orange)",
          deep: "var(--void-orange-deep)"
        }
      },
      fontFamily: {
        display: ["'Klee One'", "cursive"],
        body: ["'Zen Kaku Gothic New'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      boxShadow: {
        ink: "2px 2px 0 var(--void-line)",
        "ink-lg": "4px 4px 0 var(--void-line)",
        "3d": "0 5px 0 var(--void-orange-deep)",
        "3d-active": "0 1px 0 var(--void-orange-deep)"
      },
      keyframes: {
        speedline: {
          "0%": { transform: "scaleX(0)", opacity: "0.9" },
          "100%": { transform: "scaleX(1)", opacity: "0" }
        },
        floatpetal: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "0.6" },
          "100%": { transform: "translateY(-110vh) rotate(220deg)", opacity: "0" }
        },
        spinslow: {
          to: { transform: "rotate(360deg)" }
        },
        spinreverse: {
          to: { transform: "rotate(-360deg)" }
        },
        sweep: {
          "0%": { transform: "translateX(-120%) skewX(-20deg)" },
          "100%": { transform: "translateX(220%) skewX(-20deg)" }
        }
      },
      animation: {
        speedline: "speedline 0.5s ease-out forwards",
        floatpetal: "floatpetal linear infinite",
        spinslow: "spinslow 3s linear infinite",
        spinreverse: "spinreverse 4s linear infinite",
        sweep: "sweep 1.2s ease-in-out"
      }
    }
  },
  plugins: []
};
