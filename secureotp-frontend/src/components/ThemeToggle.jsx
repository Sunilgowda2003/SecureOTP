
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
      <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

export default ThemeToggle;
