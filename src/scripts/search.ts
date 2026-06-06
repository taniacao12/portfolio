const mainSections = [...document.getElementsByClassName("mainSection")];
const heroCanvasContainer = document.getElementById(
  "heroCanvasContainer",
)! as HTMLElement;
const searchBtn = document.getElementById(
  "searchBtn",
)! as HTMLButtonElement;
const searchIcon = document.getElementById(
  "searchIcon",
)! as HTMLImageElement;

searchBtn.addEventListener("click", () => {
  searchBtn.classList.toggle("active");
  const gallery = document.getElementById("galleryPanel");
  gallery?.classList.toggle("active");
  heroCanvasContainer.classList.toggle("active");
  mainSections.forEach((section) => {
    section.classList.toggle("active");
  });
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
