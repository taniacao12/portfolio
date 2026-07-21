const root = document.documentElement;
const body = document.body;

function setRootVariables(scrollbarWidth, scrollbarHeight) {
    const hScrollbarSize = (root.scrollWidth > window.innerWidth) * scrollbarHeight;
    const vScrollbarSize = (root.scrollHeight > window.innerHeight) * scrollbarWidth;
    if (root.style.getPropertyValue('--scrollbar-width') !== vScrollbarSize) {
        root.style.setProperty('--scrollbar-width', vScrollbarSize + 'px');
    } if (root.style.getPropertyValue('--scrollbar-height') !== hScrollbarSize) {
        root.style.setProperty('--scrollbar-height', hScrollbarSize + 'px');
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    if (parseFloat(body.style.getPropertyValue('--window-width')) !== width) {
        root.style.setProperty('--window-width', width + 'px');
    } if (parseFloat(body.style.getPropertyValue('--window-height')) !== height) {
        root.style.setProperty('--window-height', height + 'px');
    }
}

// -----------------------------
// Get scrollbar sizes
// -----------------------------
const div = document.createElement('div');
div.style.overflow = 'scroll';
body.appendChild(div);

const scrollbarWidth = div.offsetWidth - div.clientWidth;
const scrollbarHeight = div.offsetHeight - div.clientHeight;
// console.log('vertical scrollbar width:', scrollbarWidth);
// console.log('horizontal scrollbar height:', scrollbarHeight);

body.removeChild(div);

// -----------------------------
// Initialize root variables
// -----------------------------
setRootVariables(scrollbarWidth, scrollbarHeight);

// -----------------------------
// Window Resize Handler
// -----------------------------
window.addEventListener('resize', () => {
    setRootVariables(scrollbarWidth, scrollbarHeight);
});
