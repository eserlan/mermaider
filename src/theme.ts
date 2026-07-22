export function initTheme(themeButton: HTMLButtonElement): void {
  function setTheme(isDark: boolean): void {
    document.documentElement.classList.toggle('dark', isDark);
    themeButton.textContent = isDark ? 'Sun' : 'Moon';
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      // Storage unavailable fallback
    }
  }

  let storedTheme: string | null = null;
  try {
    storedTheme = localStorage.getItem('theme');
  } catch {
    // Ignore localStorage access restriction
  }

  const initialDark =
    storedTheme === 'dark' ||
    (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

  setTheme(initialDark);

  themeButton.onclick = () => {
    setTheme(!document.documentElement.classList.contains('dark'));
  };
}
