const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeButton = themeToggle.children[0];
const themeIcon = themeToggle.children[1].firstElementChild;

const lightIcon = 'https://img.icons8.com/ios/100/sun--v3.png';
const darkIcon = 'https://img.icons8.com/ios/100/bright-moon--v1.png';

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

function updateThemeIcon(theme) {
  themeIcon.src = theme === 'dark' ? darkIcon : lightIcon;
}

// -----------------------------
// Load theme and favicon from session storage
// -----------------------------
let theme = sessionStorage.getItem('theme');
const defaultTheme = matchMedia('(prefers-color-scheme: dark)');

setTheme(theme);
themeButton.checked = theme === 'dark';
updateThemeIcon(theme);

// -----------------------------
// Hover animations
// -----------------------------
themeToggle.addEventListener('mouseenter', () => {
  if (root.classList.contains('dark')) {
    themeIcon.setAttribute('src', '/icons/Moon.apng');
  } else themeIcon.setAttribute('src', '/icons/Sun.apng');
});

themeToggle.addEventListener('mouseleave', () => {
  if (root.classList.contains('dark')) {
    themeIcon.setAttribute('src', darkIcon);
  } else themeIcon.setAttribute('src', lightIcon);
});

// -----------------------------
// User theme toggle
// -----------------------------
themeButton.addEventListener('change', () => {
  const newTheme = themeButton.checked ? 'dark' : 'light';
  sessionStorage.setItem('theme', newTheme);
  setTheme(newTheme);
  updateThemeIcon(newTheme);
});

// -----------------------------
// OS theme toggle - always overrides user toggles
// -----------------------------
defaultTheme.addEventListener('change', (e) => {
  const newTheme = e.matches ? 'dark' : 'light';
  sessionStorage.setItem('theme', newTheme);
  setFavicon(newTheme);
  themeButton.checked = newTheme === 'dark';
  setTheme(newTheme);
  updateThemeIcon(newTheme);
});
