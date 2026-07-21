const root = document.documentElement;

function setTheme(theme) {
  root.classList.toggle('dark', theme === 'dark');
  // console.log('theme applied:', theme);
}

function setFavicon(theme) {
  const svg = document.querySelector('link[type="image/svg+xml"]');
  const ico = document.querySelector('link[rel="icon"]:not([type])');

  if (theme === 'dark') {
    svg.href = '/icons/Favicon-White.svg';
    ico.href = '/icons/Favicon-White.ico';
  } else {
    svg.href = '/icons/Favicon-Black.svg';
    ico.href = '/icons/Favicon-Black.ico';
  }
  // console.log('favicon applied:', theme);
}

// -----------------------------
// Load theme and favicon from session storage
// -----------------------------
let theme = sessionStorage.getItem('theme');
const defaultTheme = matchMedia('(prefers-color-scheme: dark)');

// No saved theme → follow OS preference
if (!theme) {
  theme = defaultTheme.matches ? 'dark' : 'light';
  sessionStorage.setItem('theme', theme);
} setFavicon(theme);

// -----------------------------
// Load filter state from session storage
// -----------------------------
let filterMode = sessionStorage.getItem('filterMode');
if (!filterMode) {
  filterMode = { projects: false, publications: false };
  sessionStorage.setItem('filterMode', JSON.stringify(filterMode));
}
