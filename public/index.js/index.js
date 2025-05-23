const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');
const navLogo = document.querySelector('#navbar__logo');

// Display mobile menu
const mobileMenu = () => {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
};
menu.addEventListener('click', mobileMenu);

// show active menu when scrolling 
const highlightMenu = () => {
    const elem = document.querySelector('.highlight');
    const homeMenu = document.querySelector('#home-page');
    const aboutMenu = document.querySelector('#about-page');
    const serviceMenu = document.querySelector('#services-page');
    let scrollpos = window.scrollY;

    //add 'highlight' class to menu items 
    if (window.innerWidth > 960 && scrollpos < 600) {
        homeMenu.classList.add('highlight');
        aboutMenu.classList.remove('highlight');
        return;
    } else if (window.innerWidth > 960 && scrollpos < 1400) {
        aboutMenu.classList.add('highlight');
        homeMenu.classList.remove('highlight');
        serviceMenu.classList.remove('highlight');
        return;
    } else if (window.innerWidth > 960 && scrollpos < 2345) {
        serviceMenu.classList.add('highlight');
        aboutMenu.classList.remove('highlight');
        return;
    }

    if ((elem && window.innerWidth < 960 && scrollpos < 600) || elem) {
        elem.classList.remove('highlight');
    }
};

window.addEventListener('scroll', highlightMenu);
window.addEventListener('click', highlightMenu);

// Fade in/out hero section on scroll
document.addEventListener('scroll', function() {
    const hero = document.querySelector('.hero-bg-container');
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    let opacity = 1;
    if (rect.top < 0) {
        opacity = Math.max(0, 1 + rect.top / windowHeight);
    }
    hero.style.opacity = opacity;
});

// document.addEventListener('DOMContentLoaded', function() {
//     const signupForm = document.getElementById('signup-form');
//     if (signupForm) {
//         signupForm.addEventListener('submit', async function(event) {
//             event.preventDefault();
//             const formData = new FormData(signupForm);
//             const data = Object.fromEntries(formData.entries());
//             try {
//                 const response = await fetch('/api/signup', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify(data)
//                 });
//                 const result = await response.json();
//                 if (response.ok) {
//                     alert('Sign-up successful! Welcome, ' + result.username + ' (' + result.role + ')');
//                     signupForm.reset();
//                     window.location.href = 'index.html';
//                 } else {
//                     alert('Sign-up failed: ' + (result.message || 'Unknown error'));
//                 }
//             } catch (err) {
//                 alert('Network error');
//             }
//         });
//     }
// });

document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'Customer') {
        fetch('/api/posts')
            .then(res => res.json())
            .then(posts => {
                // Render posts in the DOM
                const postsContainer = document.getElementById('posts-container');
                if (postsContainer) {
                    postsContainer.innerHTML = posts.map(post => `
                        <div class="post-card">
                            <h3>${post.author}</h3>
                            <p>${post.content}</p>
                            <small>${new Date(post.date).toLocaleString()}</small>
                        </div>
                    `).join('');
                }
            });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const imgContainers = document.querySelectorAll('.services__img-container');

    function checkVisibility() {
        imgContainers.forEach(container => {
            const rect = container.getBoundingClientRect();
            if (
                rect.top < window.innerHeight - 60 && // 60px offset for earlier reveal
                rect.bottom > 0
            ) {
                container.classList.add('visible');
            } else {
                container.classList.remove('visible');
            }
        });
    }

    // Initial check
    checkVisibility();

    // On scroll and resize
    window.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);
});

document.addEventListener('DOMContentLoaded', function() {
    const icons = document.querySelectorAll('.main__img--animation .shop-icon');
    const cursor = document.querySelector('.main__img--animation .cursor-icon');
    if (!icons.length || !cursor) return;

    let index = 0;
    function animateCursor() {
        icons.forEach((icon, i) => icon.classList.remove('active'));
        icons[index].classList.add('active');

        // Position cursor near the active icon
        const iconRect = icons[index].getBoundingClientRect();
        const parentRect = icons[index].parentElement.getBoundingClientRect();
        cursor.style.top = (icons[index].offsetTop + 8) + 'px';
        cursor.style.left = '70%';
        cursor.style.opacity = 1;

        // "Click" effect
        cursor.classList.add('clicking');
        setTimeout(() => {
            cursor.classList.remove('clicking');
            cursor.style.opacity = 0;
            index = (index + 1) % icons.length;
            setTimeout(animateCursor, 700);
        }, 500);
    }

    animateCursor();
});

document.addEventListener('DOMContentLoaded', function() {
    // Animate "Shoplink" text in iPad frame
    const ipadTitle = document.getElementById('ipad-app-title');
    if (ipadTitle) {
        const text = "Shoplink";
        let i = 0;
        function animateText() {
            ipadTitle.textContent = text.substring(0, i);
            i++;
            if (i <= text.length) {
                setTimeout(animateText, 180);
            } else {
                setTimeout(() => {
                    i = 0;
                    animateText();
                }, 1200);
            }
        }
        animateText();
    }
});



