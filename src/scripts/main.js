// DELETE FILE

const nav = document.querySelector('nav');
const main = document.querySelector('main');
const footer = document.querySelector('footer');

// -----------------------------
// Set minimum main width
// -----------------------------
let minNavWidth =
    2 * parseFloat(getComputedStyle(nav).padding) +
    (nav.childElementCount - 1) * parseFloat(getComputedStyle(nav).gap);
[...nav.children].forEach(child => {
    minNavWidth += parseFloat(getComputedStyle(child).width);
});

let minFooterWidth =
    2 * parseFloat(getComputedStyle(footer).padding) +
    (footer.childElementCount - 1) * parseFloat(getComputedStyle(footer).gap);
[...footer.children].forEach(child => {
    minFooterWidth += parseFloat(getComputedStyle(child).width);
});

const minMainWidth = Math.max(minNavWidth, minFooterWidth);
main.style.minWidth = minMainWidth + 'px';
