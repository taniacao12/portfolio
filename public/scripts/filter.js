import {updatePlaceholders} from "./directory.js";

const filterGroup = document.getElementById("filterGroup");
const filterIcon = document.getElementById("filterIcon");
const projectsBtn = document.getElementById("projectsBtn");
const publicationsBtn = document.getElementById("publicationsBtn");
const searchBtn = document.getElementById("searchBtn");
const images = document.querySelectorAll(".images img");

function applyFilter(btn, key) {
    // update filter state
    filterMode[key] = !btn.classList.contains("active");
    btn.classList.toggle("active");
    sessionStorage.setItem("filterMode", JSON.stringify(filterMode));

    // filter directory images
    images.forEach((img) => {
        const isProject = img.classList.contains("project");
        const isPublication = img.classList.contains("publication");
        const hide =
            (filterMode.projects || filterMode.publications) &&
            !((filterMode.projects && isProject) || (filterMode.publications && isPublication));
        img.parentElement.classList.toggle("hide", hide);
    });
    
    updatePlaceholders();
    // console.log("applied", key, "filter");
}

// -----------------------------
// Load filter state from session storage
// -----------------------------
let filterMode = sessionStorage.getItem("filterMode");
if (!filterMode) {
    filterMode = { projects: false, publications: false };
    sessionStorage.setItem("filterMode", JSON.stringify(filterMode));
} else filterMode = JSON.parse(filterMode);
if (filterMode.projects) {
    applyFilter(projectsBtn, "projects");
} if (filterMode.publications) {
    applyFilter(publicationsBtn, "publications");
}

// -----------------------------
// Button click handlers
// -----------------------------
projectsBtn.addEventListener("click", () => {
    applyFilter(projectsBtn, "projects");
    if (location.pathname !== "/" && !searchBtn.classList.contains("active")) {
        searchBtn.click();
    }
});
publicationsBtn.addEventListener("click", () => {
    applyFilter(publicationsBtn, "publications");
    if (location.pathname !== "/" && !searchBtn.classList.contains("active")) {
        searchBtn.click();
    }
});

// -----------------------------
// Hover animations
// -----------------------------
filterGroup.addEventListener("mouseenter", () => {
    filterIcon.setAttribute("src", "/icons/Filter.apng");
});
filterGroup.addEventListener("mouseleave", () => {
    filterIcon.setAttribute(
        "src",
        "https://img.icons8.com/ios/100/filter--v1.png",
    );
});
