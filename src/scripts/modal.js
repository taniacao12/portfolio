const galleryImgs = document.getElementsByClassName('galleryImg');
const modal = document.querySelector('.modal');
const buttons = modal.querySelectorAll('button');
const prevBtn = buttons[0];
const nextBtn = buttons[1];
const image = modal.querySelector('figure img');
const caption = modal.querySelector('h3');

let index;

function setContent(img) {
    image.src = img.src;
    caption.innerHTML = img.alt;
}

// -----------------------------
// Click handlers
// -----------------------------
[...galleryImgs].forEach((img, i) => {
    img.addEventListener('click', () => {
        index = i;
        modal.classList.toggle('hide');
        root.classList.toggle('hide-scrollbar');
        setContent(img);
    });
});

prevBtn.addEventListener('click', () => {
    index -= 1;
    if (index < 0) index = galleryImgs.length - 1;
    setContent(galleryImgs[index]);
});

nextBtn.addEventListener('click', () => {
    index += 1;
    if (index == galleryImgs.length) index = 0;
    setContent(galleryImgs[index]);
});

modal.addEventListener('click', (e) => {
    if (!(image.contains(e.target) ||
        caption.contains(e.target) ||
        prevBtn.contains(e.target) ||
        nextBtn.contains(e.target))) {
        modal.classList.toggle('hide');
        root.classList.toggle('hide-scrollbar');
    }
});

// -----------------------------
// Keyboard handler
// -----------------------------
document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('hide')) {
        if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } if (e.key === 'ArrowRight') {
            nextBtn.click();
        } else if (e.key === 'Escape') {
            modal.classList.toggle('hide');
            root.classList.toggle('hide-scrollbar');
        }
    }
});
