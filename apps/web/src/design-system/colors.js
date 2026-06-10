// Colors definition matching design requirements.
// The colors system is strictly structured around the 60-30-10 golden design rule.
// Design tokens bind directly to CSS variables to support dynamic runtime theme switches.
export const colors = {
  light: {
    // 60% Dominant Background
    background: "bg-theme-bg",

    // 30% Secondary (Surfaces & Typography)
    card: "bg-theme-card",
    border: "border-theme-border",
    textPrimary: "text-theme-text-primary",
    textSecondary: "text-theme-text-secondary",

    // 10% Accent (Interactive & Focus)
    primary: "from-theme-accent to-theme-accent-alt",
    accent: "text-theme-accent",
  },
  dark: {
    // 60% Dominant Background
    background: "bg-theme-bg",

    // 30% Secondary (Surfaces & Typography)
    card: "bg-theme-card",
    border: "border-theme-border",
    textPrimary: "text-theme-text-primary",
    textSecondary: "text-theme-text-secondary",

    // 10% Accent (Interactive & Focus)
    primary: "from-theme-accent to-theme-accent-alt",
    accent: "text-theme-accent",
  },
  status: {
    online: "text-theme-success bg-theme-success/10 border-theme-success/20",
    warning: "text-theme-warning bg-theme-warning/10 border-theme-warning/20",
    critical: "text-theme-error bg-theme-error/10 border-theme-error/20",
    offline: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  }
};
