"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

export type { Theme };

interface ThemeContextValue {
  theme: Theme;
  /** What's actually on screen right now — "system" resolved against the OS. */
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme state, persisted to localStorage and mirrored onto
 * `<html data-theme>` for the CSS in globals.css to key off.
 *
 * "system" removes the attribute entirely rather than writing a resolved
 * value, which is what lets the `prefers-color-scheme` media query take over —
 * and means the page follows the OS live if the user flips it, with no
 * listener needed for the styling itself.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemDark, setSystemDark] = useState(false);

  // Read the stored choice after mount. The inline script in layout.tsx has
  // already applied it to <html> before first paint; this only syncs React's
  // copy, so the toggle renders in the right position.
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(query.matches);

    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);

    if (next === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
    }
  }, []);

  const resolved: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
