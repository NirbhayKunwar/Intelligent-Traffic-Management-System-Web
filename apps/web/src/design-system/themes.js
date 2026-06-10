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
      bg: `${c.background} transition-colors duration-300`,
      card: `${c.card} ${shadows.glass} ${radii.lg} border ${c.border} transition-all duration-300`,
      border: `${c.border} transition-colors duration-300`,
      textPrimary: `${c.textPrimary} transition-colors duration-300`,
      textSecondary: `${c.textSecondary} transition-colors duration-300`,
      primaryGradient: c.primary,
      accent: c.accent,
      input: `w-full h-11 px-3.5 ${radii.sm} border ${c.border} bg-[var(--theme-input-bg)] text-theme-text-primary placeholder:text-theme-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-theme-accent/30 transition duration-200`,
      buttonPrimary: `bg-gradient-to-r ${c.primary} text-white font-semibold ${spacing.gap.sm} inline-flex items-center justify-center px-4 h-11 ${radii.md} shadow-md transition-all duration-200 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed`,
      buttonSecondary: `bg-[var(--theme-button-secondary-bg)] border ${c.border} text-theme-text-primary font-medium inline-flex items-center justify-center px-4 h-11 ${radii.md} shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-[var(--theme-button-secondary-hover)] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed`,
    };
  }
};
