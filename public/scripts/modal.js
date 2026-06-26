const imgs = document.querySelectorAll(".galleryImg");
const modal = document.getElementById("galleryModal");
const modalImg = document.getElementById("modalImg");
const modalCaption = document.getElementById("modalCaption");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");

let index;

function setContent(img) {
    modalImg.src = img.src;
    modalCaption.innerHTML = img.alt;
}

// -----------------------------
// Click handlers
// -----------------------------
imgs.forEach((img, i) => {
    img.addEventListener("click", () => {
        index = i;
        modal.classList.toggle("hide");
        setContent(img);
    });
});

modalPrev.addEventListener("click", () => {
    index -= 1;
    if (index < 0) index = imgs.length - 1
    setContent(imgs[index]);
});

modalNext.addEventListener("click", () => {
    index += 1;
    if (index == imgs.length) index = 0
    setContent(imgs[index]);
});

modal.addEventListener("click", (e) => {
    if (!(modalImg.contains(e.target) ||
        modalCaption.contains(e.target) ||
        modalPrev.contains(e.target) ||
        modalNext.contains(e.target))) {
        modal.classList.toggle("hide");
    }
});

// -----------------------------
// Keyboard handler
// -----------------------------
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
        modalPrev.click();
    } if (e.key === "ArrowRight") {
        modalNext.click();
    } else if (e.key === "Escape") {
        modal.classList.toggle("hide");
    }
});
