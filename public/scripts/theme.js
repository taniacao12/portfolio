const themeToggle = document.getElementById("themeToggle");
const themeButton = document.getElementById("themeButton");
const themeIcon = document.getElementById("themeIcon");

const light = "https://img.icons8.com/ios/100/sun--v3.png";
const dark = "https://img.icons8.com/ios/100/bright-moon--v1.png";

function setTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  themeButton.checked = theme === "dark";
  themeIcon.src = theme === "dark" ? dark : light;
  // console.log("theme applied:", theme);
}

function setFavicon(theme) {
  const svg = document.querySelector('link[type="image/svg+xml"]');
  const ico = document.querySelector('link[rel="icon"]:not([type])');

  if (theme === "dark") {
    svg.href = "/icons/Favicon-White.svg";
    ico.href = "/icons/Favicon-White.ico";
  } else {
    svg.href = "/icons/Favicon-Black.svg";
    ico.href = "/icons/Favicon-Black.ico";
  }
  // console.log("favicon applied:", theme);
}

// -----------------------------
// Load theme from session storage
// -----------------------------
let theme = sessionStorage.getItem("theme");
const defaultTheme = matchMedia("(prefers-color-scheme: dark)");

// No saved theme → follow OS preference
if (!theme) {
  theme = defaultTheme.matches ? "dark" : "light";
  sessionStorage.setItem("theme", theme);
} setTheme(theme);
setFavicon(theme);

// -----------------------------
// OS theme toggle - always overrides user toggles
// -----------------------------
defaultTheme.addEventListener("change", (e) => {
  const newTheme = e.matches ? "dark" : "light";
  sessionStorage.setItem("theme", newTheme);
  setTheme(newTheme);
  setFavicon(newTheme);
});

// -----------------------------
// User theme toggle
// -----------------------------
themeButton.addEventListener("change", () => {
  const newTheme = themeButton.checked ? "dark" : "light";
  sessionStorage.setItem("theme", newTheme);
  setTheme(newTheme);
});

// -----------------------------
// Hover animations
// -----------------------------
themeToggle.addEventListener("mouseenter", () => {
  if (document.documentElement.classList.contains("dark")) {
    themeIcon.setAttribute("src", "/icons/Moon.apng");
  } else themeIcon.setAttribute("src", "/icons/Sun.apng");
});
themeToggle.addEventListener("mouseleave", () => {
  if (document.documentElement.classList.contains("dark")) {
    themeIcon.setAttribute("src", dark);
  } else themeIcon.setAttribute("src", light);
});
