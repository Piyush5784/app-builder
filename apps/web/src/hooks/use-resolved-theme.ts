import * as React from "react";

// Tracks the theme actually applied to <html> (ThemeProvider resolves
// 'system' to a real light/dark class there) rather than duplicating that
// resolution logic here.
export function useResolvedTheme(): "light" | "dark" {
  const [resolved, setResolved] = React.useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  React.useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setResolved(root.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return resolved;
}
