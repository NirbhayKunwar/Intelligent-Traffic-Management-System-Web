// Colors definition matching design requirements.
// The colors system is strictly structured around the 60-30-10 golden design rule:
// - 60% Dominant Color (Background Canvas): Slate-50 for light mode, Slate-950 for dark mode.
// - 30% Secondary Color (Structural elements like Cards, Borders, Typography): White/Slate-900 cards, Slate borders, and Slate primary/secondary text.
// - 10% Accent Color (Call-To-Actions, interactive highlights, active states): Vibrant Cyan and Indigo gradients.
export const colors = {
  light: {
    // 60% Dominant
    background: "bg-slate-50",

    // 30% Secondary (Surfaces & Typography)
    card: "bg-white",
    border: "border-slate-200",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-500",

    // 10% Accent (Interactive & Focus)
    primary: "from-cyan-600 to-indigo-600",
    accent: "text-cyan-600",
  },
  dark: {
    // 60% Dominant
    background: "bg-slate-950",

    // 30% Secondary (Surfaces & Typography)
    card: "bg-slate-900/60",
    border: "border-white/10",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-400",

    // 10% Accent (Interactive & Focus)
    primary: "from-cyan-400 to-indigo-400",
    accent: "text-cyan-400",
  },
  status: {
    online: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    warning: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    offline: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  }
};
