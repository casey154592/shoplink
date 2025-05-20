document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html'; // Or your login page
        return;
    }

    // Fetch posts and store them for searching
    let allPosts = [];
    fetch('/api/posts')
        .then(res => res.json())
        .then(posts => {
            allPosts = posts;
            renderPosts(posts);
        });

    // Render posts function
    function renderPosts(posts) {
        const feedPosts = document.getElementById('feed-posts');
        if (!posts.length) {
            feedPosts.innerHTML = '<p>No posts yet.</p>';
            return;
        }
        feedPosts.innerHTML = posts.map(post => `
            <div class="post-card">
                <h3>${post.author}</h3>
                <p>${post.content}</p>
                ${post.videoUrl ? `<video controls width="320"><source src="${post.videoUrl}" type="video/mp4"></video>` : ''}
                <small>${new Date(post.date).toLocaleString()}</small>
            </div>
        `).join('');
    }

    // Search functionality
    const searchToggle = document.getElementById('search-toggle');
    const searchBar = document.getElementById('search-bar');

    if (searchToggle && searchBar) {
        searchToggle.addEventListener('click', function() {
            searchBar.classList.toggle('active');
            if (searchBar.classList.contains('active')) {
                searchBar.style.display = 'inline-block';
                searchBar.focus();
            } else {
                searchBar.style.display = 'none';
                searchBar.value = '';
                renderPosts(allPosts);
            }
        });

        searchBar.addEventListener('input', function() {
            const query = searchBar.value.toLowerCase();
            const filtered = allPosts.filter(post =>
                post.author.toLowerCase().includes(query) ||
                post.content.toLowerCase().includes(query)
            );
            renderPosts(filtered);
        });
    }

    // Logout functionality
    document.getElementById('side-logout-btn').addEventListener('click', function() {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    // Slide-in menu functionality and profile info
    const sideMenu = document.getElementById('side-menu');
    const openMenu = document.getElementById('open-menu');
    const closeMenu = document.getElementById('close-menu');
    const sideLogoutBtn = document.getElementById('side-logout-btn');

    // Show user profile info in the menu
    if (user) {
        document.getElementById('side-profile-username').textContent = user.username || '';
        document.getElementById('side-profile-email').textContent = user.email || '';
        document.getElementById('side-profile-role').textContent = user.role ? `Role: ${user.role}` : '';
        document.getElementById('side-profile-bio').textContent = user.bio || '';
        document.getElementById('side-profile-pic').src = user.profilePictureUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username || 'User');
    }

    openMenu.addEventListener('click', function() {
        sideMenu.style.width = '260px';
    });

    closeMenu.addEventListener('click', function() {
        sideMenu.style.width = '0';
    });

    if (sideLogoutBtn) {
        sideLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Chat button functionality
    const chatBtn = document.getElementById('chat-btn');
    if (chatBtn) {
        chatBtn.addEventListener('click', function() {
            alert('Chat feature coming soon! You will be able to chat with other registered users.');
            // You can link to a chat page or open a chat modal here in the future
        });
    }

    // Example: Update cart badge with number of items
    const cartBtn = document.getElementById('cart-btn');
    const cartBadge = document.getElementById('cart-badge');
    // Suppose you store cart items in localStorage as an array
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    if (cartItems.length > 0) {
        cartBadge.textContent = cartItems.length;
        cartBadge.style.display = 'inline-block';
    } else {
        cartBadge.style.display = 'none';
    }

    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            window.location.href = 'cart.html'; // Or your cart page
        });
    }
});