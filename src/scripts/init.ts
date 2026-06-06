window.DEBUG = true;
window.debug = (...args: any[]) => {
    if (window.DEBUG) console.log(...args);
};

// OS theme
window.OSTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
window.debug("theme:", window.OSTheme);

// scrollbar sizes
function getScrollbarSizes() {
    // create a temporary element with forced scrollbars
    const div = document.createElement("div");
    div.style.width = "100px";
    div.style.height = "100px";
    div.style.overflow = "scroll";
    div.style.position = "absolute";
    div.style.top = "-9999px";

    document.body.appendChild(div);

    // scrollbar size = offset - client
    const scrollbarWidth = div.offsetWidth - div.clientWidth;
    const scrollbarHeight = div.offsetHeight - div.clientHeight;

    document.body.removeChild(div);

    return [scrollbarWidth, scrollbarHeight];
}
[window.scrollbarWidth, window.scrollbarHeight] = getScrollbarSizes();
window.debug("vertical scrollbar width:", window.scrollbarWidth);
window.debug("horizontal scrollbar height:", window.scrollbarHeight);

// project/publications filter
window.filterMode = { projects: false, publications: false };