const filterGroup = document.getElementById(
    "filterGroup",
)! as HTMLDivElement;
const filterIcon = document.getElementById(
    "filterIcon",
)! as HTMLImageElement;
const projectsBtn = document.getElementById(
    "projectsBtn",
)! as HTMLButtonElement;
const publicationsBtn = document.getElementById(
    "publicationsBtn",
)! as HTMLButtonElement;

function applyFilter(
    btn: HTMLButtonElement,
    key: "projects" | "publications",
) {
    const isActive = btn.classList.contains("active");

    // update filter state
    window.filterMode[key] = !isActive;
    btn.classList.toggle("active");

    // persist to sessionStorage
    sessionStorage.setItem("filterMode", JSON.stringify(window.filterMode));

    // always read fresh filter state
    const fm = window.filterMode;
    const images = document.querySelectorAll(".images img");

    images.forEach((img) => {
        const isProject = img.classList.contains("project");
        const isPublication = img.classList.contains("publication");

        const hide =
            (fm.projects || fm.publications) &&
            !((fm.projects && isProject) || (fm.publications && isPublication));

        img.classList.toggle("hide", hide);
    });

    window.debug("applied", key, "filter");
}

// -----------------------------
// Load persisted filter state
// -----------------------------
const saved = sessionStorage.getItem("filterMode");
if (saved) {
    window.filterMode = JSON.parse(saved);

    if (window.filterMode.projects) {
        applyFilter(projectsBtn, "projects");
    } if (window.filterMode.publications) {
        applyFilter(publicationsBtn, "publications");
    }
}

// -----------------------------
// Button click handlers
// -----------------------------
projectsBtn.addEventListener("click", () => {
    applyFilter(projectsBtn, "projects");
    // open gallery panel if not in landing page
    if (location.pathname !== "/" && !searchBtn.classList.contains("active")) {
        searchBtn.click();
    }
});

publicationsBtn.addEventListener("click", () => {
    applyFilter(publicationsBtn, "publications");
    // open gallery panel if not in landing page
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
