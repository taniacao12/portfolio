const scrollbarHeight = parseFloat(sessionStorage.getItem("scrollbarHeight"));
const root = document.documentElement;
const body = document.body;
const nav = document.querySelector("nav");
const main = document.querySelector("main");
const header = document.querySelector("header");
const footer = document.querySelector("footer");

export function setMinBodyHeight() {
    const hScrollbarSize =
        (root.scrollWidth > window.innerWidth) *
        scrollbarHeight;

    const minHeight = parseFloat(getComputedStyle(body).minHeight);
    const run = root.classList.contains("minBodyHeight");
    if (hScrollbarSize && !run) {
        body.style.minHeight = (minHeight - scrollbarHeight) + "px";
        root.classList.toggle("minBodyHeight");
    } else if (!hScrollbarSize && run) {
        body.style.minHeight = (minHeight + scrollbarHeight) + "px";
        root.classList.toggle("minBodyHeight");
    }
}

export function setMinMainWidth() {
    let minNavWidth =
        2 * parseFloat(getComputedStyle(nav).padding) +
        (nav.childElementCount - 1) * parseFloat(getComputedStyle(nav).gap);
    [...nav.children].forEach((child) => {
        minNavWidth += parseFloat(getComputedStyle(child).width);
    });

    let minFooterWidth =
        2 * parseFloat(getComputedStyle(footer).padding) +
        (footer.childElementCount - 1) * parseFloat(getComputedStyle(footer).gap);
    [...footer.children].forEach((child) => {
        minFooterWidth += parseFloat(getComputedStyle(child).width);
    });

    const minMainWidth = Math.max(minNavWidth, minFooterWidth);
    main.style.minWidth = minMainWidth + "px";
}

export function limitHeaderHeight() {
    const hScrollbarSize =
        (root.scrollWidth > window.innerWidth) *
        scrollbarHeight;

    // console.log(window.innerHeight,
    //   nav.offsetHeight,
    //   hScrollbarSize);
    const headerHeight = window.innerHeight -
        nav.offsetHeight -
        hScrollbarSize;
    header.style.maxHeight = headerHeight + "px";
}
