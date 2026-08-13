/**
 * Theme constants, kept in a module with no "use client" directive.
 *
 * This separation is load-bearing, not tidiness. The root layout is a server
 * component and inlines this key into a pre-paint script. Importing it from
 * ThemeProvider (a client module) would hand the server a client-reference
 * proxy instead of the string, and the script would silently read
 * `localStorage.getItem(undefined)` — present in the DOM, running, and doing
 * nothing. A neutral module is importable from both sides as a real value.
 */

export const THEME_STORAGE_KEY = "duolingo-clone:theme";

/** "system" follows the OS setting; the other two are explicit overrides. */
export type Theme = "light" | "dark" | "system";
