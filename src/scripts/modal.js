const galleryImgs = document.getElementsByClassName('galleryImg');
const modal = document.getElementById('galleryModal');
const content = modal.querySelector('#content');
const modalPrev = content.children[0];
const modalImg = content.children[1].querySelector('img');
const modalCaption = content.children[1].querySelector('h3');
const modalNext = content.children[2];

let index;

function setContent(img) {
    modalImg.src = img.src;
    modalCaption.innerHTML = img.alt;
}

// -----------------------------
// Click handlers
// -----------------------------
[...galleryImgs].forEach((img, i) => {
    img.addEventListener('click', () => {
        index = i;
        modal.classList.toggle('active');
        setContent(img);
    });
});

modalPrev.addEventListener('click', () => {
    index -= 1;
    if (index < 0) index = galleryImgs.length - 1;
    setContent(galleryImgs[index]);
});

modalNext.addEventListener('click', () => {
    index += 1;
    if (index == galleryImgs.length) index = 0;
    setContent(galleryImgs[index]);
});

modal.addEventListener('click', (e) => {
    if (!(modalImg.contains(e.target) ||
        modalCaption.contains(e.target) ||
        modalPrev.contains(e.target) ||
        modalNext.contains(e.target))) {
        modal.classList.toggle('active');
    }
});

// -----------------------------
// Keyboard handler
// -----------------------------
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        modalPrev.click();
    } if (e.key === 'ArrowRight') {
        modalNext.click();
    } else if (e.key === 'Escape') {
        modal.classList.toggle('active');
    }
});
