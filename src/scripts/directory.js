const directory = document.querySelector('aside');
const container = directory.querySelector('.images');
const directoryImgs = directory.querySelectorAll('img');

function setScrollWidth() {
  const width = container.clientWidth;
  if (parseFloat(directory.style.getPropertyValue('--scroll-width')) !== width) {
    directory.style.setProperty('--scroll-width', width + 'px');
  }
}

function createPlaceholder() {
  const placeholder = document.createElement('div');
  placeholder.classList.add('placeholder');
  return placeholder;
}

function addPlaceholder() {
  const placeholder = createPlaceholder();
  placeholder.classList.add('shrink');
  container.appendChild(placeholder);

  void placeholder.offsetWidth;
  placeholder.classList.remove('shrink');

  if (directory.classList.contains('show')) {
    const show = (e) => {
      if (e.propertyName !== 'width') return;
      placeholder.removeEventListener('transitionend', show);
      placeholder.classList.remove('grow');
    };

    placeholder.classList.add('grow');
    placeholder.addEventListener('transitionend', show);
  }
}

function addPlaceholders() {
  const max = Math.ceil((directory.clientWidth + 12) / 192);
  let count = [...container.children].filter(
    el => !(el.classList.contains('hide') || el.classList.contains('shrink'))
  ).length;

  while (count < max) {
    addPlaceholder();
    count = [...container.children].filter(
      el => !(el.classList.contains('hide') || el.classList.contains('shrink'))
    ).length;
  }
}

function removePlaceholder(placeholder) {
  const hide = (e) => {
    if (e.propertyName !== 'width') return;
    placeholder.removeEventListener('transitionend', hide);
    placeholder.remove();
  };

  placeholder.classList.add('shrink');

  placeholder.addEventListener('transitionend', hide);
}

function removePlaceholders() {
  const max = Math.ceil((directory.clientWidth + 12) / 192);
  let count = [...container.children].filter(
    el => !(el.classList.contains('hide') || el.classList.contains('shrink'))
  ).length;
  let placeholders = [...container.querySelectorAll('.placeholder:not(.shrink)')].slice(2);
  while (count > max && placeholders.length > 0) {
    removePlaceholder(placeholders[placeholders.length - 1]);
    placeholders = [...container.querySelectorAll('.placeholder:not(.shrink)')].slice(2);
    count = [...container.children].filter(
      el => !(el.classList.contains('hide') || el.classList.contains('shrink'))
    ).length;
  }
}

function hideWork(work) {
  work.classList.add('shrink');
  addPlaceholders();

  if (directory.classList.contains('show')) {
    const hide = (e) => {
      if (e.propertyName !== 'width') return;
      work.removeEventListener('transitionend', hide);
      work.classList.add('hide');
    };

    work.addEventListener('transitionend', hide);
  } else work.classList.add('hide');
}

function showWork(work) {
  work.classList.remove('hide');
  void work.offsetWidth;
  work.classList.remove('shrink');
  removePlaceholders();
}

export function filterWorks() {
  let filterMode = JSON.parse(sessionStorage.getItem('filterMode'));
  directoryImgs.forEach(img => {
    const isProject = img.classList.contains('project');
    const isPublication = img.classList.contains('publication');
    const hide =
      (filterMode.projects || filterMode.publications) &&
      !((filterMode.projects && isProject) || (filterMode.publications && isPublication));

    if (hide) hideWork(img.parentElement);
    else if (img.parentElement.classList.contains('hide')) {
      showWork(img.parentElement);
    }
  });
}

setScrollWidth();
filterWorks();

// -----------------------------
// Window Resize Handler
// -----------------------------
window.addEventListener('resize', () => {
  setScrollWidth();
  addPlaceholders();
  removePlaceholders();
});

// -----------------------------
// Directory Resize Handler
// -----------------------------
const ro = new ResizeObserver(setScrollWidth);
ro.observe(container);

// -----------------------------
// Scroll Handler
// -----------------------------
directory.addEventListener('wheel', (e) => {
  if (e.deltaX === 0 && e.deltaY !== 0) {
    e.preventDefault();
    directory.scrollLeft += e.deltaY;
  }
}, { passive: false });
