import { colors } from "./colors.js";
import { spacing } from "./spacing.js";
import { typography } from "./typography.js";
import { shadows } from "./shadows.js";
import { radii } from "./radii.js";

// Export themed helper hooks/classes for active runtime theme matching
export const themes = {
  getThemeClasses: (isDark) => {
    const c = isDark ? colors.dark : colors.light;
    return {
      bg: c.background,
      card: `${c.card} ${shadows.glass} ${radii.lg} border ${c.border}`,
      border: c.border,
      textPrimary: c.textPrimary,
      textSecondary: c.textSecondary,
      primaryGradient: c.primary,
      accent: c.accent,
      input: `w-full h-10 px-3 ${radii.sm} border ${c.border} bg-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition duration-200`,
      buttonPrimary: `bg-gradient-to-r ${c.primary} text-white font-medium ${spacing.gap.sm} inline-flex items-center justify-center px-4 py-2 ${radii.md} shadow-md transition duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50`,
      buttonSecondary: `bg-white/10 dark:bg-white/5 border ${c.border} text-slate-800 dark:text-white font-medium inline-flex items-center justify-center px-4 py-2 ${radii.md} shadow-sm backdrop-blur-sm transition duration-200 hover:bg-slate-100 dark:hover:bg-white/15 active:scale-[0.99] disabled:opacity-50`,
    };
  }
};
