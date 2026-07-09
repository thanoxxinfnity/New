# VOID — AI Orchestrator (Tejas Singh Private Edition)

## Local run

```bash
npm install
npm run dev
```

## Vercel pe deploy karne ka tareeka

1. Ye poora folder ek GitHub repo mein push karo.
2. Vercel pe "New Project" → apna repo import karo.
3. Framework Preset **Vite** auto-detect ho jayega. Build command `npm run build`,
   output directory `dist` — kuch bhi manually set karne ki zaroorat nahi.
4. Deploy dabao. Koi environment variable ki zaroorat nahi hai frontend mein —
   backend proxy URL already `src/lib/api.js` mein hardcoded hai.

## Kya hai isme

- Auto light/dark theme (system default follow karta hai, manual toggle bhi hai)
- Chat + website-build dono mode, backend response se auto-detect hota hai
- Live iframe preview, mobile/tablet/desktop viewport switch
- File tree + source viewer + `.zip` download (JSZip)
- Local session history (localStorage), sandbox/offline test mode
- Sound effects (synthesized, koi external audio file nahi — 404 ka risk zero)
- Hand-drawn ink-border cel-shaded anime UI, orange accent, ambient particles

## Note

Backend Replit server so jaata hai agar inactive rahe — agar "backend
unavailable" error aaye to pehle Replit URL browser mein khol ke usko jagao,
phir VOID mein try karo. Isi wajah se Sandbox mode diya gaya hai taaki backend
ke bina bhi UI test kar sako.
