const main = document.querySelector('main');
const grids = document.getElementsByClassName('grid');
const article = document.querySelector('article');
const properties = document.getElementById('properties');

function setCols(grid) {
    let cols = 0;
    grid.classList.forEach(className => {
        if (className.slice(0, 4) === 'col-') {
            cols = parseFloat(className.slice(4, className.length));
        }
    });

    if (!cols) cols = grid.childElementCount;
    if (cols > 6) cols = 6;
    grid.style.setProperty('--cols', cols);
    return cols;
}

function setMinColWidth(grid, cols = 6) {
    const width = grid.parentElement.clientWidth;
    const gapSize = parseFloat(getComputedStyle(grid).gap);
    let colWidth = Math.floor((width - (gapSize * (cols - 1))) / cols / 16);
    if (colWidth < 8) colWidth = 8;
    grid.style.setProperty('--min-col-width', colWidth + 'rem');
}

function setGridLayout() {
    [...grids].forEach(grid => {
        const cols = setCols(grid);
        if (grid.classList.contains('auto-fit')) setMinColWidth(grid);
        if (grid.classList.contains('auto-fill')) setMinColWidth(grid, cols);
    });
}

setGridLayout();

// -----------------------------
// Window Resize Handler
// -----------------------------
window.addEventListener('resize', setGridLayout);
