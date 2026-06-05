const themeToggle = document.getElementById(
  "themeToggle",
) as HTMLInputElement;
const themeIcon = document.getElementById(
  "themeIcon",
) as HTMLImageElement;

const light = "https://img.icons8.com/ios/100/sun--v3.png";
const dark = "https://img.icons8.com/ios/100/bright-moon--v1.png";

// set theme based on system preference, and listen for changes in system and website theme preference
function setTheme(theme: string) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  themeToggle.checked = theme === "dark";
  themeIcon.src = theme === "dark" ? dark : light;
  window.debug("theme applied:", theme);
}

// set favicon based on theme
function setFavicon(theme: string) {
  const svg = document.querySelector(
    'link[type="image/svg+xml"]',
  ) as HTMLLinkElement;
  const ico = document.querySelector(
    'link[rel="icon"]:not([type])',
  ) as HTMLLinkElement;

  if (theme === "dark") {
    svg.href = "/Favicon White.svg";
    ico.href = "/Favicon White.ico";
  } else {
    svg.href = "/Favicon Black.svg";
    ico.href = "/Favicon Black.ico";
  } window.debug("favicon applied:", theme);
}

// -----------------------------
// Load theme from sessionStorage
// -----------------------------
let savedTheme = sessionStorage.getItem("theme");
const defaultTheme = matchMedia("(prefers-color-scheme: dark)");

// No saved theme → follow OS preference
if (!savedTheme) {
  savedTheme = defaultTheme.matches ? "dark" : "light";
  sessionStorage.setItem("theme", savedTheme);
}
setTheme(savedTheme);
setFavicon(window.OSTheme);

// -----------------------------
// OS theme changes ALWAYS override
// -----------------------------
defaultTheme.addEventListener("change", (e) => {
  const newTheme = e.matches ? "dark" : "light";
  sessionStorage.setItem("theme", newTheme);
  setFavicon(newTheme);
  setTheme(newTheme);
});

// -----------------------------
// User toggles theme manually
// -----------------------------
themeToggle.addEventListener("change", () => {
  const newTheme = themeToggle.checked ? "dark" : "light";
  sessionStorage.setItem("theme", newTheme);
  setTheme(newTheme);
});
