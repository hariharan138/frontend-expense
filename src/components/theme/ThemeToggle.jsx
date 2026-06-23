import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../ui/button";

export default function ThemeToggle({ className }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
