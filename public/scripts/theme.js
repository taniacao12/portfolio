const themeToggle = document.getElementById('themeToggle');
const themeButton = themeToggle.children[0];
const themeIcon = themeToggle.children[1].firstElementChild;

const lightIcon = 'https://img.icons8.com/ios/100/sun--v3.png';
const darkIcon = 'https://img.icons8.com/ios/100/bright-moon--v1.png';

function updateThemeIcon(theme) {
  themeIcon.src = theme === 'dark' ? darkIcon : lightIcon;
}

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
