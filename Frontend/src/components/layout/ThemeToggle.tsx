"use client";

import { useTheme, type Theme } from "@/providers/ThemeProvider";

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "Auto", icon: "💻" },
];

/** Three-way theme picker: explicit light, explicit dark, or follow the OS.
 *
 * "Auto" is a real third state rather than a light/dark switch, because
 * removing the override is the only way to keep tracking the OS setting if the
 * user changes it later. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex gap-1 rounded-2xl border-2 border-stone-light p-1"
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-display text-xs font-bold transition"
            style={{
              background: active ? "var(--green)" : "transparent",
              color: active ? "#fff" : "var(--ink-soft)",
            }}
          >
            <span aria-hidden="true">{option.icon}</span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
