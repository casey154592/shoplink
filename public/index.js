document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('navbar-toggle');
    const menu = document.getElementById('navbar-menu');
    toggle.addEventListener('click', function() {
        menu.classList.toggle('active');
    });
    // Optional: close menu when clicking a link (for better UX)
    document.querySelectorAll('.navbar__menu a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
        });
    });
});