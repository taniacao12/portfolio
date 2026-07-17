const directory = document.querySelector('aside');
const topBorder = directory.querySelector('.topBorder');
const botBorder = directory.querySelector('.botBorder');
const container = directory.querySelector('.images');
const directoryImgs = directory.querySelectorAll('img');

function setScrollWidth() {
  if (parseFloat(directory.style.getPropertyValue('--scroll-width')) !== container.clientWidth) {
    directory.style.setProperty('--scroll-width', container.clientWidth + 'px');
  }
}

function createPlaceholder() {
  const placeholder = document.createElement('div');
  placeholder.classList.add('placeholder');
  return placeholder;
}

function addPlaceholder(reaction = true) {
  const placeholder = createPlaceholder();
  placeholder.classList.add('shrink');
  container.appendChild(placeholder);

  void placeholder.offsetWidth;
  placeholder.classList.remove('shrink');

  if (reaction) {
    const show = (e) => {
      if (e.propertyName !== 'width') return;
      placeholder.removeEventListener('transitionend', show);
      placeholder.classList.remove('grow');
    };

    placeholder.classList.add('grow');
    placeholder.addEventListener('transitionend', show);
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

function updatePlaceholders(reaction = true) {
  let leftoverWidth = directory.clientWidth - container.clientWidth;
  let placeholders = [...container.querySelectorAll('.placeholder')].slice(2);
  while (leftoverWidth > 0) {
    addPlaceholder(reaction);
    placeholders = [...container.querySelectorAll('.placeholder')].slice(2);
    leftoverWidth -= 192;
  }

  if (reaction) {
    leftoverWidth = directory.clientWidth - container.clientWidth;
    placeholders = [...container.querySelectorAll('.placeholder:not(.shrink)')].slice(2);
    while (placeholders.length > 0 && leftoverWidth < -192) {
      console.log(placeholders);
      removePlaceholder(placeholders[placeholders.length - 1]);
      placeholders = [...container.querySelectorAll('.placeholder:not(.shrink)')].slice(2);
      leftoverWidth += 192;
    }
  }
}

function hideWork(reaction, work) {
  work.classList.add('shrink');
  addPlaceholder();

  if (reaction) {
    const hide = (e) => {
      if (e.propertyName !== 'width') return;
      work.removeEventListener('transitionend', hide);
      work.classList.add('hide');
    };

    work.addEventListener('transitionend', hide);
  } else work.classList.add('hide');
}

function showWork(work, placeholder) {
  work.classList.remove('hide');
  void work.offsetWidth;
  work.classList.remove('shrink');

  removePlaceholder(placeholder);
}

function filterWorks(reaction = true) {
  let hideCount = 0;
  directoryImgs.forEach(img => {
    const isProject = img.classList.contains('project');
    const isPublication = img.classList.contains('publication');
    const hide =
      (filterMode.projects || filterMode.publications) &&
      !((filterMode.projects && isProject) || (filterMode.publications && isPublication));

    if (hide) hideWork(reaction, img.parentElement);
    else if (img.parentElement.classList.contains('hide')) {
      const placeholders = container.querySelectorAll('.placeholder');
      showWork(img.parentElement, placeholders[placeholders.length - hideCount - 1]);
      hideCount += 1;
    }
  });

  if (!reaction) updatePlaceholders(reaction);
}

container.prepend(createPlaceholder());
container.appendChild(createPlaceholder());

filterWorks(false);

// -----------------------------
// Window Resize Handler
// -----------------------------
window.addEventListener('resize', () => {
  updatePlaceholders();
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
