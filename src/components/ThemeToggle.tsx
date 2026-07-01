import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "motion/react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check local storage or system preference
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true; // Default to dark mode for a professional aesthetic
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      id="theme-toggle-btn"
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 cursor-pointer transition-colors duration-200 flex items-center justify-center"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        <motion.div
          animate={{
            y: isDark ? 0 : 30,
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : 45,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute"
        >
          <Moon className="w-5 h-5 text-indigo-400" />
        </motion.div>
        <motion.div
          animate={{
            y: isDark ? -30 : 0,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? -45 : 0,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute"
        >
          <Sun className="w-5 h-5 text-amber-500" />
        </motion.div>
      </div>
      <span className="sr-only">{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}
