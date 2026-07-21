const linkedin = document.getElementById('linkedin');
const email = document.getElementById('email');

// -----------------------------
// Hover animations
// -----------------------------
linkedin.addEventListener('mouseenter', () => {
    linkedin.children[0].setAttribute('src', 'https://img.icons8.com/ios-filled/100/linkedin.png');
});

linkedin.addEventListener('mouseleave', () => {
    linkedin.children[0].setAttribute('src', 'https://img.icons8.com/ios/100/linkedin.png');
});

email.addEventListener('mouseenter', () => {
    email.children[0].setAttribute('src', 'https://img.icons8.com/ios-filled/100/new-post.png');
});

email.addEventListener('mouseleave', () => {
    email.children[0].setAttribute('src', 'https://img.icons8.com/ios/100/new-post--v1.png');
});
