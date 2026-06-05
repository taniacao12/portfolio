window.DEBUG = true;
window.debug = (...args: any[]) => {
    if (window.DEBUG) console.log(...args);
};

// OS theme
window.OSTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
window.debug("theme:", window.OSTheme);

// project/publications filter
window.filterMode = { projects: false, publications: false };