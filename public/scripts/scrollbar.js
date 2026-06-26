function setScrollbarSizes() {
    const div = document.createElement("div");
    div.style.width = "100px";
    div.style.height = "100px";
    div.style.overflow = "scroll";
    div.style.position = "absolute";
    div.style.top = "-9999px";
    document.body.appendChild(div);

    const scrollbarWidth = div.offsetWidth - div.clientWidth;
    const scrollbarHeight = div.offsetHeight - div.clientHeight;

    document.body.removeChild(div);

    sessionStorage.setItem("scrollbarWidth", scrollbarWidth);
    sessionStorage.setItem("scrollbarHeight", scrollbarHeight);
}

// -----------------------------
// Load scrollbar sizes from session storage
// -----------------------------
const scrollbarWidth = parseFloat(sessionStorage.getItem("scrollbarWidth"));
const scrollbarHeight = parseFloat(sessionStorage.getItem("scrollbarHeight"));

if (!scrollbarWidth || !scrollbarHeight) setScrollbarSizes();
// console.log("vertical scrollbar width:", scrollbarWidth);
// console.log("horizontal scrollbar height:", scrollbarHeight);
