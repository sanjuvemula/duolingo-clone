import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Baloo_2 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Applies the saved theme before the browser paints.
 *
 * Without this, the page renders light, React hydrates, and only then applies
 * a stored "dark" — a white flash on every load for dark-mode users.
 *
 * Delivered via next/script with strategy="beforeInteractive", the documented
 * way to get a script into the initial HTML ahead of any framework code.
 *
 * THEME_STORAGE_KEY is imported from lib/theme, not from ThemeProvider, and
 * that matters: this file is a server component, so importing the constant
 * from a "use client" module yields a client-reference proxy rather than the
 * string. The script would then read `localStorage.getItem(undefined)` —
 * present, executing, and silently doing nothing.
 *
 * "system" deliberately writes nothing, leaving the prefers-color-scheme media
 * query in charge.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {
    /* private mode / storage disabled — fall back to the media query */
  }
})();
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Duolingo Clone — Korean",
  description:
    "A Duolingo-style language learning app for Korean, built with Next.js and FastAPI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${baloo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
