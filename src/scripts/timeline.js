const timeline = document.getElementById('timeline');

if (timeline) {
  const input = timeline.querySelector('input');
  const labels = timeline.querySelectorAll('h3');
  const timelineImages = timeline.getElementsByClassName('image');
  const imgs = timeline.querySelectorAll('img');

  function resizeImage(image) {
    const actualHeight = parseFloat(getComputedStyle(image.children[0]).height);
    image.style.height = actualHeight + 'px';

    const clippedHeight = parseFloat(getComputedStyle(image).height);
    const diff = actualHeight - clippedHeight;
    [...image.children].forEach(img => {
      img.style.transform = 'translateY(-' + (diff / 2) + 'px';
    })
  }

  function updateTimeline(value) {
    const v = parseFloat(value);

    labels.forEach((label, i) => {
      label.classList.toggle('active', Math.round(v) === i);
    });

    imgs.forEach(img => {
      const i = img.getAttribute('data-index');
      const diff = Math.abs(v - i);
      img.style.opacity = Math.max(1 - diff, 0);
    });
  }

  // -----------------------------
  // Set gap variable
  // -----------------------------
  const gapSize = getComputedStyle(timeline).gap;
  timeline.style.setProperty('--gap', gapSize);

  // -----------------------------
  // Resize slider
  // -----------------------------
  const start = parseFloat(getComputedStyle(labels[0]).width) * 5 / 12;
  const end = parseFloat(getComputedStyle(labels[labels.length - 1]).width) * 5 / 12;
  input.style.marginLeft = start + 'px';
  input.style.marginRight = end + 'px';

  // -----------------------------
  // Resize images to fit within window display
  // -----------------------------
  [...timelineImages].forEach(image => {
    resizeImage(image);
    const ro = new ResizeObserver(() => resizeImage(image));
    ro.observe(image.children[0]);
  })

  // -----------------------------
  // Timeline animations
  // -----------------------------
  updateTimeline(0);
  input.addEventListener('input', (e) => updateTimeline(e.target.value));
}
