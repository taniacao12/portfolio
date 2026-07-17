const searchBtn = document.getElementById('searchBtn');

// -----------------------------
// Hover animations
// -----------------------------
searchBtn.addEventListener('mouseenter', () => {
  searchIcon.setAttribute('src', '/icons/Search.apng');
});

searchBtn.addEventListener('mouseleave', () => {
  searchIcon.setAttribute('src', 'https://img.icons8.com/ios/100/search--v1.png');
});

// -----------------------------
// Button click handler
// -----------------------------
searchBtn.addEventListener('click', () => {
  searchBtn.classList.toggle('active');
  directory.classList.toggle('show');

  let lastHeight = null;

  const ro = new ResizeObserver(() => {
    if (directory.clientHeight !== lastHeight) {
      lastHeight = directory.clientHeight;

      if (lastHeight === 0 && !directory.classList.contains('show')) {
        main.classList.add('tight');
        ro.disconnect();
      } else if (lastHeight > 0 && directory.classList.contains('show')) {
        main.classList.remove('tight');
        directory.scrollLeft = (directory.scrollWidth - directory.clientWidth) / 2;
        ro.disconnect();
      }
    }
  });

  ro.observe(directory);
});
