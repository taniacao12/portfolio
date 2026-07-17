const root = document.documentElement;
const body = document.body;

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

function setScrollbarSizes() {
    const div = document.createElement('div');
    div.style.width = '100px';
    div.style.height = '100px';
    div.style.overflow = 'scroll';
    div.style.position = 'absolute';
    div.style.top = '-9999px';
    body.appendChild(div);

    const scrollbarWidth = div.offsetWidth - div.clientWidth;
    const scrollbarHeight = div.offsetHeight - div.clientHeight;

    body.removeChild(div);

    sessionStorage.setItem('scrollbarWidth', scrollbarWidth);
    sessionStorage.setItem('scrollbarHeight', scrollbarHeight);
    // console.log('vertical scrollbar width:', scrollbarWidth);
    // console.log('horizontal scrollbar height:', scrollbarHeight);

    return [scrollbarWidth, scrollbarHeight];
}

function setRootVariables(scrollbarHeight) {
    const hScrollbarSize =
        (root.scrollWidth > window.innerWidth) *
        scrollbarHeight;
    if (root.style.getPropertyValue('--hScrollbarSize') !== hScrollbarSize) {
        root.style.setProperty('--hScrollbarSize', hScrollbarSize + 'px');
    }

    const height = window.innerHeight;
    if (parseFloat(root.style.getPropertyValue('--window-height')) !== height) {
        root.style.setProperty('--window-height', height + 'px');
    }
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
} setTheme(theme);
setFavicon(theme);

// -----------------------------
// OS theme toggle - always overrides user toggles
// -----------------------------
defaultTheme.addEventListener('change', (e) => {
    const newTheme = e.matches ? 'dark' : 'light';
    sessionStorage.setItem('theme', newTheme);
    setTheme(newTheme);
    setFavicon(newTheme);
});

// -----------------------------
// Load scrollbar sizes from session storage
// -----------------------------
let scrollbarWidth = parseFloat(sessionStorage.getItem('scrollbarWidth'));
let scrollbarHeight = parseFloat(sessionStorage.getItem('scrollbarHeight'));

if (!scrollbarWidth || !scrollbarHeight) {
    [scrollbarWidth, scrollbarHeight] = setScrollbarSizes();
}

// -----------------------------
// Initialize root variables
// -----------------------------
setRootVariables(scrollbarHeight);

// -----------------------------
// Window Resize Handler
// -----------------------------
window.addEventListener('resize', () => {
    setRootVariables(scrollbarHeight);
});

// -----------------------------
// Load filter state from session storage
// -----------------------------
let filterMode = sessionStorage.getItem('filterMode');
if (!filterMode) {
    filterMode = { projects: false, publications: false };
    sessionStorage.setItem('filterMode', JSON.stringify(filterMode));
} else filterMode = JSON.parse(filterMode);
