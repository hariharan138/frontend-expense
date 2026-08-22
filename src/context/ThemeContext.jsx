import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// light/dark RGB triplets for each accent option, reusing the app's existing
// vivid-* / semantic dark colors so new themes stay visually consistent.
export const COLOR_THEMES = [
  { id: "violet", label: "Violet", light: "124 58 237", dark: "139 92 246" },
  { id: "sky", label: "Sky", light: "59 130 246", dark: "96 165 250" },
  { id: "mint", label: "Mint", light: "31 157 85", dark: "74 222 128" },
  { id: "coral", label: "Coral", light: "226 89 60", dark: "248 113 113" },
  { id: "cream", label: "Gold", light: "192 138 30", dark: "250 204 21" },
  { id: "pink", label: "Rose", light: "209 71 111", dark: "244 114 182" },
];

export const FONT_OPTIONS = [
  { id: "inter", label: "Inter", stack: '"Inter", ui-sans-serif, system-ui, sans-serif' },
  { id: "poppins", label: "Poppins", stack: '"Poppins", ui-sans-serif, system-ui, sans-serif' },
  { id: "manrope", label: "Manrope", stack: '"Manrope", ui-sans-serif, system-ui, sans-serif' },
  { id: "roboto", label: "Roboto", stack: '"Roboto", ui-sans-serif, system-ui, sans-serif' },
  { id: "lora", label: "Lora", stack: '"Lora", ui-serif, Georgia, serif' },
  { id: "prociono", label: "Prociono", stack: '"Prociono", ui-serif, Georgia, serif' },
  { id: "jetbrains", label: "JetBrains Mono", stack: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [colorTheme, setColorTheme] = useState(
    () => localStorage.getItem("color-theme") || "violet"
  );
  const [font, setFont] = useState(() => localStorage.getItem("app-font") || "inter");
  const [fontWeight, setFontWeight] = useState(
    () => localStorage.getItem("app-font-weight") || "normal"
  );
  const [fontStyle, setFontStyle] = useState(
    () => localStorage.getItem("app-font-style") || "normal"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const entry = COLOR_THEMES.find((c) => c.id === colorTheme) || COLOR_THEMES[0];
    const value = theme === "dark" ? entry.dark : entry.light;
    const root = document.documentElement.style;
    root.setProperty("--primary", value);
    root.setProperty("--ring", value);
    root.setProperty("--sidebar-primary", value);
    root.setProperty("--sidebar-ring", value);
    localStorage.setItem("color-theme", colorTheme);
  }, [colorTheme, theme]);

  useEffect(() => {
    const entry = FONT_OPTIONS.find((f) => f.id === font) || FONT_OPTIONS[0];
    document.documentElement.style.setProperty("--font-sans", entry.stack);
    localStorage.setItem("app-font", font);
  }, [font]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-weight",
      fontWeight === "bold" ? "700" : "400"
    );
    localStorage.setItem("app-font-weight", fontWeight);
  }, [fontWeight]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-style", fontStyle);
    localStorage.setItem("app-font-style", fontStyle);
  }, [fontStyle]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
        colorTheme,
        setColorTheme,
        font,
        setFont,
        fontWeight,
        setFontWeight,
        fontStyle,
        setFontStyle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
