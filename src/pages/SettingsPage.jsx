import { Bold, Check, Italic, Moon, Palette, Sun, Type } from "lucide-react";
import { useTheme, COLOR_THEMES, FONT_OPTIONS } from "../context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { cn } from "../lib/utils";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    font,
    setFont,
    fontWeight,
    setFontWeight,
    fontStyle,
    setFontStyle,
  } = useTheme();

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="animate-fade-up border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="h-4 w-4" /> Mode
          </CardTitle>
          <p className="text-xs text-muted-foreground">Light or dark interface</p>
        </CardHeader>
        <CardContent>
          <div className="inline-flex rounded-lg border border-border p-1">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  theme === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up border-border shadow-card" style={{ animationDelay: "60ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" /> Theme Color
          </CardTitle>
          <p className="text-xs text-muted-foreground">Pick an accent color for the whole app</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {COLOR_THEMES.map((c) => {
              const swatch = `rgb(${theme === "dark" ? c.dark : c.light})`;
              const active = colorTheme === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorTheme(c.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors",
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: swatch }}
                  >
                    {active && <Check className="h-4 w-4 text-white" />}
                  </span>
                  <span className="text-xs font-medium">{c.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-up border-border shadow-card" style={{ animationDelay: "120ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4" /> Font
          </CardTitle>
          <p className="text-xs text-muted-foreground">Choose the typeface used across the app</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFontWeight(fontWeight === "bold" ? "normal" : "bold")}
              aria-pressed={fontWeight === "bold"}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                fontWeight === "bold"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Bold className="h-4 w-4" /> Bold
            </button>
            <button
              type="button"
              onClick={() => setFontStyle(fontStyle === "italic" ? "normal" : "italic")}
              aria-pressed={fontStyle === "italic"}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                fontStyle === "italic"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Italic className="h-4 w-4" /> Italic
            </button>
          </div>

          <div className="space-y-2">
            {FONT_OPTIONS.map((f) => {
              const active = font === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFont(f.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                  style={{
                    fontFamily: f.stack,
                    fontWeight: fontWeight === "bold" ? 700 : 400,
                    fontStyle,
                  }}
                >
                  <span className="text-base">{f.label} — The quick brown fox jumps</span>
                  {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
