const main = document.querySelector("main");
const searchIcon = document.getElementById("searchIcon");
const directory = document.getElementById("directory");
const container = document.querySelector(".directory .images");

function createPlaceholder(width) {
  const placeholder = document.createElement("div");
  placeholder.className = "placeholder";
  placeholder.style.width = width + "px";
  return placeholder;
}

export function updatePlaceholders() {
  container.querySelectorAll(".placeholder").forEach(el => el.remove());

  const activeImages = [...container.children].filter(
    el => !el.classList.contains("hide")
  );
  const imgWidth = parseFloat(getComputedStyle(activeImages[0]).width);
  container.prepend(createPlaceholder(imgWidth / 2));

  const containerWidth = container.offsetWidth;
  const leftoverWidth = directory.offsetWidth - containerWidth;
  if (leftoverWidth <= 0) {
    container.appendChild(createPlaceholder(imgWidth / 2));
    return;
  };

  const gapWidth = parseFloat(getComputedStyle(container).gap) || 0;
  let totalWidth = 0;
  while (totalWidth < leftoverWidth) {
    const diff = leftoverWidth - totalWidth - gapWidth;
    if (diff < imgWidth) {
      totalWidth += diff + gapWidth;
      container.appendChild(createPlaceholder(diff));
    } else {
      totalWidth += imgWidth + gapWidth;
      container.appendChild(createPlaceholder(imgWidth));
    }
  }
}

updatePlaceholders();
window.addEventListener("resize", updatePlaceholders);

// -----------------------------
// Button click handler
// -----------------------------
searchBtn.addEventListener("click", () => {
  searchBtn.classList.toggle("active");
  directory.classList.toggle("active");
  main.classList.toggle("tight");
});

// -----------------------------
// Hover animations
// -----------------------------
searchBtn.addEventListener("mouseenter", () => {
  searchIcon.setAttribute("src", "/icons/Search.apng");
});
searchBtn.addEventListener("mouseleave", () => {
  searchIcon.setAttribute(
    "src",
    "https://img.icons8.com/ios/100/search--v1.png",
  );
});

// -----------------------------
// Enable up/down scroll
// -----------------------------
directory.addEventListener("wheel", (e) => {
  if (e.deltaX === 0 && e.deltaY !== 0) {
    e.preventDefault();
    directory.scrollLeft += e.deltaY;
  }
}, { passive: false });

