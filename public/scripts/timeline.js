const timelines = document.querySelectorAll(".timeline");

function resizeSlider(slider, labels, input) {
  const start = parseFloat(getComputedStyle(labels[0]).width) / 2;
  const end = parseFloat(getComputedStyle(labels[labels.length - 1]).width) / 2;
  input.style.marginLeft = start + "px";
  input.style.marginRight = end + "px";
}

function resizeImage(image) {
  const actualHeight = parseFloat(getComputedStyle(image.children[0]).height);
  image.style.height = actualHeight + "px";

  const clippedHeight = parseFloat(getComputedStyle(image).height);
  const diff = actualHeight - clippedHeight;
  [...image.children].forEach((img) => {
    img.style.transform = "translateY(-" + (diff / 2) + "px";
  })
}

function updateTimeline(value, labels, imgs) {
  const v = parseFloat(value);

  labels.forEach((label, i) => {
    label.classList.toggle('active', Math.round(v) === i);
  });

  imgs.forEach((img) => {
    const i = img.getAttribute("data-index");
    const diff = Math.abs(v - i);
    img.style.opacity = Math.max(1 - diff, 0);
  });
}

timelines.forEach((timeline) => {
  const slider = timeline.querySelector(".slider");
  const input = timeline.querySelector("input");
  const labels = timeline.querySelectorAll("h3");
  const images = timeline.getElementsByClassName("image");
  const imgs = timeline.querySelectorAll("img");

  if (labels.length > 1) {
    resizeSlider(slider, labels, input)
    window.addEventListener("resize", resizeSlider(slider, labels, input));
  }

  [...images].forEach((image) => {
    resizeImage(image);
    const ro = new ResizeObserver(() => resizeImage(image));
    ro.observe(image.children[0]);
  })

  updateTimeline(0, labels, imgs);
  input.addEventListener('input', (e) => updateTimeline(e.target.value, labels, imgs));
})
