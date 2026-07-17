const filterGroup = document.getElementById('filterGroup');
const filterIcon = filterGroup.children[0].firstElementChild;
const projectsBtn = filterGroup.children[1];
const publicationsBtn = filterGroup.children[2];

function toggleFilterBtn(btn, key) {
    filterMode[key] = !btn.classList.contains('active');
    btn.classList.toggle('active');
    sessionStorage.setItem('filterMode', JSON.stringify(filterMode));
    // console.log('applied', key, 'filter');
}

if (filterMode.projects) {
    toggleFilterBtn(projectsBtn, 'projects');
} if (filterMode.publications) {
    toggleFilterBtn(publicationsBtn, 'publications');
}

// -----------------------------
// Hover animations
// -----------------------------
filterGroup.addEventListener('mouseenter', () => {
    filterIcon.setAttribute('src', '/icons/Filter.apng');
});

filterGroup.addEventListener('mouseleave', () => {
    filterIcon.setAttribute('src', 'https://img.icons8.com/ios/100/filter--v1.png');
});

// -----------------------------
// Button click handlers
// -----------------------------
projectsBtn.addEventListener('click', () => {
    toggleFilterBtn(projectsBtn, 'projects');
    if (location.pathname !== '/' && !searchBtn.classList.contains('active')) {
        searchBtn.click();
    } filterWorks();
});

publicationsBtn.addEventListener('click', () => {
    toggleFilterBtn(publicationsBtn, 'publications');
    if (location.pathname !== '/' && !searchBtn.classList.contains('active')) {
        searchBtn.click();
    } filterWorks();
});
