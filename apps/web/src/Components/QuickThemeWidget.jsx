import React, { useState, useEffect, useRef } from "react";
import { Palette, Check } from "lucide-react";
import { colorThemesList, applyTheme } from "../design-system/themesList";
import { motion, AnimatePresence } from "framer-motion";
import { themes } from "../design-system/tokens";

export default function QuickThemeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("color-theme") || "sapphire-ocean";
    }
    return "sapphire-ocean";
  });
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    
    const handleColorThemeChanged = (e) => {
      setActiveTheme(e.detail);
    };
    window.addEventListener("color-theme-changed", handleColorThemeChanged);
    
    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      observer.disconnect();
      window.removeEventListener("color-theme-changed", handleColorThemeChanged);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectTheme = (themeId) => {
    setActiveTheme(themeId);
    if (typeof window !== "undefined") {
      localStorage.setItem("color-theme", themeId);
      applyTheme(themeId);
      window.dispatchEvent(new CustomEvent("color-theme-changed", { detail: themeId }));
    }
  };

  const t = themes.getThemeClasses(isDarkMode);

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-40 font-inter">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute bottom-14 right-0 w-72 max-h-[380px] overflow-y-auto p-4 rounded-2xl border ${t.border} bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl space-y-3 custom-scrollbar`}
          >
            <div className="border-b border-theme-border/40 pb-2">
              <h4 className="text-xs font-bold text-theme-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={14} className="text-theme-accent" /> Quick Themes
              </h4>
              <p className="text-[9px] text-theme-text-secondary mt-0.5 font-medium">Switch design profiles instantly with a single click.</p>
            </div>

            <div className="space-y-1.5">
              {colorThemesList.map((themeItem) => {
                const colorsToShow = isDarkMode ? themeItem.previewColors.dark : themeItem.previewColors.light;
                const isSelected = activeTheme === themeItem.id;
                
                return (
                  <button
                    key={themeItem.id}
                    type="button"
                    onClick={() => handleSelectTheme(themeItem.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex justify-between items-center ${
                      isSelected
                        ? "border-theme-accent bg-theme-accent/5 ring-1 ring-theme-accent/20"
                        : "border-transparent bg-theme-bg/15 hover:bg-theme-bg/35"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-theme-text-primary flex items-center gap-1">
                        {themeItem.name}
                        {isSelected && <Check size={11} className="text-theme-accent" />}
                      </span>
                      <span className="text-[9px] text-theme-text-secondary/80 block leading-tight">{themeItem.desc.slice(0, 48)}...</span>
                    </div>
                    <div className="flex gap-0.5 items-center shrink-0 ml-2">
                      {colorsToShow.map((c, i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-gradient-to-r from-theme-accent to-theme-accent-alt text-white flex items-center justify-center shadow-xl hover:shadow-theme-accent/20 hover:scale-105 active:scale-95 transition-all duration-200 group"
        aria-label="Quick Theme Selector"
      >
        <Palette size={20} className="group-hover:rotate-12 transition-transform duration-200" />
      </button>
    </div>
  );
}
